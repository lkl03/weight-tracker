import { NextRequest, NextResponse } from "next/server";
import { deleteEntry, getEntry, updateEntry } from "@/lib/firestore";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const entry = await getEntry(id);
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ entry });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();

    const entry = await updateEntry(id, {
      weightKg: body.weightKg ?? undefined,
      time: body.time ?? undefined,
      notes: body.notes,
      source: body.source ?? undefined,
    });

    if (!entry) return NextResponse.json({ error: "Not found or update failed" }, { status: 404 });
    return NextResponse.json({ entry });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await deleteEntry(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
