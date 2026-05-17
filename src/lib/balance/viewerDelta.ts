import type { EntryEffect } from "@/types/entry";

/** דלתא קנונית — תמיד ביחס ל-balancePerspectiveUid של הכרטיס. */
export function canonicalDeltaFromEffect(
  effect: EntryEffect,
  amount: number
): number {
  return effect === "increase" ? amount : -amount;
}

/**
 * דלתא מנקודת מבט הצופה.
 * אם הצופה אינו balancePerspectiveUid — היפוך סימן.
 */
export function toViewerDelta(
  canonicalDelta: number,
  viewerUid: string,
  balancePerspectiveUid: string
): number {
  if (!balancePerspectiveUid) {
    return canonicalDelta;
  }
  if (viewerUid === balancePerspectiveUid) {
    return canonicalDelta;
  }
  return -canonicalDelta;
}

/** תצוגת סכום חתום: +₪ / -₪ (לרשומות ו-pending). */
export function formatSignedDelta(delta: number): string {
  if (delta === 0) {
    return "₪0";
  }
  const sign = delta > 0 ? "+" : "-";
  return `${sign}₪${Math.abs(delta).toLocaleString("he-IL")}`;
}
