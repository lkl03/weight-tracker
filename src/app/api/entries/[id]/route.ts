import { NextRequest, NextResponse } from "next/server";
import { createServerClient, dbRowToEntry } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const db = createServerClient();
    const { data, error } = await db
      .from("weight_entries")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ entry: dbRowToEntry(data) });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.weightKg != null) updates.weight_kg = body.weightKg;
    if (body.time != null) updates.time = body.time;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.source != null) updates.source = body.source;

    const db = createServerClient();
    const { data, error } = await db
      .from("weight_entries")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) return NextResponse.json({ error: "Not found or update failed" }, { status: 404 });
    return NextResponse.json({ entry: dbRowToEntry(data) });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const db = createServerClient();
    const { error } = await db.from("weight_entries").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
