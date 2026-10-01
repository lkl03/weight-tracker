import { NextRequest, NextResponse } from "next/server";
import { createEntry, listEntries } from "@/lib/firestore";
import type { WeightEntryInsert } from "@/types";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const limit = searchParams.get("limit");

    const entries = await listEntries({
      from: searchParams.get("from"),
      to: searchParams.get("to"),
      limit: limit ? parseInt(limit) : null,
    });

    return NextResponse.json({ entries });
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

    const entry = await createEntry({
      id: body.id ?? randomUUID(),
      date: body.date,
      time: body.time,
      weightKg: body.weightKg,
      notes: body.notes ?? null,
      source: body.source ?? "manual",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
