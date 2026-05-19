import {FieldValue, Transaction} from "firebase-admin/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {db} from "../lib/admin";
import {WARMED_ENTRY_CALLABLE_OPTIONS} from "../lib/callableOptions";
import {assertCanAddEntryFromSnapshots} from "../lib/assertCanAddEntry";
import {requireAuthUid} from "../lib/auth";
import {createEntryResolvePerf} from "../lib/entryResolveCallablePerf";
import {
  balanceDelta,
  effectForType,
  parseEntryIntent,
  resolveTypeFromIntent,
} from "../lib/entryIntent";
import {
  buildDashboardPendingSummaryFields,
  loadDashboardPendingSummaryInputs,
} from "../lib/recomputeDashboardPendingSummary";
import {readEntryMutationBalances} from "../lib/entryMutationBalances";
import {parseCardId} from "../lib/validators";

export type CreateEntryInput = {
  cardId: string;
  intent: "to_receive" | "to_pay";
  amount: number;
  title: string;
};

export type CreateEntryOutput = {
  cardId: string;
  entryId: string;
  officialBalance: number;
  pendingBalanceImpact: number;
  updatedAt: string;
};

const TITLE_MIN = 1;
const TITLE_MAX = 200;
const AMOUNT_MAX = 999_999_999;

function parseAmount(raw: unknown): number {
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    throw new HttpsError("invalid-argument", "הסכום לא תקין");
  }
  if (raw <= 0) {
    throw new HttpsError("invalid-argument", "הסכום חייב להיות חיובי");
  }
  if (raw > AMOUNT_MAX) {
    throw new HttpsError("invalid-argument", "הסכום גדול מדי");
  }
  return raw;
}

function parseTitle(raw: unknown): string {
  if (typeof raw !== "string") {
    throw new HttpsError("invalid-argument", "פירוט קצר חייב להיות מחרוזת");
  }
  const title = raw.trim();
  if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
    throw new HttpsError("invalid-argument", "פירוט קצר לא תקין");
  }
  return title;
}

function rejectClientControlledFields(data: Record<string, unknown>): void {
  const forbidden = [
    "status",
    "createdByUid",
    "effectOnPerspectiveBalance",
    "officialBalance",
    "pendingBalanceImpact",
    "approvedByUid",
    "approvedAt",
    "rejectedByUid",
    "rejectedAt",
    "rejectionNote",
    "cancelledByUid",
    "cancelledAt",
    "entryDate",
    "createdAt",
    "note",
    "kind",
    "type",
  ];
  for (const key of forbidden) {
    if (key in data) {
      throw new HttpsError("invalid-argument", "שדות לא מורשים בבקשה");
    }
  }
}

/**
 * יוצר רשומה במצב pending ומעדכן pendingBalanceImpact בלבד.
 * intent נגזר מהמשתמש; type/effect מחושבים בשרת לפי balancePerspectiveUid.
 */
export const createEntry = onCall(
  WARMED_ENTRY_CALLABLE_OPTIONS,
  async (request): Promise<CreateEntryOutput> => {
    let perfCardId = "";
    let perf = createEntryResolvePerf("createEntry", "", "");

    try {
      const authStart = Date.now();
      perf = createEntryResolvePerf("createEntry", "", "");
      const uid = requireAuthUid(request);
      const payload = request.data;

      if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
        throw new HttpsError("invalid-argument", "נתוני הבקשה לא תקינים");
      }

      const data = payload as Record<string, unknown>;
      rejectClientControlledFields(data);

      const cardId = parseCardId(data.cardId);
      const intent = parseEntryIntent(data.intent);
      const amount = parseAmount(data.amount);
      const title = parseTitle(data.title);
      perfCardId = cardId;
      perf = createEntryResolvePerf("createEntry", cardId, "");
      perf.logStage("authValidation", Date.now() - authStart);

      const cardRef = db.collection("accountCards").doc(cardId);
      const entryRef = cardRef.collection("entries").doc();
      const entryId = entryRef.id;
      perf = createEntryResolvePerf("createEntry", cardId, entryId);
      const auditRef = cardRef.collection("auditEvents").doc();
      const now = FieldValue.serverTimestamp();

      const txStart = Date.now();
      await db.runTransaction(async (transaction: Transaction) => {
        const parallelReadsStart = Date.now();

        const cardReadStart = Date.now();
        const cardPromise = transaction.get(cardRef).then((cardSnap) => {
          perf.logStage("transaction.cardRead", Date.now() - cardReadStart);
          return cardSnap;
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

        const [cardSnap, summaryInputs] = await Promise.all([
          cardPromise,
          summaryInputsPromise,
        ]);
        perf.logStage("transaction.readsParallel", Date.now() - parallelReadsStart);

        const validationStart = Date.now();
        assertCanAddEntryFromSnapshots({
          cardExists: cardSnap.exists,
          card: cardSnap.data(),
          uid,
          activeParticipants: summaryInputs.activeParticipants,
        });
        perf.logStage("transaction.addEntryValidation", Date.now() - validationStart);

        const card = cardSnap.data();
        const balancePerspectiveUid =
          typeof card?.balancePerspectiveUid === "string" ?
            card.balancePerspectiveUid :
            null;
        if (!balancePerspectiveUid) {
          throw new HttpsError("failed-precondition", "כרטיס לא תקין");
        }

        const type = resolveTypeFromIntent(intent, uid, balancePerspectiveUid);
        const effectOnPerspectiveBalance = effectForType(type);
        const delta = balanceDelta(effectOnPerspectiveBalance, amount);

        const currentPending =
          typeof card?.pendingBalanceImpact === "number" ?
            card.pendingBalanceImpact :
            0;

        const pendingEntriesAfterCreate = [
          ...summaryInputs.pendingEntries,
          {
            id: entryId,
            status: "pending",
            title,
            amount,
            effectOnPerspectiveBalance,
            entryDate: now,
            createdAt: now,
            createdByUid: uid,
          },
        ];

        const summaryBuildStart = Date.now();
        const summaryFields = buildDashboardPendingSummaryFields(
          pendingEntriesAfterCreate,
          summaryInputs.activeParticipants,
          now
        );
        perf.logStage("transaction.summaryBuild", Date.now() - summaryBuildStart);

        const writesStart = Date.now();
        transaction.set(entryRef, {
          type,
          amount,
          effectOnPerspectiveBalance,
          title,
          entryDate: now,
          status: "pending",
          createdByUid: uid,
          createdAt: now,
          approvedByUid: null,
          approvedAt: null,
          rejectedByUid: null,
          rejectedAt: null,
          rejectionNote: null,
          cancelledByUid: null,
          cancelledAt: null,
        });

        transaction.update(cardRef, {
          pendingBalanceImpact: currentPending + delta,
          updatedAt: now,
          ...summaryFields,
        });

        transaction.set(auditRef, {
          action: "entry.created",
          actorUid: uid,
          entityType: "entry",
          entityId: entryId,
          createdAt: now,
          metadata: {
            intent,
            type,
            effectOnPerspectiveBalance,
            amount,
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
      if (perfCardId) {
        perf.logTotal(false);
      }
      throw err;
    }
  }
);
