/** רשומת כרטיס — Stage 2C */

export type EntryIntent = "to_receive" | "to_pay";
export type EntryType = "charge" | "credit";
export type EntryEffect = "increase" | "decrease";
export type EntryStatus = "pending" | "approved" | "rejected" | "cancelled";

export type AccountCardEntry = {
  type: EntryType;
  intent?: EntryIntent | null;
  amount: number;
  effectOnPerspectiveBalance: EntryEffect;
  title: string;
  entryDate: unknown;
  status: EntryStatus;
  createdByUid: string;
  createdAt: unknown;
  updatedAt?: unknown | null;
  editedAt?: unknown | null;
  editedByUid?: string | null;
  editCount?: number;
  approvedByUid: string | null;
  approvedAt: unknown | null;
  rejectedByUid: string | null;
  rejectedAt: unknown | null;
  rejectionNote: string | null;
  cancelledByUid: string | null;
  cancelledAt: unknown | null;
};

export type AccountCardEntryWithId = AccountCardEntry & {
  id: string;
};
