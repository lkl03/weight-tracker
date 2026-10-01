/**
 * Seed script: imports data/seed.json into Firestore.
 * Run: npx tsx scripts/seed.ts
 *
 * Requires the FIREBASE_* variables in .env.local
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { readFileSync } from "fs";
import { join } from "path";
import { COLLECTION, getDb, normalizeTime, type WeightEntryDoc } from "../src/lib/firestore";

interface SeedEntry {
  id: string;
  date: string;
  time: string;
  weightKg: number;
  notes?: string | null;
  source: WeightEntryDoc["source"];
  createdAt: string;
  updatedAt?: string | null;
}

async function main() {
  const seedPath = join(process.cwd(), "data", "seed.json");
  const entries: SeedEntry[] = JSON.parse(readFileSync(seedPath, "utf-8"));

  console.log(`Seeding ${entries.length} entries...`);

  // set() by id = upsert, safe to run multiple times
  const db = getDb();
  const col = db.collection(COLLECTION);
  const writer = db.bulkWriter();
  for (const e of entries) {
    const doc: WeightEntryDoc = {
      date: e.date,
      time: normalizeTime(e.time),
      weight_kg: e.weightKg,
      notes: e.notes ?? null,
      source: e.source,
      created_at: e.createdAt,
      updated_at: e.updatedAt ?? null,
    };
    writer.set(col.doc(e.id), doc);
  }
  await writer.close();

  console.log(`\nDone! Inserted/updated ${entries.length} entries.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
