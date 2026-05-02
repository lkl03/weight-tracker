import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { sendTelegramMessage } from "@/lib/telegram";
import { getTodayBsAs } from "@/lib/utils";
import { randomUUID } from "crypto";

// Runs via Vercel Cron at 02:00 UTC = 23:00 America/Argentina/Buenos_Aires
export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get("authorization");
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chatId = process.env.TELEGRAM_ALLOWED_CHAT_ID;
  if (!chatId) return NextResponse.json({ error: "No chat ID configured" }, { status: 500 });

  const db = createServerClient();
  const today = getTodayBsAs();

  // Check if there is already a record for today
  const { data: todayRows } = await db
    .from("weight_entries")
    .select("id")
    .eq("date", today)
    .limit(1);

  if (todayRows && todayRows.length > 0) {
    // Already registered today, no action needed
    return NextResponse.json({ skipped: true, reason: "Entry exists for today" });
  }

  // Get the most recent entry (yesterday or before)
  const { data: recentRows } = await db
    .from("weight_entries")
    .select("*")
    .order("date", { ascending: false })
    .order("time", { ascending: false })
    .limit(1);

  if (!recentRows || recentRows.length === 0) {
    await sendTelegramMessage(
      chatId,
      "Luca, hoy no recibí registro. No encontré un peso anterior para autocompleto. Mandame tu peso cuando puedas."
    );
    return NextResponse.json({ ok: true, action: "reminded_no_previous" });
  }

  const previous = recentRows[0];
  const previousWeight = Number(previous.weight_kg);

  // Auto-fill with previous weight
  const autoEntry = {
    id: randomUUID(),
    date: today,
    time: "23:00",
    weight_kg: previousWeight,
    notes: "Autocompletado por falta de registro diario.",
    source: "auto-filled",
    created_at: new Date().toISOString(),
    updated_at: null,
  };

  const { error } = await db.from("weight_entries").insert(autoEntry);
  if (error) {
    console.error("Cron: error inserting auto-fill entry:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }

  await sendTelegramMessage(
    chatId,
    `⏰ <b>Luca, hoy no recibí registro.</b>\n\nTe dejo cargado automáticamente el peso de ayer: <b>${previousWeight.toFixed(1)} kg</b>.\n\n📝 Nota: autocompletado por falta de registro diario.`
  );

  return NextResponse.json({ ok: true, action: "auto_filled", weight: previousWeight });
}
