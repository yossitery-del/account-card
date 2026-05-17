"use client";

import { doc, getDoc } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/client";
import type { AccountCard, CardParticipant } from "@/types/card";

export type AccountCardWithId = AccountCard & { id: string };

/**
 * מחזיר כרטיס רק אם המשתמש participant פעיל (Rules + בדיקת סטטוס).
 */
export async function getAccountCard(
  cardId: string,
  uid: string
): Promise<AccountCardWithId | null> {
  const db = getFirestoreDb();

  const participantRef = doc(db, "accountCards", cardId, "participants", uid);
  const participantSnap = await getDoc(participantRef);

  if (!participantSnap.exists()) {
    return null;
  }

  const participant = participantSnap.data() as CardParticipant;
  if (participant.status !== "active") {
    return null;
  }

  const cardSnap = await getDoc(doc(db, "accountCards", cardId));
  if (!cardSnap.exists()) {
    return null;
  }

  return {
    id: cardSnap.id,
    ...(cardSnap.data() as AccountCard),
  };
}
