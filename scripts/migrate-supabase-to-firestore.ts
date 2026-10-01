/**
 * One-off migration: copies every row of Supabase `weight_entries` into the
 * Firestore `weight_entries` collection, using the Supabase UUID as doc id.
 *
 * Idempotent — re-running overwrites docs with the current Supabase values,
 * so it can be run again right after cutover to pick up any late writes.
 * Never deletes anything; Firestore docs missing from Supabase are reported.
 *
 * Run:  npx tsx scripts/migrate-supabase-to-firestore.ts            (copy + verify)
 *       npx tsx scripts/migrate-supabase-to-firestore.ts --verify   (verify only)
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and the
 * FIREBASE_* variables in .env.local.
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { COLLECTION, getDb, type WeightEntryDoc } from "../src/lib/firestore";

type Row = WeightEntryDoc & { id: string };

async function fetchSupabase(): Promise<Row[]> {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const rows: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("weight_entries").select("*").order("id").range(from, from + 999);
    if (error) throw error;
    for (const r of data) {
      rows.push({
        id: r.id,
        date: r.date,
        time: r.time,
        weight_kg: Number(r.weight_kg),
        notes: r.notes ?? null,
        source: r.source,
        created_at: r.created_at,
        updated_at: r.updated_at ?? null,
      });
    }
    if (data.length < 1000) break;
  }
  return rows;
}

// Same formula as the SQL check run against Postgres:
// md5(string_agg(id||date||time||weight_kg::text||coalesce(notes,'')||source, '|' order by id))
function checksum(rows: Row[]): string {
  const parts = [...rows]
    .sort((a, b) => (a.id < b.id ? -1 : 1))
    .map((r) => r.id + r.date + r.time + r.weight_kg.toFixed(2) + (r.notes ?? "") + r.source);
  return createHash("md5").update(parts.join("|")).digest("hex");
}

const FIELDS: (keyof WeightEntryDoc)[] = ["date", "time", "weight_kg", "notes", "source", "created_at", "updated_at"];

async function main() {
  const verifyOnly = process.argv.includes("--verify");
  const db = getDb();
  const col = db.collection(COLLECTION);

  const source = await fetchSupabase();
  console.log(`Supabase: ${source.length} rows`);

  if (!verifyOnly) {
    const writer = db.bulkWriter();
    for (const { id, ...doc } of source) writer.set(col.doc(id), doc);
    await writer.close();
    console.log(`Wrote ${source.length} docs to Firestore`);
  }

  const snap = await col.get();
  const target = new Map(snap.docs.map((d) => [d.id, d.data() as WeightEntryDoc]));
  console.log(`Firestore: ${target.size} docs`);

  const missing: string[] = [];
  const mismatched: string[] = [];
  for (const row of source) {
    const doc = target.get(row.id);
    if (!doc) { missing.push(row.id); continue; }
    const diff = FIELDS.filter((f) => (doc[f] ?? null) !== (row[f] ?? null));
    if (diff.length) mismatched.push(`${row.id} (${diff.join(", ")})`);
  }
  const sourceIds = new Set(source.map((r) => r.id));
  const extra = [...target.keys()].filter((id) => !sourceIds.has(id));

  console.log(`Supabase checksum:  ${checksum(source)}`);
  console.log(`Firestore checksum: ${checksum(source.filter((r) => target.has(r.id)).map((r) => ({ ...target.get(r.id)!, id: r.id })))}`);
  console.log(`Missing in Firestore: ${missing.length}${missing.length ? " → " + missing.join(", ") : ""}`);
  console.log(`Field mismatches:     ${mismatched.length}${mismatched.length ? " → " + mismatched.join("; ") : ""}`);
  console.log(`Only in Firestore:    ${extra.length}${extra.length ? " → " + extra.join(", ") : ""} (new since cutover, or deleted in Supabase)`);

  if (missing.length || mismatched.length) {
    console.error("\nVERIFY FAILED");
    process.exit(1);
  }
  console.log("\nVERIFY OK — every Supabase row is in Firestore with identical values.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
