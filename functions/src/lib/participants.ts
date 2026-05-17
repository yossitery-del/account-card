import {HttpsError} from "firebase-functions/v2/https";
import {db} from "./admin";

type ParticipantData = {
  status?: string;
  permissions?: {canInvite?: boolean};
};

/**
 * בודק שהמשתמש participant פעיל עם canInvite על כרטיס פעיל.
 */
export async function assertCanInvite(cardId: string, uid: string): Promise<void> {
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

  if (participant.permissions?.canInvite !== true) {
    throw new HttpsError("permission-denied", "אין לך הרשאה להזמין לכרטיס זה");
  }
}
