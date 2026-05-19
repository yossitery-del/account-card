import {FieldValue, Transaction} from "firebase-admin/firestore";
import {onCall} from "firebase-functions/v2/https";
import {
  assertCanApproveEntryFromSnapshots,
  parseEntryDelta,
} from "../lib/assertCanApproveEntry";
import {db} from "../lib/admin";
import {WARMED_ENTRY_CALLABLE_OPTIONS} from "../lib/callableOptions";
import {createEntryResolvePerf} from "../lib/entryResolveCallablePerf";
import {parseEntryActionPayload} from "../lib/entryActionPayload";
import {requireAuthUid} from "../lib/auth";
import {
  buildDashboardPendingSummaryFields,
  excludePendingEntryById,
  loadDashboardPendingSummaryInputs,
} from "../lib/recomputeDashboardPendingSummary";
import {readEntryMutationResult} from "../lib/entryMutationBalances";
import {parseCardId, parseEntryId} from "../lib/validators";

export type ApproveEntryInput = {
  cardId: string;
  entryId: string;
};

export type ApproveEntryOutput = Awaited<
  ReturnType<typeof readEntryMutationResult>
>;

/**
 * מאשר רשומה pending — מעביר השפעה מ-pendingBalanceImpact ל-officialBalance.
 */
export const approveEntry = onCall(
  WARMED_ENTRY_CALLABLE_OPTIONS,
  async (request): Promise<ApproveEntryOutput> => {
    let perfCardId = "";
    let perfEntryId = "";
    let perf = createEntryResolvePerf("approveEntry", "", "");

    try {
      const authStart = Date.now();
      const uid = requireAuthUid(request);
      const data = parseEntryActionPayload(request.data);
      const cardId = parseCardId(data.cardId);
      const entryId = parseEntryId(data.entryId);
      perfCardId = cardId;
      perfEntryId = entryId;
      perf = createEntryResolvePerf("approveEntry", cardId, entryId);
      perf.logStage("authValidation", Date.now() - authStart);

      const cardRef = db.collection("accountCards").doc(cardId);
      const entryRef = cardRef.collection("entries").doc(entryId);
      const auditRef = cardRef.collection("auditEvents").doc();
      const now = FieldValue.serverTimestamp();

      const txStart = Date.now();
      await db.runTransaction(async (transaction: Transaction) => {
        const parallelReadsStart = Date.now();

        const cardEntryReadsStart = Date.now();
        const cardEntryPromise = Promise.all([
          transaction.get(cardRef),
          transaction.get(entryRef),
        ]).then((result) => {
          perf.logStage(
            "transaction.cardEntryReads",
            Date.now() - cardEntryReadsStart
          );
          return result;
        });

        const summaryInputsStart = Date.now();
        const summaryInputsPromise = loadDashboardPendingSummaryInputs(
          transaction,
          cardRef
        ).then((result) => {
          perf.logStage(
            "transaction.loadDashboardPendingSummaryInputs",
            Date.now() - summaryInputsStart
          );
          return result;
        });

        const [cardEntryPair, summaryInputs] = await Promise.all([
          cardEntryPromise,
          summaryInputsPromise,
        ]);
        const [cardSnap, entrySnap] = cardEntryPair;
        perf.logStage("transaction.readsParallel", Date.now() - parallelReadsStart);

        const validationStart = Date.now();
        const entry = entrySnap.data() ?? {};
        assertCanApproveEntryFromSnapshots({
          cardExists: cardSnap.exists,
          card: cardSnap.data(),
          entryExists: entrySnap.exists,
          entry,
          uid,
          activeParticipants: summaryInputs.activeParticipants,
        });
        perf.logStage("transaction.approvalValidation", Date.now() - validationStart);

        const delta = parseEntryDelta(entry);
        const amount = entry.amount as number;
        const effectOnPerspectiveBalance = entry.effectOnPerspectiveBalance as string;

        const pendingEntriesAfterResolve = excludePendingEntryById(
          summaryInputs.pendingEntries,
          entryId
        );

        const summaryBuildStart = Date.now();
        const summaryFields = buildDashboardPendingSummaryFields(
          pendingEntriesAfterResolve,
          summaryInputs.activeParticipants,
          now
        );
        perf.logStage("transaction.summaryBuild", Date.now() - summaryBuildStart);

        const writesStart = Date.now();
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
        perf.logStage("transaction.writes", Date.now() - writesStart);
      });
      perf.logStage("transactionTotal", Date.now() - txStart);

      const postTxStart = Date.now();
      const result = await readEntryMutationResult(cardId, entryId, {
        viewerUid: uid,
      });
      perf.logStage("postTransactionResult", Date.now() - postTxStart);

      perf.logTotal(true);
      return result;
    } catch (err) {
      if (perfCardId && perfEntryId) {
        perf.logTotal(false);
      }
      throw err;
    }
  }
);
