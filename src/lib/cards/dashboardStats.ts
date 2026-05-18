import { toViewerDelta } from "@/lib/balance/viewerDelta";
import type { AccountCardSummary } from "@/types/card";

export type DashboardStats = {
  activeCardCount: number;
  cardsWithPending: number;
};

/**
 * סיכום מהנתונים שכבר נטענו ב-listUserCards — ללא קריאות נוספות.
 * לא מסכמים יתרה כוללת בין כרטיסים (הסכמות נפרדות).
 */
export function computeDashboardStats(
  cards: AccountCardSummary[],
  viewerUid: string
): DashboardStats {
  let cardsWithPending = 0;

  for (const card of cards) {
    const viewerPending = toViewerDelta(
      card.pendingBalanceImpact,
      viewerUid,
      card.balancePerspectiveUid
    );
    if (viewerPending !== 0) {
      cardsWithPending += 1;
    }
  }

  return {
    activeCardCount: cards.length,
    cardsWithPending,
  };
}
