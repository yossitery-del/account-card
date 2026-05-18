import {
  DocumentReference,
  FieldValue,
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

type PendingEntryRow = {
  id: string;
  status?: string;
  title?: string;
  amount?: number;
  effectOnPerspectiveBalance?: string;
  entryDate?: unknown;
  createdAt?: unknown;
  createdByUid?: string;
};

type ActiveParticipantRow = {
  id: string;
  status?: string;
  permissions?: {canApprove?: boolean};
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

export type DashboardPendingSummaryFields = {
  dashboardPendingSummaryByUid: DashboardPendingSummaryByUid;
  dashboardPendingSummaryUpdatedAt: FieldValue | Timestamp;
};

/**
 * קורא pending entries + משתתפים פעילים בתוך טרנזקציה ומחזיר שדות לעדכון כרטיס.
 */
export async function loadDashboardPendingSummaryFields(
  transaction: Transaction,
  cardRef: DocumentReference,
  now: FieldValue | Timestamp = FieldValue.serverTimestamp()
): Promise<DashboardPendingSummaryFields> {
  const [pendingSnap, participantsSnap] = await Promise.all([
    transaction.get(
      cardRef.collection("entries").where("status", "==", "pending")
    ),
    transaction.get(
      cardRef.collection("participants").where("status", "==", "active")
    ),
  ]);

  const pendingEntries: PendingEntryRow[] = pendingSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<PendingEntryRow, "id">),
  }));

  const activeParticipants: ActiveParticipantRow[] = participantsSnap.docs.map(
    (doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<ActiveParticipantRow, "id">),
    })
  );

  return {
    dashboardPendingSummaryByUid: buildDashboardPendingSummaryByUid(
      pendingEntries,
      activeParticipants
    ),
    dashboardPendingSummaryUpdatedAt: now,
  };
}

/**
 * מעדכן dashboardPendingSummaryByUid על הכרטיס באותה טרנזקציה.
 */
export async function applyDashboardPendingSummaryInTransaction(
  transaction: Transaction,
  cardRef: DocumentReference,
  now: FieldValue | Timestamp = FieldValue.serverTimestamp()
): Promise<void> {
  const fields = await loadDashboardPendingSummaryFields(transaction, cardRef, now);
  transaction.update(cardRef, fields);
}
