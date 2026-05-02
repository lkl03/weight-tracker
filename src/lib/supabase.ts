import { createClient } from "@supabase/supabase-js";
import type { WeightEntry, WeightEntryInsert } from "@/types";

// Lazy clients — never call createClient() at module initialization so that
// builds without env vars (CI, static analysis) do not throw.
export function getPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Convenience alias kept for backward compat in client components
export const supabase = {
  get from() { return getPublicClient().from.bind(getPublicClient()); },
};

export type Database = {
  public: {
    Tables: {
      weight_entries: {
        Row: {
          id: string;
          date: string;
          time: string;
          weight_kg: number;
          notes: string | null;
          source: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["weight_entries"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["weight_entries"]["Insert"]>;
      };
    };
  };
};

// Mappers between DB and app types
export function dbRowToEntry(row: Database["public"]["Tables"]["weight_entries"]["Row"]): WeightEntry {
  return {
    id: row.id,
    date: row.date,
    time: row.time,
    weightKg: Number(row.weight_kg),
    notes: row.notes,
    source: row.source as WeightEntry["source"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function entryToDbRow(entry: WeightEntryInsert): Database["public"]["Tables"]["weight_entries"]["Insert"] {
  return {
    id: entry.id ?? undefined,
    date: entry.date,
    time: entry.time,
    weight_kg: entry.weightKg,
    notes: entry.notes ?? null,
    source: entry.source,
    created_at: entry.createdAt ?? undefined,
    updated_at: null,
  };
}
