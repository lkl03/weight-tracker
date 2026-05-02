const TELEGRAM_API = "https://api.telegram.org/bot";

export async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN not set");

  const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Telegram API error: ${err}`);
  }
}

export function isAllowedChat(chatId: number | string): boolean {
  const allowed = process.env.TELEGRAM_ALLOWED_CHAT_ID;
  if (!allowed) return false;
  return String(chatId) === String(allowed);
}

export function buildConfirmationMessage(
  weight: number,
  time: string,
  previousWeight: number | null
): string {
  const diff = previousWeight !== null ? weight - previousWeight : null;

  let reaction = "";
  if (diff === null) {
    reaction = "Primer registro cargado 🎯";
  } else if (Math.abs(diff) > 1) {
    const sign = diff > 0 ? "+" : "";
    reaction = `Ojo: hay una variación de ${sign}${diff.toFixed(1)} kg vs el registro anterior. Puede ser normal, pero lo marco para que lo tengas presente.`;
  } else if (diff < 0) {
    reaction = `Bajaste ${Math.abs(diff).toFixed(1)} kg vs el registro anterior, congrats 🔥`;
  } else if (diff > 0) {
    reaction = `Subiste ${diff.toFixed(1)} kg vs el registro anterior.`;
  } else {
    reaction = "Igual que el registro anterior. Bien hecho 💪";
  }

  const prevText =
    previousWeight !== null
      ? diff !== null && diff !== 0
        ? `\nAnterior: ${previousWeight.toFixed(1)} kg`
        : ""
      : "";

  return `✅ <b>Listo Luca, cargué ${weight.toFixed(1)} kg para hoy a las ${time}.</b>${prevText}\n${reaction}`;
}

export function buildHelpMessage(): string {
  return `<b>🏋️ Weight Tracker — Guía rápida</b>

<b>Cargar un registro:</b>
Mandá un mensaje con este formato:
<code>HH:MM PESO</code>

Ejemplos:
<code>8:55 73.2</code>
<code>07:30 72.8</code>

<b>La fecha siempre es la de hoy.</b>

<b>Qué hace el bot:</b>
• Guarda el registro automáticamente.
• Te compara con el peso anterior.
• A las 23:00 te manda un recordatorio si no registraste.
• Si no registraste, autocompleta con el peso del día anterior.

<b>Ver la app:</b>
${process.env.NEXT_PUBLIC_APP_URL ?? "Ver tu dashboard web"}`;
}
