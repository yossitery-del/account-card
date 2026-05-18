import {
  DocumentReference,
  FieldValue,
  Timestamp,
  Transaction,
} from "firebase-admin/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {db, FUNCTIONS_REGION} from "../lib/admin";
import {requireAuthUid} from "../lib/auth";
import {emailDomain, profileFromToken} from "../lib/profileFromToken";
import {parseInviteToken} from "../lib/parseInviteToken";
import {
  activeParticipantsFromSnapshot,
  buildDashboardPendingSummaryFields,
  pendingRowsFromSnapshot,
} from "../lib/recomputeDashboardPendingSummary";
import {hashInviteToken} from "../lib/tokens";

export type AcceptInvitationInput = {
  token: string;
};

export type AcceptInvitationOutput = {
  cardId: string;
  alreadyParticipant?: boolean;
};

const MSG_INVALID = "ההזמנה לא תקפה או שכבר אינה זמינה.";
const MSG_EXPIRED = "ההזמנה פגה. אפשר לבקש קישור חדש מהשולח.";
const MSG_ALREADY_USED = "ההזמנה כבר נוצלה.";
const MSG_SELF_ACCEPT = "לא ניתן להצטרף להזמנה שיצרת בעצמך.";
const MSG_CARD_FULL = "הכרטיס כבר מחובר לשני צדדים.";
const MSG_CARD_INACTIVE = "הכרטיס כבר לא פעיל.";

function expiresAtMillis(value: unknown): number | null {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  return null;
}

function invitationCardId(inviteRef: DocumentReference): string {
  const cardRef = inviteRef.parent.parent;
  if (!cardRef) {
    throw new HttpsError("internal", "מבנה הזמנה לא תקין");
  }
  return cardRef.id;
}

type InvitationDoc = {
  status?: string;
  createdByUid?: string;
  expiresAt?: unknown;
  bindingMode?: string;
};

function assertInvitationAcceptable(
  invitation: InvitationDoc,
  uid: string,
  nowMs: number
): void {
  const status = invitation.status;
  const createdByUid = invitation.createdByUid;

  if (typeof createdByUid === "string" && createdByUid === uid) {
    throw new HttpsError("failed-precondition", MSG_SELF_ACCEPT);
  }

  if (status === "accepted") {
    throw new HttpsError("failed-precondition", MSG_ALREADY_USED);
  }

  if (status === "revoked") {
    throw new HttpsError("failed-precondition", MSG_INVALID);
  }

  const expiresMs = expiresAtMillis(invitation.expiresAt);
  if (expiresMs !== null && expiresMs < nowMs) {
    throw new HttpsError("failed-precondition", MSG_EXPIRED);
  }

  if (status !== "pending") {
    throw new HttpsError("failed-precondition", MSG_INVALID);
  }
}

/**
 * מצטרף לכרטיס דרך הזמנה — participant שני, invitation accepted.
 */
export const acceptInvitation = onCall(
  {region: FUNCTIONS_REGION},
  async (request): Promise<AcceptInvitationOutput> => {
    const uid = requireAuthUid(request);
    const token = parseInviteToken(request.data?.token);
    const tokenHash = hashInviteToken(token);
    const {email, displayName} = profileFromToken(request);

    const lookup = await db
      .collectionGroup("invitations")
      .where("tokenHash", "==", tokenHash)
      .limit(1)
      .get();

    if (lookup.empty) {
      throw new HttpsError("not-found", MSG_INVALID);
    }

    const inviteSnap = lookup.docs[0];
    const inviteRef = inviteSnap.ref;
    const inviteId = inviteSnap.id;
    const cardId = invitationCardId(inviteRef);
    const cardRef = db.collection("accountCards").doc(cardId);
    const participantRef = cardRef.collection("participants").doc(uid);

    return db.runTransaction(async (transaction: Transaction) => {
      const nowMs = Date.now();

      const [
        inviteTxSnap,
        cardTxSnap,
        participantTxSnap,
        activeParticipantsSnap,
        pendingEntriesSnap,
      ] = await Promise.all([
        transaction.get(inviteRef),
        transaction.get(cardRef),
        transaction.get(participantRef),
        transaction.get(
          cardRef.collection("participants").where("status", "==", "active")
        ),
        transaction.get(
          cardRef.collection("entries").where("status", "==", "pending")
        ),
      ]);

      if (!inviteTxSnap.exists) {
        throw new HttpsError("not-found", MSG_INVALID);
      }

      const invitation = inviteTxSnap.data() as InvitationDoc;

      if (participantTxSnap.exists) {
        const existing = participantTxSnap.data();
        if (existing?.status === "active") {
          return {cardId, alreadyParticipant: true};
        }
      }

      if (!cardTxSnap.exists) {
        throw new HttpsError("not-found", MSG_INVALID);
      }

      const card = cardTxSnap.data();
      if (card?.status !== "active") {
        throw new HttpsError("failed-precondition", MSG_CARD_INACTIVE);
      }

      const activeCount = activeParticipantsSnap.size;
      const isAlreadyCounted = activeParticipantsSnap.docs.some((d) => d.id === uid);

      if (activeCount >= 2 && !isAlreadyCounted) {
        throw new HttpsError("failed-precondition", MSG_CARD_FULL);
      }

      assertInvitationAcceptable(invitation, uid, nowMs);

      const createdByUid =
        typeof invitation.createdByUid === "string" ? invitation.createdByUid : null;

      const acceptedEmail = email || null;
      const domain = email ? emailDomain(email) : null;
      const bindingMode = typeof invitation.bindingMode === "string" ?
        invitation.bindingMode :
        "claim_on_accept";

      const now = FieldValue.serverTimestamp();
      const auditAcceptedRef = cardRef.collection("auditEvents").doc();
      const auditParticipantRef = cardRef.collection("auditEvents").doc();

      const activeParticipants = activeParticipantsFromSnapshot(
        activeParticipantsSnap
      );
      if (!activeParticipants.some((p) => p.id === uid)) {
        activeParticipants.push({
          id: uid,
          status: "active",
          permissions: {canApprove: true},
        });
      }

      const summaryFields = buildDashboardPendingSummaryFields(
        pendingRowsFromSnapshot(pendingEntriesSnap),
        activeParticipants,
        now
      );

      transaction.set(participantRef, {
        uid,
        email: acceptedEmail ?? "",
        displayName,
        role: "participant",
        status: "active",
        joinedAt: now,
        invitedByUid: createdByUid,
        permissions: {
          canAddEntry: true,
          canApprove: true,
          canInvite: false,
        },
      });

      transaction.update(inviteRef, {
        status: "accepted",
        acceptedAt: now,
        acceptedByUid: uid,
        acceptedEmail,
      });

      const acceptedMetadata: Record<string, string> = {bindingMode};
      if (domain) {
        acceptedMetadata.acceptedEmailDomain = domain;
      }

      transaction.set(auditAcceptedRef, {
        action: "invitation.accepted",
        actorUid: uid,
        entityType: "invitation",
        entityId: inviteId,
        createdAt: now,
        metadata: acceptedMetadata,
      });

      transaction.set(auditParticipantRef, {
        action: "participant.added",
        actorUid: uid,
        entityType: "participant",
        entityId: uid,
        createdAt: now,
        metadata: {role: "participant"},
      });

      transaction.update(cardRef, summaryFields);

      return {cardId};
    });
  }
);
