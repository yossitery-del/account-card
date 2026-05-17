import Link from "next/link";
import type { AccountCardSummary } from "@/types/card";
import { cardsCopy } from "@/lib/cards/cardsCopy";
import {
  formatOfficialBalanceAmount,
  formatPendingBalanceDisplay,
} from "@/lib/cards/formatBalance";

type CardListItemProps = {
  card: AccountCardSummary;
  viewerUid: string;
};

export function CardListItem({ card, viewerUid }: CardListItemProps) {
  const official = formatOfficialBalanceAmount(
    card.officialBalance,
    viewerUid,
    card.balancePerspectiveUid
  );
  const pending = formatPendingBalanceDisplay(
    card.pendingBalanceImpact,
    viewerUid,
    card.balancePerspectiveUid
  );

  return (
    <Link
      href={`/app/cards/${card.id}`}
      className="glass-card block rounded-2xl p-5 transition-colors hover:border-[var(--color-champagne)]"
    >
      <h2 className="mb-2 text-lg font-medium text-[var(--color-pearl)]">
        {card.title}
      </h2>
      <p className="text-sm text-[var(--color-mist)]">
        {cardsCopy.balanceInCard}:{" "}
        <span className="tabular-nums text-[var(--color-champagne)]">
          {official}
        </span>
      </p>
      {card.pendingBalanceImpact !== 0 ? (
        <p className="mt-1 text-xs tabular-nums text-[var(--color-amber-mist)]">
          {cardsCopy.pendingApproval}: {pending.amount}
        </p>
      ) : null}
    </Link>
  );
}
