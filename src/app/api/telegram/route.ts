import { NextRequest, NextResponse } from "next/server";
import { createServerClient, dbRowToEntry, entryToDbRow } from "@/lib/supabase";
import {
  isAllowedChat,
  sendTelegramMessage,
  buildConfirmationMessage,
  buildHelpMessage,
} from "@/lib/telegram";
import { parseTelegramMessage, getTodayBsAs } from "@/lib/utils";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    // Validate webhook secret
    const secret = req.headers.get("x-telegram-bot-api-secret-token");
    if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const message = body?.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = message.chat?.id;
    const text: string = message.text ?? "";

    if (!isAllowedChat(chatId)) {
      await sendTelegramMessage(String(chatId), "No estás autorizado para usar este bot.");
      return NextResponse.json({ ok: true });
    }

    const lowerText = text.trim().toLowerCase();

    if (lowerText === "ayuda" || lowerText === "/ayuda" || lowerText === "/help" || lowerText === "/start") {
      await sendTelegramMessage(String(chatId), buildHelpMessage());
      return NextResponse.json({ ok: true });
    }

    const parsed = parseTelegramMessage(text);
    if (!parsed) {
      await sendTelegramMessage(
        String(chatId),
        `No entendí ese formato. Usá:\n<code>HH:MM PESO</code>\nEjemplo: <code>8:55 73.2</code>\n\nMandá <b>ayuda</b> para más info.`
      );
      return NextResponse.json({ ok: true });
    }

    const db = createServerClient();
    const today = getTodayBsAs();

    // Get the most recent entry to compare
    const { data: recentRows } = await db
      .from("weight_entries")
      .select("*")
      .order("date", { ascending: false })
      .order("time", { ascending: false })
      .limit(1);

    const previousEntry = recentRows?.[0] ? dbRowToEntry(recentRows[0]) : null;
    const previousWeight = previousEntry?.weightKg ?? null;

    const entry = {
      id: randomUUID(),
      date: today,
      time: parsed.time,
      weight_kg: parsed.weight,
      notes: null,
      source: "telegram",
      created_at: new Date().toISOString(),
      updated_at: null,
    };

    const { error } = await db.from("weight_entries").insert(entry);
    if (error) throw error;

    const msg = buildConfirmationMessage(parsed.weight, parsed.time, previousWeight);
    await sendTelegramMessage(String(chatId), msg);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
