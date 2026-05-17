import {HttpsError} from "firebase-functions/v2/https";
import {db} from "./admin";
import {type EntryData} from "./assertCanApproveEntry";

type ParticipantData = {
  status?: string;
  permissions?: {canAddEntry?: boolean};
};

/**
 * בודק שהמשתמש (יוצר הרשומה) רשאי לבטל רשומה pending.
 */
export async function assertCanCancelEntry(
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

  if (participant.permissions?.canAddEntry !== true) {
    throw new HttpsError("permission-denied", "אין לך הרשאה לפעולה זו");
  }

  const entrySnap = await cardRef.collection("entries").doc(entryId).get();
  if (!entrySnap.exists) {
    throw new HttpsError("not-found", "הרשומה לא נמצאה");
  }

  const entry = entrySnap.data() as EntryData;
  assertEntryCancellable(entry, uid);
}

export function assertEntryCancellable(entry: EntryData, uid: string): void {
  if (entry.status !== "pending") {
    throw new HttpsError(
      "failed-precondition",
      "הרשומה כבר לא ממתינה לאישור"
    );
  }

  if (entry.createdByUid !== uid) {
    throw new HttpsError(
      "permission-denied",
      "אין אפשרות לבטל רשומה שלא הוספת"
    );
  }
}
