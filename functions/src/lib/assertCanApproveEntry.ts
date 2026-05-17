import {HttpsError} from "firebase-functions/v2/https";
import {balanceDelta, type EntryEffect} from "./entryIntent";
import {db} from "./admin";

type ParticipantData = {
  status?: string;
  permissions?: {canApprove?: boolean};
};

export type EntryData = {
  status?: string;
  createdByUid?: string;
  amount?: number;
  effectOnPerspectiveBalance?: string;
};

/**
 * בודק שהמשתמש רשאי לאשר/לדחות רשומה pending שלא יצר.
 * נקרא לפני transaction; אימות חוזר בתוך transaction.
 */
export async function assertCanApproveEntry(
  cardId: string,
  entryId: string,
  uid: string
): Promise<void> {
  const cardRef = db.collection("accountCards").doc(cardId);
  const cardSnap = await cardRef.get();

  if (!cardSnap.exists) {
    throw new HttpsError("not-found", "הכרטיס לא נמצא");
  }

  const card = cardSnap.data();
  if (card?.status !== "active") {
    throw new HttpsError("failed-precondition", "הכרטיס אינו פעיל");
  }

  const participantSnap = await cardRef.collection("participants").doc(uid).get();
  if (!participantSnap.exists) {
    throw new HttpsError("permission-denied", "אין לך גישה לכרטיס זה");
  }

  const participant = participantSnap.data() as ParticipantData;
  if (participant.status !== "active") {
    throw new HttpsError("permission-denied", "אין לך גישה לכרטיס זה");
  }

  if (participant.permissions?.canApprove !== true) {
    throw new HttpsError("permission-denied", "אין לך הרשאה לפעולה זו");
  }

  const entrySnap = await cardRef.collection("entries").doc(entryId).get();
  if (!entrySnap.exists) {
    throw new HttpsError("not-found", "הרשומה לא נמצאה");
  }

  const entry = entrySnap.data() as EntryData;
  assertEntryApprovable(entry, uid);
}

export function assertEntryApprovable(entry: EntryData, uid: string): void {
  if (entry.status !== "pending") {
    throw new HttpsError(
      "failed-precondition",
      "הרשומה כבר לא ממתינה לאישור"
    );
  }

  if (entry.createdByUid === uid) {
    throw new HttpsError(
      "permission-denied",
      "אין אפשרות לפעול על רשומה שהוספת"
    );
  }
}

export function parseEntryDelta(entry: EntryData): number {
  const amount = entry.amount;
  const effect = entry.effectOnPerspectiveBalance;

  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    throw new HttpsError("failed-precondition", "רשומה לא תקינה");
  }

  if (effect !== "increase" && effect !== "decrease") {
    throw new HttpsError("failed-precondition", "רשומה לא תקינה");
  }

  return balanceDelta(effect as EntryEffect, amount);
}
