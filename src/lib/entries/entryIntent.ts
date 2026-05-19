import {
  canonicalDeltaFromEffect,
  formatSignedDelta,
  toViewerDelta,
} from "@/lib/balance/viewerDelta";
import type { EntryEffect, EntryType } from "@/types/entry";
import { entriesCopy } from "./entriesCopy";

export type EntryIntent = "to_receive" | "to_pay";

/** ממפה intent של היוצר ל-type יחסית ל-balancePerspectiveUid (תצוגה/בדיקות). */
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

/** intent של יוצר הרשומה — משתמש ב-intent שמור או מסיק מ-type (רשומות ישנות). */
export function getCreatorIntent(
  entry: {
    type: EntryType;
    createdByUid: string;
    intent?: EntryIntent | null;
  },
  balancePerspectiveUid: string
): EntryIntent {
  if (entry.intent === "to_receive" || entry.intent === "to_pay") {
    return entry.intent;
  }
  return intentFromTypeForActor(
    entry.type,
    entry.createdByUid,
    balancePerspectiveUid
  );
}

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

/** @deprecated — השתמשו ב-formatSignedDelta מ-viewerDelta */
export function formatSignedAmount(
  effect: "increase" | "decrease",
  amount: number
): string {
  return formatSignedDelta(canonicalDeltaFromEffect(effect, amount));
}

export function formatEntryForViewer(
  entry: {
    type: EntryType;
    intent?: EntryIntent | null;
    amount: number;
    effectOnPerspectiveBalance: EntryEffect;
    createdByUid: string;
  },
  viewerUid: string,
  balancePerspectiveUid: string,
  otherName?: string
): { intentLabel: string; amountLine: string } {
  const creatorIntent = getCreatorIntent(entry, balancePerspectiveUid);
  const viewerIntent: EntryIntent =
    entry.createdByUid === viewerUid
      ? creatorIntent
      : creatorIntent === "to_receive"
        ? "to_pay"
        : "to_receive";

  const intentLabel =
    viewerIntent === "to_receive"
      ? entriesCopy.receiveLabel(otherName)
      : entriesCopy.payLabel(otherName);

  const canonicalDelta = canonicalDeltaFromEffect(
    entry.effectOnPerspectiveBalance,
    entry.amount
  );
  const viewerDelta = toViewerDelta(
    canonicalDelta,
    viewerUid,
    balancePerspectiveUid
  );

  return {
    intentLabel,
    amountLine: formatSignedDelta(viewerDelta),
  };
}
