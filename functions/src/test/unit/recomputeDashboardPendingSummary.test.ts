import {describe, expect, it} from "vitest";
import {buildDashboardPendingSummaryByUid} from "../../lib/recomputeDashboardPendingSummary";

const ownerUid = "uid-owner";
const participantUid = "uid-participant";

const activeOwner = {
  id: ownerUid,
  status: "active",
  permissions: {canApprove: true},
};

const activeParticipant = {
  id: participantUid,
  status: "active",
  permissions: {canApprove: true},
};

function pendingEntry(
  id: string,
  createdByUid: string,
  overrides: Partial<{
    title: string;
    amount: number;
    effectOnPerspectiveBalance: "increase" | "decrease";
  }> = {}
) {
  return {
    id,
    status: "pending",
    title: "רשומה",
    amount: 100,
    effectOnPerspectiveBalance: "increase" as const,
    entryDate: {__type: "timestamp"},
    createdAt: {__type: "timestamp"},
    createdByUid,
    ...overrides,
  };
}

describe("buildDashboardPendingSummaryByUid", () => {
  it("0 pending — כולם עם count 0", () => {
    const map = buildDashboardPendingSummaryByUid([], [activeOwner, activeParticipant]);
    expect(map[ownerUid]).toEqual({
      pendingAwaitingMyApprovalCount: 0,
      pendingAwaitingMyApproval: null,
    });
    expect(map[participantUid]).toEqual({
      pendingAwaitingMyApprovalCount: 0,
      pendingAwaitingMyApproval: null,
    });
  });

  it("רשומה של owner — participant רואה 1, owner רואה 0", () => {
    const map = buildDashboardPendingSummaryByUid(
      [pendingEntry("e1", ownerUid)],
      [activeOwner, activeParticipant]
    );
    expect(map[ownerUid].pendingAwaitingMyApprovalCount).toBe(0);
    expect(map[participantUid].pendingAwaitingMyApprovalCount).toBe(1);
    expect(map[participantUid].pendingAwaitingMyApproval?.entryId).toBe("e1");
  });

  it("2+ pending לאחרים — count בלי preview", () => {
    const map = buildDashboardPendingSummaryByUid(
      [pendingEntry("e1", ownerUid), pendingEntry("e2", ownerUid)],
      [activeParticipant]
    );
    expect(map[participantUid]).toEqual({
      pendingAwaitingMyApprovalCount: 2,
    });
    expect(map[participantUid].pendingAwaitingMyApproval).toBeUndefined();
  });

  it("canApprove false — תמיד 0", () => {
    const map = buildDashboardPendingSummaryByUid(
      [pendingEntry("e1", ownerUid)],
      [
        {
          id: participantUid,
          status: "active",
          permissions: {canApprove: false},
        },
      ]
    );
    expect(map[participantUid].pendingAwaitingMyApprovalCount).toBe(0);
  });
});
