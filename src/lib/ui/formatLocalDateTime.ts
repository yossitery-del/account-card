/** תאריך ושעה מקומיים — ללא שעון חי */

export function formatLocalDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);
}

export function formatLocalTime(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
}

export function formatLocalDateTimeLine(now: Date = new Date()): string {
  return `${formatLocalDate(now)} · ${formatLocalTime(now)}`;
}
