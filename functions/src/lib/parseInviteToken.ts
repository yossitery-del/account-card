import {HttpsError} from "firebase-functions/v2/https";

const TOKEN_MIN_LENGTH = 20;
const TOKEN_MAX_LENGTH = 128;

/** Base64URL — כולל `-` ו-`_` (כמו `randomBytes(32).toString("base64url")`). */
export const INVITE_TOKEN_BASE64URL = /^[A-Za-z0-9_-]+$/;

/**
 * מפרסר token מ-URL; זורק invalid-argument אם לא תקין.
 */
export function parseInviteToken(raw: unknown): string {
  if (typeof raw !== "string") {
    throw new HttpsError("invalid-argument", "קישור הזמנה לא תקין");
  }
  const token = raw.trim();
  if (token.length < TOKEN_MIN_LENGTH || token.length > TOKEN_MAX_LENGTH) {
    throw new HttpsError("invalid-argument", "קישור הזמנה לא תקין");
  }
  if (!INVITE_TOKEN_BASE64URL.test(token)) {
    throw new HttpsError("invalid-argument", "קישור הזמנה לא תקין");
  }
  return token;
}

/** גרסה שלא זורקת — ל-preview. */
export function tryParseInviteToken(raw: unknown): string | null {
  try {
    return parseInviteToken(raw);
  } catch {
    return null;
  }
}
