/** בדיקת שם תצוגה אנושי לפיילוט — לא שם מ-Google/אימייל/מזהה טכני. */

export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 80;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TECHNICAL_HANDLE_PATTERN =
  /(^test-?account|first-?test|test-?user|account-?\d*$|-account$)/i;

/** שם מ-Google/Auth שנראה כמו מזהה חשבון (למשל joseph.tyren1989.ai) */
const DOTTY_ASCII_HANDLE =
  /^[a-z0-9][a-z0-9._-]*[a-z0-9]$/i;

export function isCleanDisplayName(name: string | null | undefined): boolean {
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (trimmed.length < DISPLAY_NAME_MIN || trimmed.length > DISPLAY_NAME_MAX) {
    return false;
  }
  if (EMAIL_PATTERN.test(trimmed) || trimmed.includes("@")) {
    return false;
  }
  const digitCount = (trimmed.match(/\d/g) ?? []).length;
  if (digitCount > 0 && digitCount / trimmed.length > 0.45) {
    return false;
  }
  if (/^[a-z0-9_-]{22,}$/i.test(trimmed) && !/[\u0590-\u05FF]/.test(trimmed)) {
    return false;
  }
  if (
    DOTTY_ASCII_HANDLE.test(trimmed) &&
    trimmed.includes(".") &&
    !trimmed.includes(" ")
  ) {
    return false;
  }
  if (TECHNICAL_HANDLE_PATTERN.test(trimmed)) {
    return false;
  }
  if (/^[a-z0-9._-]+$/i.test(trimmed) && /\d/.test(trimmed) && !/[\u0590-\u05FF]/.test(trimmed)) {
    return false;
  }
  // מילה אחת באנגלית באותיות קטנות — לרוב local-part / handle (yossitery)
  if (
    !trimmed.includes(" ") &&
    !/[\u0590-\u05FF]/.test(trimmed) &&
    /^[a-z][a-z0-9]*$/.test(trimmed) &&
    trimmed.length >= 6
  ) {
    return false;
  }
  return true;
}

export function cleanDisplayNameOrNull(
  name: string | null | undefined
): string | null {
  const trimmed = typeof name === "string" ? name.trim() : "";
  return isCleanDisplayName(trimmed) ? trimmed : null;
}

export function validateDisplayNameInput(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < DISPLAY_NAME_MIN) {
    return "נא להזין שם";
  }
  if (trimmed.length > DISPLAY_NAME_MAX) {
    return `עד ${DISPLAY_NAME_MAX} תווים`;
  }
  if (!isCleanDisplayName(trimmed)) {
    return "נא שם אנושי (לא אימייל או מזהה טכני)";
  }
  return null;
}

export function suggestedDisplayNameFromAuth(
  displayName: string | null | undefined
): string {
  return cleanDisplayNameOrNull(displayName) ?? "";
}
