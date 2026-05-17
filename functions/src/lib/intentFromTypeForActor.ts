import type {EntryIntent, EntryType} from "./entryIntent";

/** מסיק intent של היוצר מ-type שמור (רשומות ישנות בלי שדה intent). */
export function intentFromTypeForActor(
  type: EntryType,
  actorUid: string,
  balancePerspectiveUid: string
): EntryIntent {
  const isPerspective = actorUid === balancePerspectiveUid;
  if (type === "charge") {
    return isPerspective ? "to_receive" : "to_pay";
  }
  return isPerspective ? "to_pay" : "to_receive";
}
