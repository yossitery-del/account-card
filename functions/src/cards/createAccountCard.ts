import {FieldValue} from "firebase-admin/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {db, FUNCTIONS_REGION} from "../lib/admin";
import {requireAuthUid} from "../lib/auth";
import {profileFromToken} from "../lib/profileFromToken";

const TITLE_MIN = 1;
const TITLE_MAX = 200;

export type CreateAccountCardInput = {
  title: string;
};

export type CreateAccountCardOutput = {
  cardId: string;
};

function parseTitle(raw: unknown): string {
  if (typeof raw !== "string") {
    throw new HttpsError("invalid-argument", "שם הכרטיס חייב להיות מחרוזת");
  }
  const title = raw.trim();
  if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
    throw new HttpsError("invalid-argument", "שם הכרטיס לא תקין");
  }
  return title;
}

/**
 * יוצר כרטיס + owner participant + audit events בטרנזקציה אחת.
 */
export const createAccountCard = onCall(
  {region: FUNCTIONS_REGION},
  async (request): Promise<CreateAccountCardOutput> => {
    const uid = requireAuthUid(request);
    const title = parseTitle(request.data?.title);
    const {email, displayName} = profileFromToken(request);

    const cardRef = db.collection("accountCards").doc();
    const cardId = cardRef.id;
    const participantRef = cardRef.collection("participants").doc(uid);
    const auditCardRef = cardRef.collection("auditEvents").doc();
    const auditParticipantRef = cardRef.collection("auditEvents").doc();
    const now = FieldValue.serverTimestamp();

    const batch = db.batch();

    batch.set(cardRef, {
      title,
      currency: "ILS",
      status: "active",
      createdByUid: uid,
      balancePerspectiveUid: uid,
      createdAt: now,
      updatedAt: now,
      officialBalance: 0,
      pendingBalanceImpact: 0,
      encryptionMode: "none",
      dataSchemaVersion: 1,
    });

    batch.set(participantRef, {
      uid,
      email,
      displayName,
      role: "owner",
      status: "active",
      joinedAt: now,
      invitedByUid: null,
      permissions: {
        canAddEntry: true,
        canApprove: true,
        canInvite: true,
      },
    });

    batch.set(auditCardRef, {
      action: "card.created",
      actorUid: uid,
      entityType: "card",
      entityId: cardId,
      createdAt: now,
      metadata: {},
    });

    batch.set(auditParticipantRef, {
      action: "participant.added",
      actorUid: uid,
      entityType: "participant",
      entityId: uid,
      createdAt: now,
      metadata: {role: "owner"},
    });

    await batch.commit();

    return {cardId};
  }
);
