import {HttpsError} from "firebase-functions/v2/https";
import {db} from "./admin";

type ParticipantData = {
  status?: string;
  permissions?: {canAddEntry?: boolean};
};

/**
 * בודק שהמשתמש participant פעיל עם canAddEntry על כרטיס פעיל.
 */
export async function assertCanAddEntry(cardId: string, uid: string): Promise<void> {
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
    throw new HttpsError("permission-denied", "אין לך הרשאה להוסיף רשומה");
  }
}
