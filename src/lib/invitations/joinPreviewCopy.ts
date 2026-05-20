/** נוסח מאושר — Join Preview (Stage 2B-3) */

/** כותרת ראשית — ערך המוצר, לא זהות השולח */
export const JOIN_PREVIEW_MAIN_HEADLINE = "כרטיס חשבון משותף";

export const JOIN_PREVIEW_VALUE_PROSE =
  "מקום מסודר לתיעוד חיובים והחזרים בין שני צדדים. כל פעולה נשמרת, וכל אישור מתועד.";

export const JOIN_PREVIEW_SIGN_IN_LABEL = "כניסה אישית מאובטחת";

export const JOIN_PREVIEW_GOOGLE_CTA = "כניסה עם Google";

export const JOIN_PREVIEW_GOOGLE_NOTE =
  "נשתמש בחשבון Google כדי לפתוח את הכרטיס בצורה בטוחה.";

export const JOIN_PREVIEW_CTA = "כניסה לכרטיס";

export const JOIN_PREVIEW_ACCEPTING = "פותחים את הכרטיס...";

export const JOIN_LOGGED_IN_SECURE_LABEL = "כניסה מאובטחת דרך Google";

export function joinLoggedInAs(displayName: string): string {
  return `מחובר כ־${displayName}`;
}

/** שורה משנית — זהות השולח, רק אם ידועה */
export function joinInviterSecondaryLine(
  inviterDisplayName?: string
): string | null {
  const name = inviterDisplayName?.trim();
  if (!name) {
    return null;
  }
  return `נשלח מ־${name}`;
}

export const JOIN_ERROR_MESSAGES: Record<
  "invalid" | "expired" | "accepted" | "revoked",
  string
> = {
  invalid: "ההזמנה לא תקפה או שכבר אינה זמינה.",
  expired: "ההזמנה פגה. אפשר לבקש קישור חדש מהשולח.",
  accepted: "ההזמנה כבר נוצלה.",
  revoked: "ההזמנה בוטלה.",
};
