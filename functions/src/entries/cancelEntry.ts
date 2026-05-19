import {FieldValue, Transaction} from "firebase-admin/firestore";
import {onCall} from "firebase-functions/v2/https";
import {
  assertCanCancelEntryFromSnapshots,
} from "../lib/assertCanCancelEntry";
import {parseEntryDelta} from "../lib/assertCanApproveEntry";
import {db, FUNCTIONS_REGION} from "../lib/admin";
import {parseEntryActionPayload} from "../lib/entryActionPayload";
import {requireAuthUid} from "../lib/auth";
import {
  buildDashboardPendingSummaryFields,
  excludePendingEntryById,
  loadDashboardPendingSummaryInputs,
} from "../lib/recomputeDashboardPendingSummary";
import {createEntryResolvePerf} from "../lib/entryResolveCallablePerf";
import {readEntryMutationBalances} from "../lib/entryMutationBalances";
import {parseCardId, parseEntryId} from "../lib/validators";

export type CancelEntryInput = {
  cardId: string;
  entryId: string;
};

export type CancelEntryOutput = Awaited<
  ReturnType<typeof readEntryMutationBalances>
>;

/**
 * מבטל רשומה pending על ידי יוצר — מסיר השפעה מ-pendingBalanceImpact בלבד.
 */
export const cancelEntry = onCall(
  {region: FUNCTIONS_REGION},
  async (request): Promise<CancelEntryOutput> => {
    let perfCardId = "";
    let perfEntryId = "";
    let perf = createEntryResolvePerf("cancelEntry", "", "");

    try {
      const authStart = Date.now();
      const uid = requireAuthUid(request);
      const data = parseEntryActionPayload(request.data);

      const cardId = parseCardId(data.cardId);
      const entryId = parseEntryId(data.entryId);
      perfCardId = cardId;
      perfEntryId = entryId;
      perf = createEntryResolvePerf("cancelEntry", cardId, entryId);
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
        assertCanCancelEntryFromSnapshots({
          cardExists: cardSnap.exists,
          card: cardSnap.data(),
          entryExists: entrySnap.exists,
          entry,
          uid,
          activeParticipants: summaryInputs.activeParticipants,
        });
        perf.logStage("transaction.permissionValidation", Date.now() - validationStart);

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
          status: "cancelled",
          cancelledByUid: uid,
          cancelledAt: now,
        });

        transaction.update(cardRef, {
          pendingBalanceImpact: FieldValue.increment(-delta),
          updatedAt: now,
          ...summaryFields,
        });

        transaction.set(auditRef, {
          action: "entry.cancelled",
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
      const result = await readEntryMutationBalances(cardId, entryId);
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
