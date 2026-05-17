import {Timestamp} from "firebase-admin/firestore";
import {HttpsError} from "firebase-functions/v2/https";
import {db} from "./admin";

export type EntryMutationBalances = {
  cardId: string;
  entryId: string;
  officialBalance: number;
  pendingBalanceImpact: number;
  updatedAt: string;
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

/** יתרות מהכרטיס אחרי commit — מקור אמת בשרת. */
export async function readEntryMutationBalances(
  cardId: string,
  entryId: string
): Promise<EntryMutationBalances> {
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

  return {
    cardId,
    entryId,
    officialBalance,
    pendingBalanceImpact,
    updatedAt: serializeUpdatedAt(data?.updatedAt),
  };
}
