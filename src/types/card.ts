/** כרטיס חשבון משותף — Stage 2A */

export type AccountCardStatus = "active" | "archived" | "pending_second_party";
export type ParticipantRole = "owner" | "participant";
export type ParticipantStatus = "active" | "left" | "removed";
export type EncryptionMode = "none" | "fields_v1";

export type ParticipantPermissions = {
  canAddEntry: boolean;
  canApprove: boolean;
  canInvite: boolean;
};

export type AccountCard = {
  title: string;
  currency: string;
  status: AccountCardStatus;
  createdByUid: string;
  balancePerspectiveUid: string;
  createdAt: unknown;
  updatedAt: unknown;
  officialBalance: number;
  pendingBalanceImpact: number;
  encryptionMode: EncryptionMode;
  dataSchemaVersion: number;
};

export type CardParticipant = {
  uid: string;
  email: string;
  displayName: string;
  role: ParticipantRole;
  status: ParticipantStatus;
  joinedAt: unknown;
  invitedByUid: string | null;
  permissions: ParticipantPermissions;
};

/** כרטיס עם מזהה — לדשבורד ומסך פרטים */
export type AccountCardSummary = {
  id: string;
  title: string;
  balancePerspectiveUid: string;
  officialBalance: number;
  pendingBalanceImpact: number;
  updatedAt: unknown;
};
