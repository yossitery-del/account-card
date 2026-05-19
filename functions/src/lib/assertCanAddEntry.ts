import {HttpsError} from "firebase-functions/v2/https";
import {db} from "./admin";
import type {ActiveParticipantRow} from "./recomputeDashboardPendingSummary";

type CardAddEntryData = {
  status?: string;
};

/**
 * אימות הרשאות הוספת רשומה מנתונים שכבר נקראו בטרנזקציה — ללא קריאות Firestore נוספות.
 */
export function assertCanAddEntryFromSnapshots(params: {
  cardExists: boolean;
  card: CardAddEntryData | undefined;
  uid: string;
  activeParticipants: ActiveParticipantRow[];
}): void {
  if (!params.cardExists) {
    throw new HttpsError("not-found", "הכרטיס לא נמצא");
  }

  if (params.card?.status !== "active") {
    throw new HttpsError("failed-precondition", "הכרטיס אינו פעיל");
  }

  const participant = params.activeParticipants.find((p) => p.id === params.uid);
  if (!participant) {
    throw new HttpsError("permission-denied", "אין לך גישה לכרטיס זה");
  }

  if (participant.status !== "active") {
    throw new HttpsError("permission-denied", "אין לך גישה לכרטיס זה");
  }

  if (participant.permissions?.canAddEntry !== true) {
    throw new HttpsError("permission-denied", "אין לך הרשאה להוסיף רשומה");
  }
}

/**
 * בודק שהמשתמש participant פעיל עם canAddEntry על כרטיס פעיל.
 * קריאות Firestore מחוץ לטרנזקציה — העדף assertCanAddEntryFromSnapshots בתוך transaction.
 */
export async function assertCanAddEntry(cardId: string, uid: string): Promise<void> {
  const cardRef = db.collection("accountCards").doc(cardId);
  const cardSnap = await cardRef.get();
  const participantSnap = await cardRef.collection("participants").doc(uid).get();

  const activeParticipants: ActiveParticipantRow[] = [];
  if (participantSnap.exists) {
    activeParticipants.push({
      id: uid,
      ...(participantSnap.data() as Omit<ActiveParticipantRow, "id">),
    });
  }

  assertCanAddEntryFromSnapshots({
    cardExists: cardSnap.exists,
    card: cardSnap.data(),
    uid,
    activeParticipants,
  });
}
