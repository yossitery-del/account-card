import {setGlobalOptions} from "firebase-functions/v2";
import {onCall} from "firebase-functions/v2/https";
import {createAccountCard} from "./cards/createAccountCard";
import {approveEntry} from "./entries/approveEntry";
import {cancelEntry} from "./entries/cancelEntry";
import {createEntry} from "./entries/createEntry";
import {editEntry} from "./entries/editEntry";
import {rejectEntry} from "./entries/rejectEntry";
import {acceptInvitation} from "./invitations/acceptInvitation";
import {createInvitation} from "./invitations/createInvitation";
import {getInvitationPreview} from "./invitations/getInvitationPreview";
import {FUNCTIONS_REGION} from "./lib/admin";

export {
  acceptInvitation,
  approveEntry,
  cancelEntry,
  createAccountCard,
  createEntry,
  createInvitation,
  editEntry,
  getInvitationPreview,
  rejectEntry,
};

setGlobalOptions({region: FUNCTIONS_REGION});

export type HealthResponse = {
  ok: true;
  stage: "2B-0";
  timestamp: string;
  region: string;
  authenticated: boolean;
};

/**
 * Callable בסיסי — בודק deploy, region, ומצב auth (ללא חובת התחברות).
 * לא כותב ל-Firestore.
 */
export const health = onCall(
  {region: FUNCTIONS_REGION},
  async (request): Promise<HealthResponse> => {
    return {
      ok: true,
      stage: "2B-0",
      timestamp: new Date().toISOString(),
      region: FUNCTIONS_REGION,
      authenticated: Boolean(request.auth?.uid),
    };
  }
);
