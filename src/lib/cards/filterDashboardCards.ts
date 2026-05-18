import { toViewerDelta } from "@/lib/balance/viewerDelta";
import type { AccountCardSummary } from "@/types/card";

export type CardListFilter = "all" | "pending";

export function cardHasPendingApproval(
  card: AccountCardSummary,
  viewerUid: string
): boolean {
  return (
    toViewerDelta(
      card.pendingBalanceImpact,
      viewerUid,
      card.balancePerspectiveUid
    ) !== 0
  );
}

/** סינון מקומי בלבד — ללא קריאות נוספות */
export function filterDashboardCards(
  cards: AccountCardSummary[],
  viewerUid: string,
  query: string,
  filter: CardListFilter
): AccountCardSummary[] {
  let result = cards;

  if (filter === "pending") {
    result = result.filter((card) =>
      cardHasPendingApproval(card, viewerUid)
    );
  }

  const normalized = query.trim().toLowerCase();
  if (normalized) {
    result = result.filter((card) =>
      card.title.toLowerCase().includes(normalized)
    );
  }

  return result;
}
