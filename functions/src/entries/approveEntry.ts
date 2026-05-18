import {FieldValue, Transaction} from "firebase-admin/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {
  assertCanApproveEntry,
  assertEntryApprovable,
  parseEntryDelta,
} from "../lib/assertCanApproveEntry";
import {db, FUNCTIONS_REGION} from "../lib/admin";
import {parseEntryActionPayload} from "../lib/entryActionPayload";
import {requireAuthUid} from "../lib/auth";
import {
  buildDashboardPendingSummaryFields,
  excludePendingEntryById,
  loadDashboardPendingSummaryInputs,
} from "../lib/recomputeDashboardPendingSummary";
import {readEntryMutationBalances} from "../lib/entryMutationBalances";
import {parseCardId, parseEntryId} from "../lib/validators";

export type ApproveEntryInput = {
  cardId: string;
  entryId: string;
};

export type ApproveEntryOutput = Awaited<
  ReturnType<typeof readEntryMutationBalances>
>;

/**
 * מאשר רשומה pending — מעביר השפעה מ-pendingBalanceImpact ל-officialBalance.
 */
export const approveEntry = onCall(
  {region: FUNCTIONS_REGION},
  async (request): Promise<ApproveEntryOutput> => {
    const uid = requireAuthUid(request);
    const data = parseEntryActionPayload(request.data);

    const cardId = parseCardId(data.cardId);
    const entryId = parseEntryId(data.entryId);

    await assertCanApproveEntry(cardId, entryId, uid);

    const cardRef = db.collection("accountCards").doc(cardId);
    const entryRef = cardRef.collection("entries").doc(entryId);
    const auditRef = cardRef.collection("auditEvents").doc();
    const now = FieldValue.serverTimestamp();

    await db.runTransaction(async (transaction: Transaction) => {
      const [cardSnap, entrySnap, summaryInputs] = await Promise.all([
        transaction.get(cardRef),
        transaction.get(entryRef),
        loadDashboardPendingSummaryInputs(transaction, cardRef),
      ]);

      if (!cardSnap.exists) {
        throw new HttpsError("not-found", "הכרטיס לא נמצא");
      }

      if (!entrySnap.exists) {
        throw new HttpsError("not-found", "הרשומה לא נמצאה");
      }

      const card = cardSnap.data();
      if (card?.status !== "active") {
        throw new HttpsError("failed-precondition", "הכרטיס אינו פעיל");
      }

      const entry = entrySnap.data() ?? {};
      assertEntryApprovable(entry, uid);

      const delta = parseEntryDelta(entry);
      const amount = entry.amount as number;
      const effectOnPerspectiveBalance = entry.effectOnPerspectiveBalance as string;

      const pendingEntriesAfterResolve = excludePendingEntryById(
        summaryInputs.pendingEntries,
        entryId
      );

      const summaryFields = buildDashboardPendingSummaryFields(
        pendingEntriesAfterResolve,
        summaryInputs.activeParticipants,
        now
      );

      transaction.update(entryRef, {
        status: "approved",
        approvedByUid: uid,
        approvedAt: now,
      });

      transaction.update(cardRef, {
        officialBalance: FieldValue.increment(delta),
        pendingBalanceImpact: FieldValue.increment(-delta),
        updatedAt: now,
        ...summaryFields,
      });

      transaction.set(auditRef, {
        action: "entry.approved",
        actorUid: uid,
        entityType: "entry",
        entityId: entryId,
        createdAt: now,
        metadata: {
          amount,
          effectOnPerspectiveBalance,
          delta,
        },
      });
    });

    return readEntryMutationBalances(cardId, entryId);
  }
);
