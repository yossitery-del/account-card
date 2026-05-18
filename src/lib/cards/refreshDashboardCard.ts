"use client";

import {
  getAccountCardSummaryForViewer,
  sortAccountCardSummaries,
} from "@/lib/cards/accountCardSummary";
import { hasCardBalancePatch } from "@/lib/cards/patchCardBalances";
import { parseViewerPendingAwaitingMyApproval } from "@/lib/cards/parseViewerPendingSummary";
import type { DashboardQuickActionCallableResult } from "@/lib/firebase/functions";
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

/**
 * מעדכן כרטיס מהתשובה העשירה של approve/reject — ללא getDoc.
 */
export function patchDashboardCardFromQuickAction(
  existing: AccountCardSummary,
  mutation: DashboardQuickActionCallableResult
): AccountCardSummary | null {
  if (mutation.cardId !== existing.id || !hasCardBalancePatch(mutation)) {
    return null;
  }

  const pendingAwaitingMyApproval = parseViewerPendingAwaitingMyApproval(
    mutation.pendingAwaitingMyApproval
  );
  if (!pendingAwaitingMyApproval) {
    return null;
  }

  return {
    ...existing,
    officialBalance: mutation.officialBalance,
    pendingBalanceImpact: mutation.pendingBalanceImpact,
    updatedAt: mutation.updatedAt,
    pendingAwaitingMyApproval,
  };
}

export type RefreshDashboardCardOptions = {
  cardId: string;
  viewerUid: string;
  reloadAllCards: () => Promise<AccountCardSummary[]>;
};

/**
 * רענון כרטיס בודד מ-getDoc; נפילה ל-listUserCards במקרה כשל.
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
