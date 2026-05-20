/**
 * Viewer-facing card title for pilot — derived in the client only.
 * Does not change stored accountCards.title.
 */

export type ParticipantTitleInput = {
  uid: string;
  displayName?: string | null;
};

/**
 * When exactly two active participants exist, show the other party's display name.
 * Otherwise show the global card title (trimmed), or "כרטיס" if empty.
 */
export function resolveViewerCardDisplayTitle(
  viewerUid: string,
  globalTitle: string,
  activeParticipants: ParticipantTitleInput[]
): string {
  const trimmedGlobal = typeof globalTitle === "string" ? globalTitle.trim() : "";
  const fallback = trimmedGlobal || "כרטיס";

  if (activeParticipants.length !== 2) {
    return fallback;
  }

  const others = activeParticipants.filter((p) => p.uid !== viewerUid);
  if (others.length !== 1) {
    return fallback;
  }

  const name = others[0]?.displayName?.trim();
  if (name) {
    return name;
  }

  return fallback;
}
