"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/client";
import { parseViewerPendingSummary } from "@/lib/cards/parseViewerPendingSummary";
import {
  resolveViewerCardDisplayTitle,
  type ParticipantTitleInput,
} from "@/lib/cards/resolveViewerCardDisplayTitle";
import type { AccountCard, AccountCardSummary, CardParticipant } from "@/types/card";

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

export async function fetchActiveParticipantsForCardDisplayTitle(
  cardId: string
): Promise<ParticipantTitleInput[]> {
  const db = getFirestoreDb();
  const snap = await getDocs(
    query(
      collection(db, "accountCards", cardId, "participants"),
      where("status", "==", "active")
    )
  );

  return snap.docs.map((docSnap) => {
    const participant = docSnap.data() as CardParticipant;
    const uid =
      typeof participant.uid === "string" && participant.uid.trim().length > 0
        ? participant.uid
        : docSnap.id;
    return { uid, displayName: participant.displayName };
  });
}

export function buildAccountCardSummary(
  cardId: string,
  data: AccountCard,
  viewerUid: string,
  activeParticipantsForTitle?: ParticipantTitleInput[]
): AccountCardSummary {
  const displayTitle = resolveViewerCardDisplayTitle(
    viewerUid,
    data.title,
    activeParticipantsForTitle ?? []
  );

  const createdByUid =
    typeof data.createdByUid === "string" && data.createdByUid.trim().length > 0
      ? data.createdByUid.trim()
      : undefined;

  return {
    id: cardId,
    createdByUid,
    title: displayTitle,
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

  const participants = await fetchActiveParticipantsForCardDisplayTitle(
    cardSnap.id
  );

  return buildAccountCardSummary(
    cardSnap.id,
    cardSnap.data() as AccountCard,
    viewerUid,
    participants
  );
}
