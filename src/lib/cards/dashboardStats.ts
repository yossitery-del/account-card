import type { AccountCardSummary } from "@/types/card";

export type DashboardStats = {
  activeCardCount: number;
  /** כרטיסים עם לפחות פעולה ממתינה לאישור הצופה */
  cardsWithPending: number;
  /** סה״כ החלטות (רשומות) הממתינות לאישור הצופה — לנוסח מרכז הפיקוד */
  pendingDecisionsCount: number;
};

/**
 * סיכום מהנתונים שכבר נטענו ב-listUserCards — ללא קריאות נוספות.
 * לא מסכמים יתרה כוללת בין כרטיסים (הסכמות נפרדות).
 */
export function computeDashboardStats(cards: AccountCardSummary[]): DashboardStats {
  let cardsWithPending = 0;
  let pendingDecisionsCount = 0;

  for (const card of cards) {
    const count = card.pendingAwaitingMyApproval.pendingAwaitingMyApprovalCount;
    if (count > 0) {
      cardsWithPending += 1;
      pendingDecisionsCount += count;
    }
  }

  return {
    activeCardCount: cards.length,
    cardsWithPending,
    pendingDecisionsCount,
  };
}
