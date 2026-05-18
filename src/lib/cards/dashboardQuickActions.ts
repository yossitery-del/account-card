import type { ViewerPendingAwaitingMyApproval } from "@/types/card";

export type DashboardQuickActionTarget = {
  entryId: string;
};

/**
 * מציג פעולות מהירות רק כשיש בדיוק רשומה ממתינה אחת עם entryId מהשרת.
 */
export function getDashboardQuickActionTarget(
  awaiting: ViewerPendingAwaitingMyApproval
): DashboardQuickActionTarget | null {
  if (awaiting.pendingAwaitingMyApprovalCount !== 1) {
    return null;
  }

  const entryId = awaiting.pendingAwaitingMyApproval?.entryId;
  if (typeof entryId !== "string" || !entryId.trim()) {
    return null;
  }

  return {entryId: entryId.trim()};
}
