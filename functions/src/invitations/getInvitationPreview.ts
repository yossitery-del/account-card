import {Timestamp} from "firebase-admin/firestore";
import {onCall} from "firebase-functions/v2/https";
import {db, FUNCTIONS_REGION} from "../lib/admin";
import {isCleanDisplayName} from "../lib/displayNameQuality";
import {tryParseInviteToken} from "../lib/parseInviteToken";
import {previewLog} from "../lib/safePreviewLog";
import {hashInviteToken} from "../lib/tokens";

export type InvitationPreviewStatus =
  | "valid"
  | "expired"
  | "accepted"
  | "revoked"
  | "invalid";

export type GetInvitationPreviewInput = {
  token: string;
};

export type GetInvitationPreviewOutput = {
  status: InvitationPreviewStatus;
  inviterDisplayName?: string;
  expiresAt?: string;
};

function expiresAtMillis(value: unknown): number | null {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  return null;
}

/**
 * Preview מוגבל להזמנה — ללא cardId, UID, יתרות וכו'.
 * invoker: public — קריאה ללא Firebase Auth (דף join ציבורי).
 */
export const getInvitationPreview = onCall(
  {region: FUNCTIONS_REGION, invoker: "public"},
  async (request): Promise<GetInvitationPreviewOutput> => {
    try {
      const token = tryParseInviteToken(request.data?.token);
      if (!token) {
        return {status: "invalid"};
      }

      const tokenHash = hashInviteToken(token);
      previewLog.lookupStart(tokenHash);

      const snapshot = await db
        .collectionGroup("invitations")
        .where("tokenHash", "==", tokenHash)
        .limit(1)
        .get();

      if (snapshot.empty) {
        previewLog.lookupResult(false);
        return {status: "invalid"};
      }

      const invitation = snapshot.docs[0].data();
      const storedStatus = invitation.status as string | undefined;
      const expiresMs = expiresAtMillis(invitation.expiresAt);

      previewLog.lookupResult(true, storedStatus, expiresMs);

      if (storedStatus === "accepted") {
        return {status: "accepted"};
      }
      if (storedStatus === "revoked") {
        return {status: "revoked"};
      }

      if (expiresMs !== null && expiresMs < Date.now()) {
        return {status: "expired"};
      }

      if (storedStatus !== "pending") {
        return {status: "invalid"};
      }

      let inviterDisplayName: string | undefined;
      const createdByUid = invitation.createdByUid;
      if (typeof createdByUid === "string" && createdByUid) {
        const userSnap = await db.collection("users").doc(createdByUid).get();
        const name = userSnap.data()?.displayName;
        if (typeof name === "string" && isCleanDisplayName(name)) {
          inviterDisplayName = name.trim();
        }
      }

      const output: GetInvitationPreviewOutput = {status: "valid"};
      if (inviterDisplayName) {
        output.inviterDisplayName = inviterDisplayName;
      }
      if (expiresMs !== null) {
        output.expiresAt = new Date(expiresMs).toISOString();
      }

      return output;
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown";
      previewLog.unexpectedError(message);
      return {status: "invalid"};
    }
  }
);
