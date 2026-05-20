/**
 * נתיבי הזמנה ציבוריים — token/security ללא שינוי; רק צורת URL לשיתוף.
 * @see inviteExperience.ts — הפרדה בין קישור שיתוף, OG, ודף join
 */

/** נתיב קצר לשיתוף (WhatsApp וכו') */
export const SHARE_INVITE_PATH_PREFIX = "/j";

/** נתיב legacy — תאימות לאחור */
export const LEGACY_JOIN_PATH_PREFIX = "/join";

export function buildShareInvitePath(token: string): string {
  const trimmed = token.trim();
  if (!trimmed) {
    return SHARE_INVITE_PATH_PREFIX;
  }
  return `${SHARE_INVITE_PATH_PREFIX}/${encodeURIComponent(trimmed)}`;
}

export function buildShareInviteUrl(baseUrl: string, token: string): string {
  const base = baseUrl.replace(/\/$/, "");
  return `${base}${buildShareInvitePath(token)}`;
}

/** מחלץ token מנתיב /j/[token] או /join/[token] */
export function tokenFromInvitePath(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return "";
  }
  try {
    return decodeURIComponent(trimmed).trim();
  } catch {
    return trimmed;
  }
}
