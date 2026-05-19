"use client";

import { doc, getDoc } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/client";
import { parseViewerPendingSummary } from "@/lib/cards/parseViewerPendingSummary";
import type { AccountCard, AccountCardSummary } from "@/types/card";

export function updatedAtToMillis(value: unknown): number {
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof (value as { toMillis: () => number }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  return 0;
}

export function sortAccountCardSummaries(
  cards: AccountCardSummary[]
): AccountCardSummary[] {
  return [...cards].sort(
    (a, b) => updatedAtToMillis(b.updatedAt) - updatedAtToMillis(a.updatedAt)
  );
}

export function buildAccountCardSummary(
  cardId: string,
  data: AccountCard,
  viewerUid: string
): AccountCardSummary {
  return {
    id: cardId,
    title: data.title,
    balancePerspectiveUid: data.balancePerspectiveUid,
    officialBalance: data.officialBalance,
    pendingBalanceImpact: data.pendingBalanceImpact,
    updatedAt: data.updatedAt,
    pendingAwaitingMyApproval: parseViewerPendingSummary(
      data.dashboardPendingSummaryByUid,
      viewerUid
    ),
  };
}

/**
 * טוען כרטיס בודד לדשבורד — getDoc אחד, אותו מיפוי כמו listUserCards.
 * מחזיר null אם המסמך לא קיים.
 */
export async function getAccountCardSummaryForViewer(
  cardId: string,
  viewerUid: string
): Promise<AccountCardSummary | null> {
  const db = getFirestoreDb();
  const cardSnap = await getDoc(doc(db, "accountCards", cardId));

  if (!cardSnap.exists()) {
    return null;
  }

  return buildAccountCardSummary(
    cardSnap.id,
    cardSnap.data() as AccountCard,
    viewerUid
  );
}
