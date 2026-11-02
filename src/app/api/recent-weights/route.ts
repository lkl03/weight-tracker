import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { listEntries } from "@/lib/firestore";

// Read-only feed for the gym-tracker dashboard. It only exposes date, time and
// weight of the latest entries, behind its own bearer secret.
const RECENT_ENTRIES = 30;

function isAuthorized(header: string | null): boolean {
  const secret = process.env.WEIGHT_READ_SECRET;
  // Fail closed: without a configured secret nobody gets in.
  if (!secret || !header) return false;
  const given = Buffer.from(header);
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const entries = await listEntries({ limit: RECENT_ENTRIES });
    return NextResponse.json({
      entries: entries.map(({ date, time, weightKg }) => ({ date, time, weightKg })),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
