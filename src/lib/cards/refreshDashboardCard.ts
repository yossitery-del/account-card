"use client";

import {
  getAccountCardSummaryForViewer,
  sortAccountCardSummaries,
} from "@/lib/cards/accountCardSummary";
import type { AccountCardSummary } from "@/types/card";

/**
 * מחליף כרטיס אחד במערך הדשבורד וממיין מחדש לפי updatedAt.
 */
export function replaceDashboardCard(
  cards: AccountCardSummary[],
  updated: AccountCardSummary
): AccountCardSummary[] {
  const hasCard = cards.some((card) => card.id === updated.id);
  const next = hasCard
    ? cards.map((card) => (card.id === updated.id ? updated : card))
    : [...cards, updated];
  return sortAccountCardSummaries(next);
}

export type RefreshDashboardCardOptions = {
  cardId: string;
  viewerUid: string;
  reloadAllCards: () => Promise<AccountCardSummary[]>;
};

/**
 * רענון כרטיס בודד אחרי quick approve/reject; נפילה ל-listUserCards במקרה כשל.
 */
export async function refreshDashboardCardInPlace(
  options: RefreshDashboardCardOptions
): Promise<
  | { kind: "single"; updated: AccountCardSummary }
  | { kind: "full"; cards: AccountCardSummary[] }
> {
  const { cardId, viewerUid, reloadAllCards } = options;

  try {
    const updated = await getAccountCardSummaryForViewer(cardId, viewerUid);
    if (!updated) {
      return { kind: "full", cards: await reloadAllCards() };
    }
    return { kind: "single", updated };
  } catch (err) {
    console.error(
      "refreshDashboardCardInPlace failed, falling back to listUserCards:",
      err
    );
    return { kind: "full", cards: await reloadAllCards() };
  }
}
