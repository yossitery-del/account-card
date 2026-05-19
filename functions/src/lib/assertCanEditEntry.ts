import {HttpsError} from "firebase-functions/v2/https";
import {type EntryData} from "./assertCanApproveEntry";
import {db} from "./admin";
import type {ActiveParticipantRow} from "./recomputeDashboardPendingSummary";

type CardEditData = {
  status?: string;
};

/**
 * אימות הרשאות עריכת רשומה מנתונים שכבר נקראו בטרנזקציה — ללא קריאות Firestore נוספות.
 */
export function assertCanEditEntryFromSnapshots(params: {
  cardExists: boolean;
  card: CardEditData | undefined;
  entryExists: boolean;
  entry: EntryData;
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
    throw new HttpsError("permission-denied", "אין לך הרשאה לפעולה זו");
  }

  if (!params.entryExists) {
    throw new HttpsError("not-found", "הרשומה לא נמצאה");
  }

  assertEntryEditable(params.entry, params.uid);
}

export async function assertCanEditEntry(
  cardId: string,
  entryId: string,
  uid: string
): Promise<void> {
  const cardRef = db.collection("accountCards").doc(cardId);
  const cardSnap = await cardRef.get();
  const participantSnap = await cardRef.collection("participants").doc(uid).get();
  const entrySnap = await cardRef.collection("entries").doc(entryId).get();

  const activeParticipants: ActiveParticipantRow[] = [];
  if (participantSnap.exists) {
    activeParticipants.push({
      id: uid,
      ...(participantSnap.data() as Omit<ActiveParticipantRow, "id">),
    });
  }

  assertCanEditEntryFromSnapshots({
    cardExists: cardSnap.exists,
    card: cardSnap.data(),
    entryExists: entrySnap.exists,
    entry: (entrySnap.data() ?? {}) as EntryData,
    uid,
    activeParticipants,
  });
}

export function assertEntryEditable(entry: EntryData, uid: string): void {
  if (entry.status !== "pending") {
    throw new HttpsError(
      "failed-precondition",
      "הרשומה כבר לא ניתנת לעריכה"
    );
  }

  if (entry.createdByUid !== uid) {
    throw new HttpsError(
      "permission-denied",
      "אין אפשרות לערוך רשומה שלא הוספת"
    );
  }
}
