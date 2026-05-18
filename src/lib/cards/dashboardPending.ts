"use client";

import {
  collectionGroup,
  getDocs,
  query,
  where,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
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

const DEV_PENDING_LOG = "[dashboard-pending]";

function logDashboardPendingDiscovery(
  message: string,
  data?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }
  if (data) {
    console.info(DEV_PENDING_LOG, message, data);
  } else {
    console.info(DEV_PENDING_LOG, message);
  }
}

/** accountCards/{cardId}/entries/{entryId} — parent.parent.id עדיף על פענוח path */
function cardIdFromEntryDoc(docSnap: QueryDocumentSnapshot): string | null {
  const cardRef = docSnap.ref.parent?.parent;
  if (cardRef?.id) {
    return cardRef.id;
  }
  const segments = docSnap.ref.path.split("/");
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

    logDashboardPendingDiscovery("query started", {
      viewerUid,
      collectionGroup: "entries",
      filter: "status == pending",
    });

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
    let skippedNoCardId = 0;
    let skippedOwnEntry = 0;
    let skippedInvalidPreview = 0;

    for (const docSnap of snap.docs) {
      const cardId = cardIdFromEntryDoc(docSnap);
      if (!cardId) {
        skippedNoCardId += 1;
        logDashboardPendingDiscovery("skipped: could not resolve cardId", {
          refPath: docSnap.ref.path,
        });
        continue;
      }

      const data = docSnap.data() as AccountCardEntry;
      if (data.createdByUid === viewerUid) {
        skippedOwnEntry += 1;
        continue;
      }

      const preview = toPreview(cardId, docSnap.id, data);
      if (!preview) {
        skippedInvalidPreview += 1;
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

    const cardsGrouped = Object.keys(result).length;
    const entriesAwaitingApproval = Object.values(result).reduce(
      (sum, card) => sum + card.pendingAwaitingMyApprovalCount,
      0
    );

    logDashboardPendingDiscovery("query finished", {
      pendingDocsReturned: snap.size,
      skippedOwnEntry,
      skippedNoCardId,
      skippedInvalidPreview,
      cardsGrouped,
      entriesAwaitingApproval,
    });

    if (snap.size === 0) {
      logDashboardPendingDiscovery(
        "no pending entry docs returned — previews will be empty"
      );
    } else if (entriesAwaitingApproval === 0 && skippedOwnEntry === snap.size) {
      logDashboardPendingDiscovery(
        "all pending docs are own entries — none await current viewer approval"
      );
    } else if (entriesAwaitingApproval === 0) {
      logDashboardPendingDiscovery(
        "pending docs returned but none grouped for approval — check skips above"
      );
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

function firebaseErrorCode(err: unknown): string | null {
  if (err && typeof err === "object" && "code" in err) {
    return String((err as { code: string }).code);
  }
  return null;
}

/** אזהרת dev בלבד — ללא זריקה החוצה */
export function warnDashboardPendingDiscoveryFailure(err: unknown): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }
  const code = firebaseErrorCode(err);
  logDashboardPendingDiscovery("query failed (fail-soft)", {
    code,
    message: err instanceof Error ? err.message : String(err),
    hint:
      code === "permission-denied"
        ? "check firestore.rules entries read + active participant"
        : code === "failed-precondition"
          ? "check Firestore index / single-field controls for collection group entries.status"
          : undefined,
  });
}

/**
 * גילוי pending לדשבורד — לא חוסם טעינת כרטיסים.
 * על כשל: מחזיר מפה ריקה (ללא Quick Review).
 */
export async function listDashboardPendingEntriesSafe(
  viewerUid: string
): Promise<DashboardPendingByCard> {
  try {
    return await listDashboardPendingEntries(viewerUid);
  } catch (err) {
    warnDashboardPendingDiscoveryFailure(err);
    return {};
  }
}
