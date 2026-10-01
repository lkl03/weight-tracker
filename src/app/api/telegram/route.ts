import { NextRequest, NextResponse } from "next/server";
import { createEntry, getLatestEntry } from "@/lib/firestore";
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

    const today = getTodayBsAs();

    // Get the most recent entry to compare
    const previousEntry = await getLatestEntry();
    const previousWeight = previousEntry?.weightKg ?? null;

    await createEntry({
      id: randomUUID(),
      date: today,
      time: parsed.time,
      weightKg: parsed.weight,
      notes: null,
      source: "telegram",
      createdAt: new Date().toISOString(),
    });

    const msg = buildConfirmationMessage(parsed.weight, parsed.time, previousWeight);
    await sendTelegramMessage(String(chatId), msg);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
