"use client";

import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/client";
import type { AccountCardEntryWithId } from "@/types/entry";
import type { CardParticipant } from "@/types/card";

export type EntriesListResult = {
  entries: AccountCardEntryWithId[];
  participantNames: Map<string, string>;
};

/**
 * רשומות כרטיס — מיון חדש למעלה (createdAt).
 * Rules: participant פעיל בלבד.
 *
 * ביצועים: 2 שאילתות במקביל (entries + participants) — לא N+1.
 */
export async function listEntries(cardId: string): Promise<EntriesListResult> {
  const db = getFirestoreDb();

  const [entriesSnap, participantsSnap] = await Promise.all([
    getDocs(
      query(
        collection(db, "accountCards", cardId, "entries"),
        orderBy("createdAt", "desc")
      )
    ),
    getDocs(collection(db, "accountCards", cardId, "participants")),
  ]);

  const participantNames = new Map<string, string>();
  for (const docSnap of participantsSnap.docs) {
    const p = docSnap.data() as CardParticipant;
    if (p.uid) {
      participantNames.set(p.uid, p.displayName || "משתתף");
    }
  }

  const entries: AccountCardEntryWithId[] = entriesSnap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<AccountCardEntryWithId, "id">),
  }));

  return { entries, participantNames };
}
