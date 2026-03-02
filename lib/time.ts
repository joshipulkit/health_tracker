export function nowIso() {
  return new Date().toISOString();
}

export function toDateKey(input: string | Date) {
  const date = typeof input === "string" ? new Date(input) : input;
  return date.toISOString().slice(0, 10);
}

export function daysAgo(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

export function startAndEndForPeriod(period: "daily" | "weekly") {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (period === "daily" ? 1 : 7));
  return { start, end };
}
