import Link from "next/link";
import type { AccountCardSummary } from "@/types/card";
import { cardsCopy } from "@/lib/cards/cardsCopy";
import { dashboardCopy } from "@/lib/cards/dashboardCopy";
import {
  formatOfficialBalanceAmount,
  formatPendingBalanceDisplay,
} from "@/lib/cards/formatBalance";

type CardListItemProps = {
  card: AccountCardSummary;
  viewerUid: string;
  hasPending: boolean;
};

export function CardListItem({
  card,
  viewerUid,
  hasPending,
}: CardListItemProps) {
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
      aria-label={`${dashboardCopy.openCard}: ${card.title}`}
      className="group relative block overflow-hidden rounded-xl border border-[var(--color-glass-border)]/75 bg-[linear-gradient(160deg,rgba(24,26,34,0.92)_0%,rgba(12,14,20,0.98)_100%)] p-4 pe-4 ps-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_2px_12px_rgba(0,0,0,0.25)] transition-[border-color,box-shadow] hover:border-[var(--color-champagne)]/35 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_20px_rgba(201,184,150,0.07)] active:scale-[0.995]"
    >
      <span
        className="pointer-events-none absolute start-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[var(--color-champagne)]/55 via-[var(--color-champagne)]/15 to-transparent"
        aria-hidden
      />

      {hasPending ? (
        <span
          className="absolute end-3 top-3 h-2 w-2 rounded-full bg-[var(--color-amber-mist)] shadow-[0_0_10px_rgba(212,165,116,0.45)]"
          aria-hidden
        />
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-0.5 text-[10px] font-medium tracking-wide text-[var(--color-mist)]/55">
            כרטיס חשבון
          </p>
          <h3 className="truncate text-base font-medium text-[var(--color-pearl)] group-hover:text-[var(--color-champagne)]">
            {card.title}
          </h3>
        </div>
        <span
          className="mt-4 shrink-0 text-lg leading-none text-[var(--color-mist)]/40 transition-colors group-hover:text-[var(--color-champagne)]/70"
          aria-hidden
        >
          ←
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-[var(--color-glass-border)]/30 pt-3">
        <p className="text-sm text-[var(--color-mist)]">
          {cardsCopy.balanceInCard}{" "}
          <span className="tabular-nums font-medium text-[var(--color-champagne)]">
            {official}
          </span>
        </p>
        {hasPending ? (
          <p className="text-xs tabular-nums text-[var(--color-amber-mist)]">
            {cardsCopy.pendingApproval}: {pending.amount}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
