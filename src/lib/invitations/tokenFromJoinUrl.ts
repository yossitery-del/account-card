/**
 * מחלץ token מנתיב /join/[token] — מפענח URI בבטחה, שומר Base64URL (`-`, `_`).
 */
export function tokenFromJoinUrl(raw: string): string {
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
