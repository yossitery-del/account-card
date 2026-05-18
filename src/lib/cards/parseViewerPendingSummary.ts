import type {
  DashboardPendingEntryPreview,
  ViewerPendingAwaitingMyApproval,
} from "@/types/card";
import type { EntryEffect } from "@/types/entry";

const EMPTY_VIEWER_PENDING: ViewerPendingAwaitingMyApproval = {
  pendingAwaitingMyApprovalCount: 0,
  pendingAwaitingMyApproval: null,
};

function parseEntryPreview(raw: unknown): DashboardPendingEntryPreview | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const row = raw as Record<string, unknown>;
  if (row.status !== "pending") {
    return null;
  }
  if (typeof row.entryId !== "string" || !row.entryId) {
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
    entryId: row.entryId,
    title: row.title.trim(),
    amount: row.amount,
    effectOnPerspectiveBalance: row.effectOnPerspectiveBalance as EntryEffect,
    entryDate: row.entryDate,
    createdAt: row.createdAt,
    createdByUid: row.createdByUid,
    status: "pending",
  };
}

/**
 * ממפה dashboardPendingSummaryByUid[viewerUid] לסיכום צופה — ללא חשיפת המפה המלאה ל-UI.
 */
export function parseViewerPendingSummary(
  dashboardPendingSummaryByUid: unknown,
  viewerUid: string
): ViewerPendingAwaitingMyApproval {
  if (!dashboardPendingSummaryByUid || typeof dashboardPendingSummaryByUid !== "object") {
    return EMPTY_VIEWER_PENDING;
  }

  const raw = (dashboardPendingSummaryByUid as Record<string, unknown>)[viewerUid];
  if (!raw || typeof raw !== "object") {
    return EMPTY_VIEWER_PENDING;
  }

  const row = raw as Record<string, unknown>;
  const count =
    typeof row.pendingAwaitingMyApprovalCount === "number" &&
    Number.isFinite(row.pendingAwaitingMyApprovalCount) &&
    row.pendingAwaitingMyApprovalCount >= 0
      ? Math.floor(row.pendingAwaitingMyApprovalCount)
      : 0;

  if (count === 0) {
    return EMPTY_VIEWER_PENDING;
  }

  if (count === 1) {
    const preview = parseEntryPreview(row.pendingAwaitingMyApproval);
    return {
      pendingAwaitingMyApprovalCount: 1,
      pendingAwaitingMyApproval: preview,
    };
  }

  return {
    pendingAwaitingMyApprovalCount: count,
  };
}
