import {
  DocumentReference,
  FieldValue,
  QuerySnapshot,
  Timestamp,
  Transaction,
} from "firebase-admin/firestore";

export type DashboardPendingEntryPreview = {
  entryId: string;
  title: string;
  amount: number;
  effectOnPerspectiveBalance: "increase" | "decrease";
  entryDate: Timestamp | FieldValue;
  createdAt: Timestamp | FieldValue;
  createdByUid: string;
  status: "pending";
};

export type ParticipantDashboardPendingSummary = {
  pendingAwaitingMyApprovalCount: number;
  pendingAwaitingMyApproval?: DashboardPendingEntryPreview | null;
};

export type DashboardPendingSummaryByUid = Record<
  string,
  ParticipantDashboardPendingSummary
>;

export type PendingEntryRow = {
  id: string;
  status?: string;
  title?: string;
  amount?: number;
  effectOnPerspectiveBalance?: string;
  entryDate?: unknown;
  createdAt?: unknown;
  createdByUid?: string;
};

export type ActiveParticipantRow = {
  id: string;
  status?: string;
  permissions?: {canApprove?: boolean};
};

export type DashboardPendingSummaryInputs = {
  pendingEntries: PendingEntryRow[];
  activeParticipants: ActiveParticipantRow[];
};

export type DashboardPendingSummaryFields = {
  dashboardPendingSummaryByUid: DashboardPendingSummaryByUid;
  dashboardPendingSummaryUpdatedAt: FieldValue | Timestamp;
};

function participantCanApprove(participant: ActiveParticipantRow): boolean {
  return participant.permissions?.canApprove === true;
}

function toEntryPreview(row: PendingEntryRow): DashboardPendingEntryPreview | null {
  if (row.status !== "pending") {
    return null;
  }
  if (typeof row.title !== "string" || !row.title.trim()) {
    return null;
  }
  if (
    typeof row.amount !== "number" ||
    !Number.isFinite(row.amount) ||
    row.amount <= 0
  ) {
    return null;
  }
  if (
    row.effectOnPerspectiveBalance !== "increase" &&
    row.effectOnPerspectiveBalance !== "decrease"
  ) {
    return null;
  }
  if (typeof row.createdByUid !== "string" || !row.createdByUid) {
    return null;
  }

  return {
    entryId: row.id,
    title: row.title.trim(),
    amount: row.amount,
    effectOnPerspectiveBalance: row.effectOnPerspectiveBalance,
    entryDate: row.entryDate as Timestamp | FieldValue,
    createdAt: row.createdAt as Timestamp | FieldValue,
    createdByUid: row.createdByUid,
    status: "pending",
  };
}

export function pendingRowsFromSnapshot(
  snap: QuerySnapshot
): PendingEntryRow[] {
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<PendingEntryRow, "id">),
  }));
}

export function activeParticipantsFromSnapshot(
  snap: QuerySnapshot
): ActiveParticipantRow[] {
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<ActiveParticipantRow, "id">),
  }));
}

/**
 * קריאות בלבד — חייב להיקרא לפני כל כתיבה בטרנזקציה.
 */
export async function loadDashboardPendingSummaryInputs(
  transaction: Transaction,
  cardRef: DocumentReference
): Promise<DashboardPendingSummaryInputs> {
  const [pendingSnap, participantsSnap] = await Promise.all([
    transaction.get(
      cardRef.collection("entries").where("status", "==", "pending")
    ),
    transaction.get(
      cardRef.collection("participants").where("status", "==", "active")
    ),
  ]);

  return {
    pendingEntries: pendingRowsFromSnapshot(pendingSnap),
    activeParticipants: activeParticipantsFromSnapshot(participantsSnap),
  };
}

export function excludePendingEntryById(
  rows: PendingEntryRow[],
  entryId: string
): PendingEntryRow[] {
  return rows.filter((row) => row.id !== entryId);
}

export function upsertPendingEntryRow(
  rows: PendingEntryRow[],
  row: PendingEntryRow
): PendingEntryRow[] {
  const without = rows.filter((existing) => existing.id !== row.id);
  return [...without, row];
}

/**
 * בונה מפת סיכום לפי משתתפים פעילים — ללא infer מ-pendingBalanceImpact.
 */
export function buildDashboardPendingSummaryByUid(
  pendingEntries: PendingEntryRow[],
  activeParticipants: ActiveParticipantRow[]
): DashboardPendingSummaryByUid {
  const result: DashboardPendingSummaryByUid = {};

  for (const participant of activeParticipants) {
    if (participant.status !== "active") {
      continue;
    }

    const participantUid = participant.id;

    if (!participantCanApprove(participant)) {
      result[participantUid] = {
        pendingAwaitingMyApprovalCount: 0,
        pendingAwaitingMyApproval: null,
      };
      continue;
    }

    const awaiting = pendingEntries
      .filter((entry) => entry.createdByUid !== participantUid)
      .map(toEntryPreview)
      .filter((preview): preview is DashboardPendingEntryPreview => preview !== null);

    const count = awaiting.length;

    if (count === 0) {
      result[participantUid] = {
        pendingAwaitingMyApprovalCount: 0,
        pendingAwaitingMyApproval: null,
      };
      continue;
    }

    if (count === 1) {
      result[participantUid] = {
        pendingAwaitingMyApprovalCount: 1,
        pendingAwaitingMyApproval: awaiting[0],
      };
      continue;
    }

    result[participantUid] = {
      pendingAwaitingMyApprovalCount: count,
    };
  }

  return result;
}

export function buildDashboardPendingSummaryFields(
  pendingEntries: PendingEntryRow[],
  activeParticipants: ActiveParticipantRow[],
  now: FieldValue | Timestamp = FieldValue.serverTimestamp()
): DashboardPendingSummaryFields {
  return {
    dashboardPendingSummaryByUid: buildDashboardPendingSummaryByUid(
      pendingEntries,
      activeParticipants
    ),
    dashboardPendingSummaryUpdatedAt: now,
  };
}
