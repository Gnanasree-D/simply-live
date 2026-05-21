export function startOfDay(d: Date, tzOffsetMinutes = d.getTimezoneOffset()): Date {
  const local = new Date(d.getTime() - tzOffsetMinutes * 60_000);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() + tzOffsetMinutes * 60_000);
}

export function endOfDay(d: Date, tzOffsetMinutes = d.getTimezoneOffset()): Date {
  const start = startOfDay(d, tzOffsetMinutes);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function daysBetween(a: Date, b: Date): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function toInputDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function toInputTime(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/** Monday of the week containing the given date. Local-time aware. */
export function startOfWeek(d: Date): Date {
  const day = d.getDay(); // 0 = Sun ... 6 = Sat
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    return day;
  });
}

/** "Mon, May 18" — inline meta. Drops year for current year. */
export function formatInlineDate(d: Date, now = new Date()): string {
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/** "May 18, 2026" — explicit target dates. Always includes year. */
export function formatTargetDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
