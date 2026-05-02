import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatWeight(kg: number): string {
  return `${kg.toFixed(1)} kg`;
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getTodayBsAs(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

export function getNowBsAs(): { date: string; time: string } {
  const now = new Date();
  const date = now.toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
  const time = now.toLocaleTimeString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return { date, time };
}

export function getAgeFromBirthdate(birthdate: Date): { years: number; days: number } {
  const now = new Date();
  let years = now.getFullYear() - birthdate.getFullYear();
  const monthDiff = now.getMonth() - birthdate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthdate.getDate())) {
    years--;
  }
  const lastBirthday = new Date(
    now.getFullYear() - (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthdate.getDate()) ? 1 : 0),
    birthdate.getMonth(),
    birthdate.getDate()
  );
  const days = Math.floor((now.getTime() - lastBirthday.getTime()) / (1000 * 60 * 60 * 24));
  return { years, days };
}

export function parseTelegramMessage(text: string): { time: string; weight: number } | null {
  const trimmed = text.trim();
  // Format: "HH:MM 73.2" or "H:MM 73.2"
  const match = trimmed.match(/^(\d{1,2}:\d{2})\s+(\d{2,3}(?:[.,]\d{1,2})?)$/);
  if (!match) return null;
  const time = match[1].padStart(5, "0");
  const weight = parseFloat(match[2].replace(",", "."));
  if (isNaN(weight) || weight < 30 || weight > 300) return null;
  const [h, m] = time.split(":").map(Number);
  if (h > 23 || m > 59) return null;
  return { time, weight };
}

const MOTIVATIONAL_MESSAGES = [
  "Cada registro que haces es una decisión consciente. Eso es lo que importa.",
  "La constancia es el superpoder más subestimado.",
  "No se trata de ser perfecto, se trata de seguir.",
  "Un día a la vez construye resultados de largo plazo.",
  "El cuerpo responde cuando la mente lidera.",
  "Lo que se mide, mejora.",
  "Estás construyendo un hábito que durará décadas.",
  "Cada dato que cargás es evidencia de tu compromiso.",
];

export function getDailyMotivation(): string {
  const day = new Date().getDate();
  return MOTIVATIONAL_MESSAGES[day % MOTIVATIONAL_MESSAGES.length];
}
