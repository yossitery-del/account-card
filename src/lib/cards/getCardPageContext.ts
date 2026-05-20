"use client";

import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/client";
import { resolveViewerCardDisplayTitle } from "@/lib/cards/resolveViewerCardDisplayTitle";
import { cleanDisplayNameOrNull } from "@/lib/users/displayNameQuality";
import type { AccountCard, CardParticipant } from "@/types/card";
import type { AccountCardWithId } from "@/lib/cards/getAccountCard";

export type CardPageContext = {
  card: AccountCardWithId;
  currentParticipant: CardParticipant;
  activeParticipantsCount: number;
  otherParticipantName?: string;
  /** כותרת לתצוגה אצל הצופה — נגזרת מ-displayName של הצד השני כשיש שני משתתפים פעילים */
  viewerCardDisplayTitle: string;
};

/**
 * כרטיס + participant נוכחי + מספר משתתפים פעילים (למצב שיתוף ב-UI).
 */
export async function getCardPageContext(
  cardId: string,
  uid: string
): Promise<CardPageContext | null> {
  const db = getFirestoreDb();

  const participantRef = doc(db, "accountCards", cardId, "participants", uid);
  const cardRef = doc(db, "accountCards", cardId);

  const [participantSnap, cardSnap] = await Promise.all([
    getDoc(participantRef),
    getDoc(cardRef),
  ]);

  if (!participantSnap.exists()) {
    return null;
  }

  const currentParticipant = participantSnap.data() as CardParticipant;
  if (currentParticipant.status !== "active") {
    return null;
  }

  if (!cardSnap.exists()) {
    return null;
  }

  const activeSnap = await getDocs(
    query(
      collection(db, "accountCards", cardId, "participants"),
      where("status", "==", "active")
    )
  );
  const otherParticipantName = activeSnap.docs
    .map((docSnap) => {
      const participant = docSnap.data() as CardParticipant;
      const participantUid =
        typeof participant.uid === "string" && participant.uid
          ? participant.uid
          : docSnap.id;
      const displayName = cleanDisplayNameOrNull(participant.displayName);
      return participantUid !== uid && displayName ? displayName : null;
    })
    .find((name): name is string => name !== null);

  const activeParticipantsForTitle = activeSnap.docs.map((docSnap) => {
    const participant = docSnap.data() as CardParticipant;
    const participantUid =
      typeof participant.uid === "string" && participant.uid.trim().length > 0
        ? participant.uid
        : docSnap.id;
    return { uid: participantUid, displayName: participant.displayName };
  });

  const cardData = cardSnap.data() as AccountCard;
  const viewerCardDisplayTitle = resolveViewerCardDisplayTitle(
    uid,
    cardData.title,
    activeParticipantsForTitle
  );

  return {
    card: {
      id: cardSnap.id,
      ...cardData,
    },
    currentParticipant,
    activeParticipantsCount: activeSnap.size,
    otherParticipantName,
    viewerCardDisplayTitle,
  };
}
