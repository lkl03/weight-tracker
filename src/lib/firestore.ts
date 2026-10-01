import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import type { WeightEntry, WeightEntryInsert } from "@/types";

export const COLLECTION = "weight_entries";

// Stored document shape. Field names and string formats mirror the original
// Supabase/Postgres row so migrated and new entries are indistinguishable.
export type WeightEntryDoc = {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  weight_kg: number;
  notes: string | null;
  source: WeightEntry["source"];
  created_at: string; // ISO timestamp
  updated_at: string | null;
};

// Lazy init — never touch credentials at module load so builds without env
// vars (CI, static analysis) do not throw.
let db: Firestore | null = null;

export function getDb(): Firestore {
  if (db) return db;
  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  db = getFirestore(app);
  return db;
}

function entries() {
  return getDb().collection(COLLECTION);
}

// Postgres `time` always returned HH:MM:SS; keep that format for new writes.
export function normalizeTime(time: string): string {
  const [h = "0", m = "0", s = "0"] = time.split(":");
  return [h, m, s].map((p) => p.padStart(2, "0")).join(":");
}

export function docToEntry(id: string, doc: WeightEntryDoc): WeightEntry {
  return {
    id,
    date: doc.date,
    time: doc.time,
    weightKg: Number(doc.weight_kg),
    notes: doc.notes ?? null,
    source: doc.source,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at ?? null,
  };
}

function snapToEntry(snap: FirebaseFirestore.DocumentSnapshot): WeightEntry {
  return docToEntry(snap.id, snap.data() as WeightEntryDoc);
}

export async function listEntries(opts: {
  from?: string | null;
  to?: string | null;
  limit?: number | null;
  direction?: "asc" | "desc";
} = {}): Promise<WeightEntry[]> {
  const dir = opts.direction ?? "desc";
  let query: FirebaseFirestore.Query = entries();
  if (opts.from) query = query.where("date", ">=", opts.from);
  if (opts.to) query = query.where("date", "<=", opts.to);
  query = query.orderBy("date", dir).orderBy("time", dir);
  if (opts.limit) query = query.limit(opts.limit);
  const snap = await query.get();
  return snap.docs.map(snapToEntry);
}

export async function getLatestEntry(): Promise<WeightEntry | null> {
  const [latest] = await listEntries({ limit: 1 });
  return latest ?? null;
}

export async function hasEntryForDate(date: string): Promise<boolean> {
  const snap = await entries().where("date", "==", date).limit(1).get();
  return !snap.empty;
}

export async function getEntry(id: string): Promise<WeightEntry | null> {
  const snap = await entries().doc(id).get();
  return snap.exists ? snapToEntry(snap) : null;
}

export async function createEntry(entry: WeightEntryInsert & { id: string }): Promise<WeightEntry> {
  const doc: WeightEntryDoc = {
    date: entry.date,
    time: normalizeTime(entry.time),
    weight_kg: entry.weightKg,
    notes: entry.notes ?? null,
    source: entry.source,
    created_at: entry.createdAt ?? new Date().toISOString(),
    updated_at: null,
  };
  // create() fails if the id already exists, matching the old INSERT semantics.
  await entries().doc(entry.id).create(doc);
  return docToEntry(entry.id, doc);
}

export async function updateEntry(
  id: string,
  updates: Partial<Pick<WeightEntry, "weightKg" | "time" | "notes" | "source">>
): Promise<WeightEntry | null> {
  const ref = entries().doc(id);
  const patch: Partial<WeightEntryDoc> = { updated_at: new Date().toISOString() };
  if (updates.weightKg != null) patch.weight_kg = updates.weightKg;
  if (updates.time != null) patch.time = normalizeTime(updates.time);
  if (updates.notes !== undefined) patch.notes = updates.notes;
  if (updates.source != null) patch.source = updates.source;
  try {
    await ref.update(patch);
  } catch {
    return null; // update() throws NOT_FOUND for missing docs
  }
  return getEntry(id);
}

export async function deleteEntry(id: string): Promise<void> {
  await entries().doc(id).delete();
}
