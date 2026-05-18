import {Timestamp} from "firebase-admin/firestore";
import {HttpsError} from "firebase-functions/v2/https";
import {db} from "./admin";
import {
  viewerPendingSummaryForUid,
  type ViewerPendingAwaitingMyApprovalResponse,
} from "./viewerPendingSummaryResponse";

export type EntryMutationBalances = {
  cardId: string;
  entryId: string;
  officialBalance: number;
  pendingBalanceImpact: number;
  updatedAt: string;
};

export type EntryMutationResult = EntryMutationBalances & {
  pendingAwaitingMyApproval?: ViewerPendingAwaitingMyApprovalResponse;
};

function serializeUpdatedAt(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as {toDate: () => Date}).toDate === "function"
  ) {
    return (value as {toDate: () => Date}).toDate().toISOString();
  }
  return new Date().toISOString();
}

type ReadEntryMutationOptions = {
  viewerUid?: string;
};

/** יתרות (+ סיכום ממתין לצופה) מהכרטיס אחרי commit. */
export async function readEntryMutationResult(
  cardId: string,
  entryId: string,
  options?: ReadEntryMutationOptions
): Promise<EntryMutationResult> {
  const cardSnap = await db.collection("accountCards").doc(cardId).get();
  if (!cardSnap.exists) {
    throw new HttpsError("not-found", "הכרטיס לא נמצא");
  }

  const data = cardSnap.data();
  const officialBalance =
    typeof data?.officialBalance === "number" ? data.officialBalance : 0;
  const pendingBalanceImpact =
    typeof data?.pendingBalanceImpact === "number" ?
      data.pendingBalanceImpact :
      0;

  const result: EntryMutationResult = {
    cardId,
    entryId,
    officialBalance,
    pendingBalanceImpact,
    updatedAt: serializeUpdatedAt(data?.updatedAt),
  };

  if (options?.viewerUid) {
    result.pendingAwaitingMyApproval = viewerPendingSummaryForUid(
      data?.dashboardPendingSummaryByUid,
      options.viewerUid
    );
  }

  return result;
}

/** יתרות מהכרטיס אחרי commit — מקור אמת בשרת. */
export async function readEntryMutationBalances(
  cardId: string,
  entryId: string
): Promise<EntryMutationBalances> {
  return readEntryMutationResult(cardId, entryId);
}
