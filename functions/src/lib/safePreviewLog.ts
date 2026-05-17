/**
 * לוגים בטוחים ל-Join Preview — ללא token מלא, hash מלא, cardId, UID, email.
 */
function hashPrefix(hash: string): string {
  return hash.length >= 8 ? hash.slice(0, 8) : "short";
}

export const previewLog = {
  lookupStart(tokenHash: string): void {
    console.info("[getInvitationPreview] lookup", {
      tokenHashPrefix: hashPrefix(tokenHash),
    });
  },

  lookupResult(found: boolean, storedStatus?: string, expiresMs?: number | null): void {
    const now = Date.now();
    console.info("[getInvitationPreview] lookupResult", {
      found,
      storedStatus: found ? storedStatus : undefined,
      expiresAtMs: found ? expiresMs : undefined,
      nowMs: found ? now : undefined,
      expired:
        found && expiresMs != null ? expiresMs < now : undefined,
    });
  },

  unexpectedError(message: string): void {
    console.error("[getInvitationPreview] unexpectedError", {message});
  },
};
