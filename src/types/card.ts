/** כרטיס חשבון משותף — Stage 2A */

import type { EntryEffect } from "./entry";

export type AccountCardStatus = "active" | "archived" | "pending_second_party";
export type ParticipantRole = "owner" | "participant";
export type ParticipantStatus = "active" | "left" | "removed";
export type EncryptionMode = "none" | "fields_v1";

export type ParticipantPermissions = {
  canAddEntry: boolean;
  canApprove: boolean;
  canInvite: boolean;
};

/** תצוגת רשומה ממתינה לבדיקה — מסונכרן מ-Functions ב-dashboardPendingSummaryByUid */
export type DashboardPendingEntryPreview = {
  entryId: string;
  title: string;
  amount: number;
  effectOnPerspectiveBalance: EntryEffect;
  entryDate: unknown;
  createdAt: unknown;
  createdByUid: string;
  status: "pending";
};

/** סיכום ממתין לבדיקה עבור משתתף בודד (לא ממפה את כל המשתתפים) */
export type ViewerPendingAwaitingMyApproval = {
  pendingAwaitingMyApprovalCount: number;
  pendingAwaitingMyApproval?: DashboardPendingEntryPreview | null;
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
  dashboardPendingSummaryByUid?: Record<string, ViewerPendingAwaitingMyApproval>;
  dashboardPendingSummaryUpdatedAt?: unknown;
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
  /** כותרת לתצוגה אצל הצופה — נגזרת בלקוח כשיש שני משתתפים פעילים; לא שדה Firestore */
  title: string;
  balancePerspectiveUid: string;
  officialBalance: number;
  pendingBalanceImpact: number;
  updatedAt: unknown;
  /** סיכום ממתין לבדיקה עבור הצופה הנוכחי בלבד */
  pendingAwaitingMyApproval: ViewerPendingAwaitingMyApproval;
};
