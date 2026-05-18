import type { AccountCardSummary } from "@/types/card";

export type CardListFilter = "all" | "pending";

export function cardHasPendingApproval(card: AccountCardSummary): boolean {
  return card.pendingAwaitingMyApproval.pendingAwaitingMyApprovalCount > 0;
}

/** סינון מקומי בלבד — ללא קריאות נוספות */
export function filterDashboardCards(
  cards: AccountCardSummary[],
  _viewerUid: string,
  query: string,
  filter: CardListFilter
): AccountCardSummary[] {
  let result = cards;

  if (filter === "pending") {
    result = result.filter((card) => cardHasPendingApproval(card));
  }

  const normalized = query.trim().toLowerCase();
  if (normalized) {
    result = result.filter((card) =>
      card.title.toLowerCase().includes(normalized)
    );
  }

  return result;
}
