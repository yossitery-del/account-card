/** נוסח מאושר — Join Preview (Stage 2B-3) */

export const JOIN_PREVIEW_BODY_LEAD =
  "מקום פרטי ומסודר לראות ולעדכן בו את מצב החשבון ביניכם.";

export const JOIN_PREVIEW_BODY_DETAIL =
  "ברור, נוח, וללא בלגן בין הודעות וצילומי מסך.";

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

export function joinPreviewTitle(inviterDisplayName?: string): string {
  if (inviterDisplayName?.trim()) {
    return `${inviterDisplayName.trim()} רוצה לשתף איתך כרטיס חשבון`;
  }
  return "רוצים לשתף איתך כרטיס חשבון";
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

