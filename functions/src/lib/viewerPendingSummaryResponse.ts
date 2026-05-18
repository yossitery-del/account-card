import {Timestamp} from "firebase-admin/firestore";
import type {
  DashboardPendingEntryPreview,
  DashboardPendingSummaryByUid,
  ParticipantDashboardPendingSummary,
} from "./recomputeDashboardPendingSummary";

/** סיכום צופה בודד לתשובת Callable — ללא המפה המלאה. */
export type ViewerPendingAwaitingMyApprovalResponse = {
  pendingAwaitingMyApprovalCount: number;
  pendingAwaitingMyApproval?: DashboardPendingEntryPreviewResponse | null;
};

export type DashboardPendingEntryPreviewResponse = {
  entryId: string;
  title: string;
  amount: number;
  effectOnPerspectiveBalance: "increase" | "decrease";
  entryDate: string;
  createdAt: string;
  createdByUid: string;
  status: "pending";
};

function serializeTimestampField(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as {toDate: () => Date}).toDate === "function"
  ) {
    return (value as {toDate: () => Date}).toDate().toISOString();
  }
  if (typeof value === "string" && value) {
    return value;
  }
  return new Date().toISOString();
}

function serializePreviewForCallable(
  preview: DashboardPendingEntryPreview | null | undefined
): DashboardPendingEntryPreviewResponse | null {
  if (!preview) {
    return null;
  }

  return {
    entryId: preview.entryId,
    title: preview.title,
    amount: preview.amount,
    effectOnPerspectiveBalance: preview.effectOnPerspectiveBalance,
    entryDate: serializeTimestampField(preview.entryDate),
    createdAt: serializeTimestampField(preview.createdAt),
    createdByUid: preview.createdByUid,
    status: "pending",
  };
}

function serializeParticipantSummary(
  summary: ParticipantDashboardPendingSummary
): ViewerPendingAwaitingMyApprovalResponse {
  const count = summary.pendingAwaitingMyApprovalCount;

  if (count === 0) {
    return {
      pendingAwaitingMyApprovalCount: 0,
      pendingAwaitingMyApproval: null,
    };
  }

  if (count === 1) {
    return {
      pendingAwaitingMyApprovalCount: 1,
      pendingAwaitingMyApproval: serializePreviewForCallable(
        summary.pendingAwaitingMyApproval
      ),
    };
  }

  return {
    pendingAwaitingMyApprovalCount: count,
  };
}

/**
 * מחזיר רק את סיכום הצופה — לא את dashboardPendingSummaryByUid המלא.
 */
export function viewerPendingSummaryForUid(
  dashboardPendingSummaryByUid: unknown,
  viewerUid: string
): ViewerPendingAwaitingMyApprovalResponse {
  if (
    !dashboardPendingSummaryByUid ||
    typeof dashboardPendingSummaryByUid !== "object"
  ) {
    return {
      pendingAwaitingMyApprovalCount: 0,
      pendingAwaitingMyApproval: null,
    };
  }

  const slice = (dashboardPendingSummaryByUid as DashboardPendingSummaryByUid)[
    viewerUid
  ];

  if (!slice || typeof slice !== "object") {
    return {
      pendingAwaitingMyApprovalCount: 0,
      pendingAwaitingMyApproval: null,
    };
  }

  return serializeParticipantSummary(slice);
}
