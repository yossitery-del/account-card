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
      className={`vault-account-file group relative block overflow-hidden rounded-xl p-[18px] pe-4 ps-5 transition-[border-color,box-shadow,transform] active:scale-[0.995] ${
        hasPending ? "vault-account-file--attention" : ""
      }`}
    >
      <span
        className={`vault-file-spine pointer-events-none absolute start-0 top-0 bottom-0 w-[3px] ${
          hasPending ? "vault-file-spine--attention" : ""
        }`}
        aria-hidden
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 text-[10px] font-medium tracking-wide text-[var(--color-mist)]">
            כרטיס חשבון
          </p>
          <h3
            className={`truncate text-lg font-semibold leading-snug transition-colors group-hover:text-[var(--color-champagne-hover)] ${
              hasPending
                ? "text-[var(--color-pearl)]"
                : "text-[var(--color-pearl)]/93"
            }`}
          >
            {card.title}
          </h3>
        </div>
        <span
          className="vault-open-affordance mt-1 shrink-0 rounded-md px-2.5 py-1.5 text-[11px] font-medium leading-none transition-colors"
          aria-hidden
        >
          פתיחה
        </span>
      </div>

      <div
        className={`mt-4 flex flex-col gap-2 border-t pt-3.5 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-4 sm:gap-y-1 ${
          hasPending
            ? "border-[var(--color-champagne)]/22"
            : "border-[var(--color-glass-border)]/28"
        }`}
      >
        <p className="text-xs leading-relaxed text-[var(--color-mist)]">
          {cardsCopy.balanceInCard}{" "}
          <span className="text-base font-medium tabular-nums text-[var(--color-champagne)]">
            {official}
          </span>
        </p>
        {hasPending ? (
          <p className="text-xs font-medium tabular-nums text-[var(--color-vault-gold-green)]">
            {cardsCopy.pendingApproval}: {pending.amount}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
