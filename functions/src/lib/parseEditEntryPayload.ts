import {HttpsError} from "firebase-functions/v2/https";
import {parseEntryIntent} from "./entryIntent";
import {parseCardId, parseEntryId} from "./validators";

const TITLE_MIN = 1;
const TITLE_MAX = 200;
const AMOUNT_MAX = 999_999_999;

const FORBIDDEN_EDIT_KEYS = [
  "status",
  "effectOnPerspectiveBalance",
  "type",
  "delta",
  "deltaBefore",
  "deltaAfter",
  "createdByUid",
  "officialBalance",
  "pendingBalanceImpact",
  "editCount",
  "approvedByUid",
  "approvedAt",
  "rejectedByUid",
  "rejectedAt",
  "rejectionNote",
  "cancelledByUid",
  "cancelledAt",
  "editedByUid",
  "editedAt",
  "updatedAt",
  "createdAt",
  "entryDate",
] as const;

export type ParsedEditEntryInput = {
  cardId: string;
  entryId: string;
  intent: ReturnType<typeof parseEntryIntent>;
  amount: number;
  title: string;
};

function parseAmount(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    throw new HttpsError("invalid-argument", "הסכום לא תקין");
  }
  if (raw <= 0) {
    throw new HttpsError("invalid-argument", "הסכום חייב להיות חיובי");
  }
  if (raw > AMOUNT_MAX) {
    throw new HttpsError("invalid-argument", "הסכום גדול מדי");
  }
  return raw;
}

function parseTitle(raw: unknown): string {
  if (typeof raw !== "string") {
    throw new HttpsError("invalid-argument", "פירוט קצר חייב להיות מחרוזת");
  }
  const title = raw.trim();
  if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
    throw new HttpsError("invalid-argument", "פירוט קצר לא תקין");
  }
  return title;
}

export function parseEditEntryPayload(payload: unknown): ParsedEditEntryInput {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw new HttpsError("invalid-argument", "נתוני הבקשה לא תקינים");
  }

  const data = payload as Record<string, unknown>;
  for (const key of FORBIDDEN_EDIT_KEYS) {
    if (key in data) {
      throw new HttpsError("invalid-argument", "שדות לא מורשים בבקשה");
    }
  }

  return {
    cardId: parseCardId(data.cardId),
    entryId: parseEntryId(data.entryId),
    intent: parseEntryIntent(data.intent),
    amount: parseAmount(data.amount),
    title: parseTitle(data.title),
  };
}
