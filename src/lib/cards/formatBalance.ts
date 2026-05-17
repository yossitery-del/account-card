import {
  formatSignedDelta,
  toViewerDelta,
} from "@/lib/balance/viewerDelta";

/** תצוגת יתרה רשמית — מספר תמיד; סימן לפי viewer. */
export function formatOfficialBalanceAmount(
  officialBalance: number,
  viewerUid: string,
  balancePerspectiveUid: string
): string {
  const viewerBalance = toViewerDelta(
    officialBalance,
    viewerUid,
    balancePerspectiveUid
  );
  const sign = viewerBalance < 0 ? "-" : "";
  return `${sign}₪${Math.abs(viewerBalance).toLocaleString("he-IL")}`;
}

/** טקסט משני — רק «מאוזן» כשהיתרה אצל הצופה 0 */
export function formatOfficialBalanceHint(
  officialBalance: number,
  viewerUid: string,
  balancePerspectiveUid: string
): string | null {
  const viewerBalance = toViewerDelta(
    officialBalance,
    viewerUid,
    balancePerspectiveUid
  );
  if (viewerBalance === 0) {
    return "מאוזן";
  }
  return null;
}

/** @deprecated */
export function formatOfficialBalanceLabel(
  officialBalance: number,
  viewerUid: string,
  balancePerspectiveUid: string
): string {
  return formatOfficialBalanceAmount(
    officialBalance,
    viewerUid,
    balancePerspectiveUid
  );
}

export type PendingBalanceDisplay = {
  amount: string;
  hint: string | null;
};

/** pendingBalanceImpact — קנוני ב-Firestore; תצוגה לפי viewer. */
export function formatPendingBalanceDisplay(
  pendingBalanceImpact: number,
  viewerUid: string,
  balancePerspectiveUid: string
): PendingBalanceDisplay {
  const viewerPending = toViewerDelta(
    pendingBalanceImpact,
    viewerUid,
    balancePerspectiveUid
  );
  if (viewerPending === 0) {
    return { amount: "₪0", hint: "אין ממתין לאישור" };
  }
  return { amount: formatSignedDelta(viewerPending), hint: null };
}

/** @deprecated */
export function formatPendingBalance(
  pendingBalanceImpact: number,
  viewerUid: string,
  balancePerspectiveUid: string
): string {
  return formatPendingBalanceDisplay(
    pendingBalanceImpact,
    viewerUid,
    balancePerspectiveUid
  ).amount;
}
