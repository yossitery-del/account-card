"use client";

import {
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/client";
import {
  buildAccountCardSummary,
  sortAccountCardSummaries,
} from "@/lib/cards/accountCardSummary";
import type { AccountCard, AccountCardSummary } from "@/types/card";

/**
 * כרטיסים שבהם המשתמש participant פעיל (collection group).
 */
export async function listUserCards(uid: string): Promise<AccountCardSummary[]> {
  if (!uid) {
    return [];
  }

  const db = getFirestoreDb();

  const participantsQuery = query(
    collectionGroup(db, "participants"),
    where("uid", "==", uid),
    where("status", "==", "active")
  );

  let participantSnaps;
  try {
    participantSnaps = await getDocs(participantsQuery);
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

  const cardSnaps = await Promise.all(
    cardIds.map((cardId) => getDoc(doc(db, "accountCards", cardId)))
  );

  const summaries: AccountCardSummary[] = [];
  for (const cardSnap of cardSnaps) {
    if (!cardSnap.exists()) continue;
    summaries.push(
      buildAccountCardSummary(
        cardSnap.id,
        cardSnap.data() as AccountCard,
        uid
      )
    );
  }

  return sortAccountCardSummaries(summaries);
}
