import {HttpsError} from "firebase-functions/v2/https";
import {balanceDelta, type EntryEffect} from "./entryIntent";
import {db} from "./admin";

/** משתתף פעיל — תואם ל-activeParticipants מ-loadDashboardPendingSummaryInputs */
export type ParticipantApprovalRow = {
  id: string;
  status?: string;
  permissions?: {canApprove?: boolean};
};

export type EntryData = {
  status?: string;
  createdByUid?: string;
  amount?: number;
  effectOnPerspectiveBalance?: string;
};

type CardApprovalData = {
  status?: string;
};

/**
 * אימות הרשאות אישור/דחייה מנתונים שכבר נקראו בטרנזקציה — ללא קריאות Firestore נוספות.
 */
export function assertCanApproveEntryFromSnapshots(params: {
  cardExists: boolean;
  card: CardApprovalData | undefined;
  entryExists: boolean;
  entry: EntryData;
  uid: string;
  activeParticipants: ParticipantApprovalRow[];
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

  if (participant.permissions?.canApprove !== true) {
    throw new HttpsError("permission-denied", "אין לך הרשאה לפעולה זו");
  }

  if (!params.entryExists) {
    throw new HttpsError("not-found", "הרשומה לא נמצאה");
  }

  assertEntryApprovable(params.entry, params.uid);
}

/**
 * בודק שהמשתמש רשאי לאשר/לדחות רשומה pending שלא יצר.
 * קריאות Firestore מחוץ לטרנזקציה — העדף assertCanApproveEntryFromSnapshots בתוך transaction.
 */
export async function assertCanApproveEntry(
  cardId: string,
  entryId: string,
  uid: string
): Promise<void> {
  const cardRef = db.collection("accountCards").doc(cardId);
  const cardSnap = await cardRef.get();

  const participantSnap = await cardRef.collection("participants").doc(uid).get();
  const entrySnap = await cardRef.collection("entries").doc(entryId).get();

  const activeParticipants: ParticipantApprovalRow[] = [];
  if (participantSnap.exists) {
    activeParticipants.push({
      id: uid,
      ...(participantSnap.data() as Omit<ParticipantApprovalRow, "id">),
    });
  }

  assertCanApproveEntryFromSnapshots({
    cardExists: cardSnap.exists,
    card: cardSnap.data(),
    entryExists: entrySnap.exists,
    entry: (entrySnap.data() ?? {}) as EntryData,
    uid,
    activeParticipants,
  });
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
