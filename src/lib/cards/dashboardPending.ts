"use client";

import { collectionGroup, getDocs, query, where } from "firebase/firestore";
import { withPerf, withPerfStep } from "@/lib/dev/perfLog";
import { getFirestoreDb } from "@/lib/firebase/client";
import type { AccountCardEntry, EntryEffect } from "@/types/entry";

export type DashboardPendingEntryPreview = {
  entryId: string;
  cardId: string;
  title: string;
  amount: number;
  effectOnPerspectiveBalance: EntryEffect;
  entryDate: unknown;
  createdAt: unknown;
  createdByUid: string;
  status: "pending";
};

export type DashboardPendingCardSummary = {
  pendingAwaitingMyApprovalCount: number;
  pendingAwaitingMyApproval?: DashboardPendingEntryPreview;
};

export type DashboardPendingByCard = Record<string, DashboardPendingCardSummary>;

function cardIdFromEntryRef(path: string): string | null {
  const segments = path.split("/");
  const cardsIndex = segments.indexOf("accountCards");
  if (cardsIndex === -1 || cardsIndex + 1 >= segments.length) {
    return null;
  }
  return segments[cardsIndex + 1] ?? null;
}

function toPreview(
  cardId: string,
  entryId: string,
  data: AccountCardEntry
): DashboardPendingEntryPreview | null {
  if (data.status !== "pending") {
    return null;
  }
  if (typeof data.title !== "string" || !data.title.trim()) {
    return null;
  }
  if (typeof data.amount !== "number" || !Number.isFinite(data.amount) || data.amount <= 0) {
    return null;
  }
  if (typeof data.createdByUid !== "string" || !data.createdByUid) {
    return null;
  }
  if (
    data.effectOnPerspectiveBalance !== "increase" &&
    data.effectOnPerspectiveBalance !== "decrease"
  ) {
    return null;
  }

  return {
    entryId,
    cardId,
    title: data.title,
    amount: data.amount,
    effectOnPerspectiveBalance: data.effectOnPerspectiveBalance,
    entryDate: data.entryDate,
    createdAt: data.createdAt,
    createdByUid: data.createdByUid,
    status: "pending",
  };
}

/**
 * רשומות pending שממתינות לאישור הצופה — collection group אחד, ללא infer מ-pendingBalanceImpact.
 * Rules: read entries רק כ-participant פעיל בכרטיס.
 */
export async function listDashboardPendingEntries(
  viewerUid: string
): Promise<DashboardPendingByCard> {
  if (!viewerUid) {
    return {};
  }

  return withPerf("listDashboardPendingEntries", async () => {
    const db = getFirestoreDb();

    const pendingQuery = query(
      collectionGroup(db, "entries"),
      where("status", "==", "pending")
    );

    const snap = await withPerfStep(
      "listDashboardPendingEntries",
      "entriesCollectionGroup",
      () => getDocs(pendingQuery)
    );

    const byCard = new Map<string, DashboardPendingEntryPreview[]>();

    for (const docSnap of snap.docs) {
      const cardId = cardIdFromEntryRef(docSnap.ref.path);
      if (!cardId) {
        continue;
      }

      const data = docSnap.data() as AccountCardEntry;
      if (data.createdByUid === viewerUid) {
        continue;
      }

      const preview = toPreview(cardId, docSnap.id, data);
      if (!preview) {
        continue;
      }

      const list = byCard.get(cardId) ?? [];
      list.push(preview);
      byCard.set(cardId, list);
    }

    const result: DashboardPendingByCard = {};

    for (const [cardId, entries] of byCard) {
      const count = entries.length;
      if (count === 0) {
        continue;
      }

      result[cardId] = {
        pendingAwaitingMyApprovalCount: count,
        ...(count === 1 ? { pendingAwaitingMyApproval: entries[0] } : {}),
      };
    }

    if (process.env.NODE_ENV === "development") {
      console.info("[perf] listDashboardPendingEntries.summary", {
        pendingDocs: snap.size,
        cardsWithAwaitingApproval: Object.keys(result).length,
      });
    }

    return result;
  });
}

export function getDashboardPendingForCard(
  cardId: string,
  pendingByCard: DashboardPendingByCard
): DashboardPendingCardSummary | null {
  return pendingByCard[cardId] ?? null;
}
