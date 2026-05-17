import {FieldValue, Timestamp} from "firebase-admin/firestore";
import {onCall} from "firebase-functions/v2/https";
import {getAppBaseUrl} from "../lib/appBaseUrl";
import {db, FUNCTIONS_REGION} from "../lib/admin";
import {requireAuthUid} from "../lib/auth";
import {assertCanInvite} from "../lib/participants";
import {generateInviteToken, hashInviteToken} from "../lib/tokens";
import {parseCardId, parseOptionalLabel} from "../lib/validators";

const INVITE_TTL_DAYS = 30;
export const INVITATION_BINDING_MODE = "claim_on_accept";

export type CreateInvitationInput = {
  cardId: string;
  invitedName?: string;
  intendedRecipientLabel?: string;
};

export type CreateInvitationOutput = {
  inviteLink: string;
  expiresAt: string;
};

/**
 * יוצר הזמנה link/token בלבד (claim-on-accept) — ללא email חובה.
 */
export const createInvitation = onCall(
  {region: FUNCTIONS_REGION},
  async (request): Promise<CreateInvitationOutput> => {
    const uid = requireAuthUid(request);
    const cardId = parseCardId(request.data?.cardId);
    const invitedName = parseOptionalLabel(
      request.data?.invitedName,
      "שם להצגה לא תקין"
    );
    const intendedRecipientLabel = parseOptionalLabel(
      request.data?.intendedRecipientLabel,
      "תווית נמען לא תקינה"
    );

    await assertCanInvite(cardId, uid);

    const rawToken = generateInviteToken();
    const tokenHash = hashInviteToken(rawToken);

    const expiresAtDate = new Date();
    expiresAtDate.setUTCDate(expiresAtDate.getUTCDate() + INVITE_TTL_DAYS);
    const expiresAt = Timestamp.fromDate(expiresAtDate);

    const cardRef = db.collection("accountCards").doc(cardId);
    const inviteRef = cardRef.collection("invitations").doc();
    const auditRef = cardRef.collection("auditEvents").doc();
    const now = FieldValue.serverTimestamp();

    const batch = db.batch();

    batch.set(inviteRef, {
      tokenHash,
      status: "pending",
      createdByUid: uid,
      createdAt: now,
      expiresAt,
      acceptedAt: null,
      acceptedByUid: null,
      acceptedEmail: null,
      invitedName,
      intendedRecipientLabel,
      bindingMode: INVITATION_BINDING_MODE,
    });

    batch.set(auditRef, {
      action: "invitation.created",
      actorUid: uid,
      entityType: "invitation",
      entityId: inviteRef.id,
      createdAt: now,
      metadata: {
        bindingMode: INVITATION_BINDING_MODE,
        invitedNameProvided: invitedName !== null,
        intendedRecipientLabelProvided: intendedRecipientLabel !== null,
      },
    });

    await batch.commit();

    const baseUrl = getAppBaseUrl();
    const inviteLink = `${baseUrl}/join/${rawToken}`;

    return {
      inviteLink,
      expiresAt: expiresAtDate.toISOString(),
    };
  }
);
