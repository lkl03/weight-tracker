import { createClient } from "@supabase/supabase-js";
import type { WeightEntry, WeightEntryInsert } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Public client (for read operations from the browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with elevated permissions
export function createServerClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

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
