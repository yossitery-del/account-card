import {HttpsError} from "firebase-functions/v2/https";

const FORBIDDEN_ENTRY_ACTION_KEYS = [
  "status",
  "amount",
  "effectOnPerspectiveBalance",
  "officialBalance",
  "pendingBalanceImpact",
  "createdByUid",
  "approvedByUid",
  "approvedAt",
  "rejectedByUid",
  "rejectedAt",
  "cancelledByUid",
  "cancelledAt",
  "type",
  "title",
  "entryDate",
  "createdAt",
  "intent",
] as const;

export function rejectEntryActionControlledFields(
  data: Record<string, unknown>
): void {
  for (const key of FORBIDDEN_ENTRY_ACTION_KEYS) {
    if (key in data) {
      throw new HttpsError("invalid-argument", "שדות לא מורשים בבקשה");
    }
  }
}

export function parseEntryActionPayload(
  payload: unknown
): Record<string, unknown> {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    throw new HttpsError("invalid-argument", "נתוני הבקשה לא תקינים");
  }
  const data = payload as Record<string, unknown>;
  rejectEntryActionControlledFields(data);
  return data;
}
