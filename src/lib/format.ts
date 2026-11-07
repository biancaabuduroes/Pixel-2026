import { formatRon } from "@/domain/money";

// Display-time formatting of server-computed values (Romanian). Never used for calculations.

/** 9499 → "94,99" (ladder tiles show prices without the currency). */
export const priceNumber = (bani: number) => formatRon(bani).replace(" RON", "");

/** 1 bunToken = 1 RON (BUSINESS_LOGIC.md): 9499 → "94,99 bunToken". */
export const formatToken = (bani: number) => `${priceNumber(bani)} bunToken`;

/** Thresholds are in units (decision 2026-11-07): "1 unitate", "3 unități". */
export const units = (n: number) => `${n} ${n === 1 ? "unitate" : "unități"}`;

const TZ = "Europe/Bucharest";
const weekday = new Intl.DateTimeFormat("ro-RO", { weekday: "long", timeZone: TZ });
const time = new Intl.DateTimeFormat("ro-RO", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
const day = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "long", timeZone: TZ });
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });

/** "azi", "mâine", "joi" or "12 noiembrie" — relative to `now`. */
export function dayLabel(date: Date, now: Date): string {
  const diffDays = Math.round((Date.parse(dayKey.format(date)) - Date.parse(dayKey.format(now))) / 86_400_000);
  if (diffDays === 0) return "azi";
  if (diffDays === 1) return "mâine";
  if (diffDays > 1 && diffDays < 7) return weekday.format(date);
  return day.format(date);
}
export const timeLabel = (date: Date) => time.format(date);

/** "în 3 zile", "în 5 ore", "în 20 de minute" (Romanian "de" from 20 up). */
export function inDuration(ms: number): string {
  const de = (n: number) => (n % 100 >= 20 || n % 100 === 0 ? "de " : "");
  const minutes = Math.max(1, Math.round(ms / 60_000));
  if (minutes < 60) return `în ${minutes} ${de(minutes)}${minutes === 1 ? "minut" : "minute"}`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `în ${hours} ${de(hours)}${hours === 1 ? "oră" : "ore"}`;
  const days = Math.round(hours / 24);
  return `în ${days} ${de(days)}zile`;
}

/** Short order reference shown to buyer and seller, e.g. "CL-4F2A9C". */
export const orderRef = (id: string) => `CL-${id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()}`;

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}
