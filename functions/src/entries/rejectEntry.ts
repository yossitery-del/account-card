import {FieldValue, Transaction} from "firebase-admin/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {
  assertCanApproveEntry,
  assertEntryApprovable,
  parseEntryDelta,
} from "../lib/assertCanApproveEntry";
import {db} from "../lib/admin";
import {WARMED_ENTRY_CALLABLE_OPTIONS} from "../lib/callableOptions";
import {parseEntryActionPayload} from "../lib/entryActionPayload";
import {requireAuthUid} from "../lib/auth";
import {
  buildDashboardPendingSummaryFields,
  excludePendingEntryById,
  loadDashboardPendingSummaryInputs,
} from "../lib/recomputeDashboardPendingSummary";
import {readEntryMutationResult} from "../lib/entryMutationBalances";
import {parseCardId, parseEntryId, parseRejectionNote} from "../lib/validators";

export type RejectEntryInput = {
  cardId: string;
  entryId: string;
  rejectionNote?: string;
};

export type RejectEntryOutput = Awaited<
  ReturnType<typeof readEntryMutationResult>
>;

/**
 * דוחה רשומה pending — מסיר השפעה מ-pendingBalanceImpact בלבד.
 */
export const rejectEntry = onCall(
  WARMED_ENTRY_CALLABLE_OPTIONS,
  async (request): Promise<RejectEntryOutput> => {
    const uid = requireAuthUid(request);
    const data = parseEntryActionPayload(request.data);

    const cardId = parseCardId(data.cardId);
    const entryId = parseEntryId(data.entryId);
    const rejectionNote = parseRejectionNote(data.rejectionNote);

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
        status: "rejected",
        rejectedByUid: uid,
        rejectedAt: now,
        rejectionNote,
      });

      transaction.update(cardRef, {
        pendingBalanceImpact: FieldValue.increment(-delta),
        updatedAt: now,
        ...summaryFields,
      });

      transaction.set(auditRef, {
        action: "entry.rejected",
        actorUid: uid,
        entityType: "entry",
        entityId: entryId,
        createdAt: now,
        metadata: {
          amount,
          effectOnPerspectiveBalance,
          delta,
          hasRejectionNote: rejectionNote !== null,
        },
      });
    });

    return readEntryMutationResult(cardId, entryId, {viewerUid: uid});
  }
);
