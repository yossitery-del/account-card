/** הזמנה לכרטיס — Stage 2B-2+ */

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export type InvitationBindingMode = "claim_on_accept";

export type CreateInvitationResult = {
  inviteLink: string;
  expiresAt: string;
};

export type InvitationPreviewStatus =
  | "valid"
  | "expired"
  | "accepted"
  | "revoked"
  | "invalid";

export type InvitationPreviewResult = {
  status: InvitationPreviewStatus;
  inviterDisplayName?: string;
  expiresAt?: string;
};
