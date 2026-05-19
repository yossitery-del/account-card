"use client";

import type { AccountCardSummary } from "@/types/card";

const cardsByUid = new Map<string, AccountCardSummary[]>();

export function readDashboardCardsSnapshot(
  uid: string
): AccountCardSummary[] | null {
  const cards = cardsByUid.get(uid);
  return cards ? [...cards] : null;
}

export function writeDashboardCardsSnapshot(
  uid: string,
  cards: AccountCardSummary[]
): void {
  cardsByUid.set(uid, [...cards]);
}

export function updateDashboardCardsSnapshot(
  uid: string,
  update: (cards: AccountCardSummary[]) => AccountCardSummary[]
): void {
  const current = cardsByUid.get(uid);
  if (!current) {
    return;
  }
  cardsByUid.set(uid, update([...current]));
}

export function readDashboardCardSnapshot(
  uid: string,
  cardId: string
): AccountCardSummary | null {
  return cardsByUid.get(uid)?.find((card) => card.id === cardId) ?? null;
}

export function clearDashboardCardsSnapshot(uid?: string): void {
  if (uid) {
    cardsByUid.delete(uid);
    return;
  }
  cardsByUid.clear();
}
