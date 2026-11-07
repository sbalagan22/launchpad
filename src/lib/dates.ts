const DAY = 86_400_000;

/** ISO timestamp `n` days from now (negative = past), at a fixed working hour. */
export function daysFromNow(n: number, hour = 14, minute = 0): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return new Date(d.getTime() + n * DAY).toISOString();
}

export function fmtDate(iso: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }): string {
  return new Date(iso).toLocaleDateString("en-CA", opts);
}

export function fmtMonthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { month: "long", year: "numeric" });
}

export function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60_000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 14) return `${d} d ago`;
  return fmtDate(iso);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / DAY);
}

export function weeksUntil(iso: string): number {
  return Math.max(1, Math.round((new Date(iso).getTime() - Date.now()) / (7 * DAY)));
}
