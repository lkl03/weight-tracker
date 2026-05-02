import { NextRequest, NextResponse } from "next/server";
import { createServerClient, dbRowToEntry, entryToDbRow } from "@/lib/supabase";
import { getTodayBsAs } from "@/lib/utils";
import type { WeightEntryInsert } from "@/types";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = searchParams.get("limit");

    const db = createServerClient();
    let query = db
      .from("weight_entries")
      .select("*")
      .order("date", { ascending: false })
      .order("time", { ascending: false });

    if (from) query = query.gte("date", from);
    if (to) query = query.lte("date", to);
    if (limit) query = query.limit(parseInt(limit));

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ entries: (data ?? []).map(dbRowToEntry) });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<WeightEntryInsert>;

    if (!body.date || !body.time || body.weightKg == null) {
      return NextResponse.json({ error: "Missing required fields: date, time, weightKg" }, { status: 400 });
    }

    const entry: WeightEntryInsert = {
      id: body.id ?? randomUUID(),
      date: body.date,
      time: body.time,
      weightKg: body.weightKg,
      notes: body.notes ?? null,
      source: body.source ?? "manual",
      createdAt: new Date().toISOString(),
    };

    const db = createServerClient();
    const { data, error } = await db
      .from("weight_entries")
      .insert(entryToDbRow(entry))
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ entry: dbRowToEntry(data) }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
