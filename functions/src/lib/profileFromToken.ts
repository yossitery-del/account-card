/** פרופיל מינימלי מ-Firebase Auth token בקריאת Callable. */
export function profileFromToken(request: {
  auth?: {token?: Record<string, unknown>};
}): {email: string; displayName: string} {
  const token = request.auth?.token;
  const email = typeof token?.email === "string" ? token.email : "";
  const tokenName = typeof token?.name === "string" ? token.name.trim() : "";
  const displayName = tokenName || email || "משתמש";
  return {email, displayName};
}

/** דומיין בלבד ל-audit — לא email מלא. */
export function emailDomain(email: string): string | null {
  const at = email.indexOf("@");
  if (at < 1 || at === email.length - 1) {
    return null;
  }
  return email.slice(at + 1).toLowerCase();
}
