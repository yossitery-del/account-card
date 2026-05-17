"use client";

import {
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { withPerf, withPerfStep } from "@/lib/dev/perfLog";
import { getFirestoreDb } from "@/lib/firebase/client";
import type { AccountCard, AccountCardSummary } from "@/types/card";

function toMillis(value: unknown): number {
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

/**
 * כרטיסים שבהם המשתמש participant פעיל (collection group).
 */
export async function listUserCards(uid: string): Promise<AccountCardSummary[]> {
  if (!uid) {
    return [];
  }

  return withPerf("listUserCards", async () => {
    const db = getFirestoreDb();

    const participantsQuery = query(
      collectionGroup(db, "participants"),
      where("uid", "==", uid),
      where("status", "==", "active")
    );

    let participantSnaps;
    try {
      participantSnaps = await withPerfStep(
        "listUserCards",
        "participantsQuery",
        () => getDocs(participantsQuery)
      );
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: string }).code)
          : "";
      if (code === "permission-denied") {
        console.error("listUserCards: permission denied on participants collectionGroup");
      }
      throw err;
    }

    if (participantSnaps.empty) {
      return [];
    }

    const cardIds = participantSnaps.docs
      .map((p) => p.ref.parent.parent?.id)
      .filter((id): id is string => Boolean(id));

    const cardReadStart =
      process.env.NODE_ENV === "development" ? performance.now() : 0;

    const cardSnaps = await withPerfStep("listUserCards", "cardReadsParallel", () =>
      Promise.all(cardIds.map((cardId) => getDoc(doc(db, "accountCards", cardId))))
    );

    const summaries: AccountCardSummary[] = [];
    for (const cardSnap of cardSnaps) {
      if (!cardSnap.exists()) continue;
      const data = cardSnap.data() as AccountCard;
      summaries.push({
        id: cardSnap.id,
        title: data.title,
        balancePerspectiveUid: data.balancePerspectiveUid,
        officialBalance: data.officialBalance,
        pendingBalanceImpact: data.pendingBalanceImpact,
        updatedAt: data.updatedAt,
      });
    }

    if (process.env.NODE_ENV === "development") {
      const cardReadMs = Math.round(performance.now() - cardReadStart);
      console.info("[perf] listUserCards.cardReads", {
        participantDocs: participantSnaps.size,
        cardsLoaded: summaries.length,
        parallelReadsMs: cardReadMs,
      });
    }

    summaries.sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt));

    return summaries;
  });
}
