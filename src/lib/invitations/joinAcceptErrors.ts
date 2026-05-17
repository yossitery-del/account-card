import { FirebaseError } from "firebase/app";

export const JOIN_ACCEPT_ERROR_MESSAGES = {
  invalid: "ההזמנה לא תקפה או שכבר אינה זמינה.",
  expired: "ההזמנה פגה. אפשר לבקש קישור חדש מהשולח.",
  alreadyUsed: "ההזמנה כבר נוצלה.",
  selfAccept: "לא ניתן להצטרף להזמנה שיצרת בעצמך.",
  cardFull: "הכרטיס כבר מחובר לשני צדדים.",
  cardInactive: "הכרטיס כבר לא פעיל.",
  generic: "לא הצלחנו לפתוח את הכרטיס. נסה שוב.",
} as const;

const SERVER_MESSAGES = new Set<string>(Object.values(JOIN_ACCEPT_ERROR_MESSAGES));

/** ממפה שגיאת Callable acceptInvitation להודעה בעברית. */
export function mapAcceptInvitationError(err: unknown): string {
  if (err instanceof FirebaseError && typeof err.message === "string") {
    const trimmed = err.message.trim();
    if (SERVER_MESSAGES.has(trimmed as (typeof JOIN_ACCEPT_ERROR_MESSAGES)[keyof typeof JOIN_ACCEPT_ERROR_MESSAGES])) {
      return trimmed;
    }
    if (err.code === "functions/not-found" || err.code === "functions/invalid-argument") {
      return JOIN_ACCEPT_ERROR_MESSAGES.invalid;
    }
    if (err.code === "functions/failed-precondition") {
      return JOIN_ACCEPT_ERROR_MESSAGES.generic;
    }
  }
  return JOIN_ACCEPT_ERROR_MESSAGES.generic;
}
