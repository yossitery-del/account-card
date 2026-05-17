import type { CardPageContext } from "@/lib/cards/getCardPageContext";

export type CardBalancePatch = {
  officialBalance: number;
  pendingBalanceImpact: number;
  updatedAt?: unknown;
};

export function hasCardBalancePatch(
  data: Partial<CardBalancePatch>
): data is CardBalancePatch {
  return (
    typeof data.officialBalance === "number" &&
    typeof data.pendingBalanceImpact === "number"
  );
}

/** מעדכן יתרות ב-context בלבד — ללא participants / count / permissions. */
export function patchCardBalances(
  context: CardPageContext,
  patch: CardBalancePatch
): CardPageContext {
  return {
    ...context,
    card: {
      ...context.card,
      officialBalance: patch.officialBalance,
      pendingBalanceImpact: patch.pendingBalanceImpact,
      ...(patch.updatedAt !== undefined
        ? { updatedAt: patch.updatedAt }
        : {}),
    },
  };
}
