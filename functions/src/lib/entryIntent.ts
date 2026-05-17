import {HttpsError} from "firebase-functions/v2/https";

export type EntryIntent = "to_receive" | "to_pay";
export type EntryType = "charge" | "credit";
export type EntryEffect = "increase" | "decrease";

const EFFECT_BY_TYPE: Record<EntryType, EntryEffect> = {
  charge: "increase",
  credit: "decrease",
};

export function parseEntryIntent(raw: unknown): EntryIntent {
  if (raw !== "to_receive" && raw !== "to_pay") {
    throw new HttpsError("invalid-argument", "סוג הפעולה לא תקין");
  }
  return raw;
}

/** ממפה intent של היוצר ל-type יחסית ל-balancePerspectiveUid של הכרטיס. */
export function resolveTypeFromIntent(
  intent: EntryIntent,
  actorUid: string,
  balancePerspectiveUid: string
): EntryType {
  const isPerspective = actorUid === balancePerspectiveUid;
  if (intent === "to_receive") {
    return isPerspective ? "charge" : "credit";
  }
  return isPerspective ? "credit" : "charge";
}

export function effectForType(type: EntryType): EntryEffect {
  return EFFECT_BY_TYPE[type];
}

export function balanceDelta(effect: EntryEffect, amount: number): number {
  return effect === "increase" ? amount : -amount;
}

export {intentFromTypeForActor} from "./intentFromTypeForActor";
