"use client";

import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { withPerf, withPerfStep } from "@/lib/dev/perfLog";
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
  return withPerf("listEntries", async () => {
    const db = getFirestoreDb();

    const [entriesSnap, participantsSnap] = await Promise.all([
      withPerfStep("listEntries", "entriesQuery", () =>
        getDocs(
          query(
            collection(db, "accountCards", cardId, "entries"),
            orderBy("createdAt", "desc")
          )
        )
      ),
      withPerfStep("listEntries", "participantsQuery", () =>
        getDocs(collection(db, "accountCards", cardId, "participants"))
      ),
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

    if (process.env.NODE_ENV === "development") {
      console.info("[perf] listEntries summary", {
        entryCount: entries.length,
        participantDocs: participantsSnap.size,
        note: "no per-entry fetches (not N+1)",
      });
    }

    return { entries, participantNames };
  });
}
