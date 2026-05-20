import {HttpsError} from "firebase-functions/v2/https";
import {
  DISPLAY_NAME_MAX,
  DISPLAY_NAME_MIN,
  isCleanDisplayName,
} from "./displayNameQuality";

const OPTIONAL_LABEL_MAX = 100;
const REJECTION_NOTE_MAX = 200;

export function parseCardId(raw: unknown): string {
  if (typeof raw !== "string") {
    throw new HttpsError("invalid-argument", "מזהה כרטיס לא תקין");
  }
  const cardId = raw.trim();
  if (!cardId) {
    throw new HttpsError("invalid-argument", "מזהה כרטיס לא תקין");
  }
  return cardId;
}

export function parseEntryId(raw: unknown): string {
  if (typeof raw !== "string") {
    throw new HttpsError("invalid-argument", "מזהה רשומה לא תקין");
  }
  const entryId = raw.trim();
  if (!entryId) {
    throw new HttpsError("invalid-argument", "מזהה רשומה לא תקין");
  }
  return entryId;
}

/** שם / תווית אופציונלית — עד 100 תווים. */
export function parseOptionalLabel(
  raw: unknown,
  invalidMessage: string
): string | null {
  if (raw === undefined || raw === null || raw === "") {
    return null;
  }
  if (typeof raw !== "string") {
    throw new HttpsError("invalid-argument", invalidMessage);
  }
  const value = raw.trim();
  if (value.length > OPTIONAL_LABEL_MAX) {
    throw new HttpsError("invalid-argument", invalidMessage);
  }
  return value.length > 0 ? value : null;
}

/** הערת דחייה אופציונלית — עד 200 תווים. */
export function parseRejectionNote(raw: unknown): string | null {
  if (raw === undefined || raw === null || raw === "") {
    return null;
  }
  if (typeof raw !== "string") {
    throw new HttpsError("invalid-argument", "הערת דחייה לא תקינה");
  }
  const note = raw.trim();
  if (note.length === 0) {
    return null;
  }
  if (note.length > REJECTION_NOTE_MAX) {
    throw new HttpsError("invalid-argument", "הערת דחייה ארוכה מדי");
  }
  return note;
}

const MSG_DISPLAY_NAME_INVALID = "שם תצוגה לא תקין";

/** שם תצוגה ל-participant — חובה, אנושי, ללא אימייל/מזהה טכני. */
export function parseParticipantDisplayName(raw: unknown): string {
  if (typeof raw !== "string") {
    throw new HttpsError("invalid-argument", MSG_DISPLAY_NAME_INVALID);
  }
  const value = raw.trim().replace(/\s+/g, " ");
  if (
    value.length < DISPLAY_NAME_MIN ||
    value.length > DISPLAY_NAME_MAX ||
    !isCleanDisplayName(value)
  ) {
    throw new HttpsError("invalid-argument", MSG_DISPLAY_NAME_INVALID);
  }
  return value;
}
