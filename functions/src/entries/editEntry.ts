import {FieldValue, Transaction} from "firebase-admin/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {type EntryData} from "../lib/assertCanApproveEntry";
import {
  assertCanEditEntryFromSnapshots,
} from "../lib/assertCanEditEntry";
import {db} from "../lib/admin";
import {requireAuthUid} from "../lib/auth";
import {WARMED_ENTRY_CALLABLE_OPTIONS} from "../lib/callableOptions";
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
  WARMED_ENTRY_CALLABLE_OPTIONS,
  async (request): Promise<EditEntryOutput> => {
    const uid = requireAuthUid(request);
    const {cardId, entryId, intent, amount, title} = parseEditEntryPayload(
      request.data
    );

    const cardRef = db.collection("accountCards").doc(cardId);
    const entryRef = cardRef.collection("entries").doc(entryId);
    const auditRef = cardRef.collection("auditEvents").doc();
    const now = FieldValue.serverTimestamp();

    await db.runTransaction(async (transaction: Transaction) => {
      const [cardEntryPair, summaryInputs] = await Promise.all([
        Promise.all([
          transaction.get(cardRef),
          transaction.get(entryRef),
        ]),
        loadDashboardPendingSummaryInputs(
          transaction,
          cardRef
        ),
      ]);
      const [cardSnap, entrySnap] = cardEntryPair;

      const entry = entrySnap.data() ?? {};
      assertCanEditEntryFromSnapshots({
        cardExists: cardSnap.exists,
        card: cardSnap.data(),
        entryExists: entrySnap.exists,
        entry,
        uid,
        activeParticipants: summaryInputs.activeParticipants,
      });

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

      const summaryFields = buildDashboardPendingSummaryFields(
        pendingEntriesAfterEdit,
        summaryInputs.activeParticipants,
        now
      );

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
    });

    return readEntryMutationBalances(cardId, entryId);
  }
);
