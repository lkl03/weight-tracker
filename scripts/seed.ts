/**
 * Seed script: imports weight_entries_seed.json into Supabase.
 * Run: npx tsx scripts/seed.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const db = createClient(supabaseUrl, serviceKey);

interface SeedEntry {
  id: string;
  date: string;
  time: string;
  weightKg: number;
  notes?: string | null;
  source: string;
  createdAt: string;
  updatedAt?: string | null;
}

async function main() {
  const seedPath = join(process.cwd(), "data", "seed.json");
  const raw = readFileSync(seedPath, "utf-8");
  const entries: SeedEntry[] = JSON.parse(raw);

  console.log(`Seeding ${entries.length} entries...`);

  const rows = entries.map((e) => ({
    id: e.id,
    date: e.date,
    time: e.time,
    weight_kg: e.weightKg,
    notes: e.notes ?? null,
    source: e.source,
    created_at: e.createdAt,
    updated_at: e.updatedAt ?? null,
  }));

  // Insert in batches of 100
  const batchSize = 100;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await db.from("weight_entries").upsert(batch, { onConflict: "id" });
    if (error) {
      console.error(`Error at batch ${i}:`, error);
      process.exit(1);
    }
    inserted += batch.length;
    console.log(`  ${inserted}/${rows.length}`);
  }

  console.log(`\nDone! Inserted/updated ${inserted} entries.`);
}

main().catch(console.error);
