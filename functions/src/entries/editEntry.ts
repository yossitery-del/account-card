import {FieldValue, Transaction} from "firebase-admin/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {type EntryData} from "../lib/assertCanApproveEntry";
import {
  assertCanEditEntryFromSnapshots,
} from "../lib/assertCanEditEntry";
import {db, FUNCTIONS_REGION} from "../lib/admin";
import {requireAuthUid} from "../lib/auth";
import {
  balanceDelta,
  effectForType,
  intentFromTypeForActor,
  resolveTypeFromIntent,
  type EntryEffect,
  type EntryIntent,
  type EntryType,
} from "../lib/entryIntent";
import {
  buildDashboardPendingSummaryFields,
  loadDashboardPendingSummaryInputs,
  upsertPendingEntryRow,
} from "../lib/recomputeDashboardPendingSummary";
import {createEntryResolvePerf} from "../lib/entryResolveCallablePerf";
import {readEntryMutationBalances} from "../lib/entryMutationBalances";
import {parseEditEntryPayload} from "../lib/parseEditEntryPayload";

export type EditEntryInput = {
  cardId: string;
  entryId: string;
  intent: EntryIntent;
  amount: number;
  title: string;
};

export type EditEntryOutput = Awaited<
  ReturnType<typeof readEntryMutationBalances>
>;

function resolveStoredIntent(
  entry: EntryData & {type?: string; intent?: string},
  createdByUid: string,
  balancePerspectiveUid: string
): EntryIntent {
  if (entry.intent === "to_receive" || entry.intent === "to_pay") {
    return entry.intent;
  }

  const type = entry.type;
  if (type !== "charge" && type !== "credit") {
    throw new HttpsError("failed-precondition", "רשומה לא תקינה");
  }

  return intentFromTypeForActor(
    type as EntryType,
    createdByUid,
    balancePerspectiveUid
  );
}

/**
 * עורך רשומה pending על ידי יוצר — מעדכן pendingBalanceImpact בלבד.
 */
export const editEntry = onCall(
  {region: FUNCTIONS_REGION},
  async (request): Promise<EditEntryOutput> => {
    let perfCardId = "";
    let perfEntryId = "";
    let perf = createEntryResolvePerf("editEntry", "", "");

    try {
      const authStart = Date.now();
      const uid = requireAuthUid(request);
      const {cardId, entryId, intent, amount, title} = parseEditEntryPayload(
        request.data
      );
      perfCardId = cardId;
      perfEntryId = entryId;
      perf = createEntryResolvePerf("editEntry", cardId, entryId);
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
        assertCanEditEntryFromSnapshots({
          cardExists: cardSnap.exists,
          card: cardSnap.data(),
          entryExists: entrySnap.exists,
          entry,
          uid,
          activeParticipants: summaryInputs.activeParticipants,
        });
        perf.logStage("transaction.permissionValidation", Date.now() - validationStart);

        const card = cardSnap.data();
        const balancePerspectiveUid =
          typeof card?.balancePerspectiveUid === "string" ?
            card.balancePerspectiveUid :
            null;
        if (!balancePerspectiveUid) {
          throw new HttpsError("failed-precondition", "כרטיס לא תקין");
        }

        const createdByUid = entry.createdByUid as string;
        const amountBefore = entry.amount as number;
        const effectBefore = entry.effectOnPerspectiveBalance as EntryEffect;
        const titleBefore =
          typeof entry.title === "string" ? entry.title.trim() : "";

        if (
          typeof amountBefore !== "number" ||
          !Number.isFinite(amountBefore) ||
          amountBefore <= 0
        ) {
          throw new HttpsError("failed-precondition", "רשומה לא תקינה");
        }

        if (effectBefore !== "increase" && effectBefore !== "decrease") {
          throw new HttpsError("failed-precondition", "רשומה לא תקינה");
        }

        const intentBefore = resolveStoredIntent(
          entry,
          createdByUid,
          balancePerspectiveUid
        );

        const typeAfter = resolveTypeFromIntent(intent, uid, balancePerspectiveUid);
        const effectAfter = effectForType(typeAfter);
        const deltaBefore = balanceDelta(effectBefore, amountBefore);
        const deltaAfter = balanceDelta(effectAfter, amount);
        const deltaAdjustment = deltaAfter - deltaBefore;

        const titleChanged = titleBefore !== title;
        const intentChanged = intentBefore !== intent;
        const balanceChanged = deltaBefore !== deltaAfter;

        if (!titleChanged && !intentChanged && !balanceChanged) {
          throw new HttpsError("failed-precondition", "לא בוצע שינוי");
        }

        const pendingEntriesAfterEdit = upsertPendingEntryRow(
          summaryInputs.pendingEntries,
          {
            id: entryId,
            status: "pending",
            title,
            amount,
            effectOnPerspectiveBalance: effectAfter,
            entryDate: entry.entryDate,
            createdAt: entry.createdAt,
            createdByUid,
          }
        );

        const summaryBuildStart = Date.now();
        const summaryFields = buildDashboardPendingSummaryFields(
          pendingEntriesAfterEdit,
          summaryInputs.activeParticipants,
          now
        );
        perf.logStage("transaction.summaryBuild", Date.now() - summaryBuildStart);

        const writesStart = Date.now();
        transaction.update(entryRef, {
          intent,
          type: typeAfter,
          effectOnPerspectiveBalance: effectAfter,
          amount,
          title,
          updatedAt: now,
          editedAt: now,
          editedByUid: uid,
          editCount: FieldValue.increment(1),
        });

        transaction.update(cardRef, {
          pendingBalanceImpact: FieldValue.increment(deltaAdjustment),
          updatedAt: now,
          ...summaryFields,
        });

        transaction.set(auditRef, {
          action: "entry.edited",
          actorUid: uid,
          entityType: "entry",
          entityId: entryId,
          createdAt: now,
          metadata: {
            amountBefore,
            amountAfter: amount,
            effectBefore,
            effectAfter,
            deltaBefore,
            deltaAfter,
            deltaAdjustment,
            titleChanged,
            intentChanged,
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
