import type { AccountCardSummary } from "@/types/card";

export type DashboardStats = {
  activeCardCount: number;
  cardsWithPending: number;
};

/**
 * סיכום מהנתונים שכבר נטענו ב-listUserCards — ללא קריאות נוספות.
 * לא מסכמים יתרה כוללת בין כרטיסים (הסכמות נפרדות).
 */
export function computeDashboardStats(cards: AccountCardSummary[]): DashboardStats {
  let cardsWithPending = 0;

  for (const card of cards) {
    if (card.pendingAwaitingMyApproval.pendingAwaitingMyApprovalCount > 0) {
      cardsWithPending += 1;
    }
  }

  return {
    activeCardCount: cards.length,
    cardsWithPending,
  };
}
