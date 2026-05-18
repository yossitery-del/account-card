import type { AccountCardEntry } from "@/types/entry";

/** Firestore Timestamp / Date / ISO — ללא קריאות נוספות */
export function parseFirestoreDate(value: unknown): Date | null {
  if (value == null) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: unknown }).toDate === "function"
  ) {
    const parsed = (value as { toDate: () => Date }).toDate();
    return parsed instanceof Date && !Number.isNaN(parsed.getTime()) ? parsed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

/** תאריך תנועה — entryDate, אחרת createdAt */
export function getEntryDisplayDate(
  entry: Pick<AccountCardEntry, "entryDate" | "createdAt">
): Date | null {
  return parseFirestoreDate(entry.entryDate) ?? parseFirestoreDate(entry.createdAt);
}

function startOfLocalDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return startOfLocalDay(a) === startOfLocalDay(b);
}

function isYesterdayLocalDay(date: Date, now: Date): boolean {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameLocalDay(date, yesterday);
}

function formatLocalTime(date: Date): string {
  return new Intl.DateTimeFormat("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

/**
 * תצוגת תאריך לרשומת פנקס:
 * - היום / אתמול עם שעה
 * - ישן יותר באותה שנה: "18 במאי"
 * - שנה אחרת: "18.05.24"
 */
export function formatEntryLedgerDate(
  date: Date,
  now: Date = new Date()
): string {
  const time = formatLocalTime(date);

  if (isSameLocalDay(date, now)) {
    return `היום · ${time}`;
  }
  if (isYesterdayLocalDay(date, now)) {
    return `אתמול · ${time}`;
  }
  if (date.getFullYear() === now.getFullYear()) {
    return new Intl.DateTimeFormat("he-IL", {
      day: "numeric",
      month: "long",
    }).format(date);
  }

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}.${mm}.${yy}`;
}

export function formatEntryLedgerDateTimeIso(date: Date): string {
  return date.toISOString();
}
