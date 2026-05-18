import {afterEach, describe, expect, it} from "vitest";
import {createEntry, type CreateEntryInput, type CreateEntryOutput} from "../../entries/createEntry";
import {callCallable} from "../helpers/callCallable";
import {readCard, resetFirestore, seedCard} from "../helpers/firestore";

describe("createEntry smoke", () => {
  afterEach(async () => {
    await resetFirestore();
  });

  it("יוצר רשומה pending ומעדכן pendingBalanceImpact באמולטור", async () => {
    const {cardId, ownerUid, participantUid} = await seedCard();

    const result = await callCallable<CreateEntryInput, CreateEntryOutput>(
      createEntry,
      ownerUid,
      {
        cardId,
        intent: "to_receive",
        amount: 125,
        title: "בדיקת smoke",
      }
    );

    const card = await readCard(cardId);

    expect(result.cardId).toBe(cardId);
    expect(result.entryId).toEqual(expect.any(String));
    expect(result.officialBalance).toBe(0);
    expect(result.pendingBalanceImpact).toBe(125);
    expect(result.updatedAt).toEqual(expect.any(String));
    expect(card.officialBalance).toBe(result.officialBalance);
    expect(card.pendingBalanceImpact).toBe(result.pendingBalanceImpact);

    const summary = card.dashboardPendingSummaryByUid as Record<
      string,
      {
        pendingAwaitingMyApprovalCount: number;
        pendingAwaitingMyApproval?: {entryId: string} | null;
      }
    >;

    expect(summary[ownerUid].pendingAwaitingMyApprovalCount).toBe(0);
    expect(summary[participantUid].pendingAwaitingMyApprovalCount).toBe(1);
    expect(summary[participantUid].pendingAwaitingMyApproval?.entryId).toBe(
      result.entryId
    );
    expect(card.dashboardPendingSummaryUpdatedAt).toBeDefined();
  });
});
