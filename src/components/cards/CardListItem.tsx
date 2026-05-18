import Link from "next/link";
import {
  canonicalDeltaFromEffect,
  formatSignedDelta,
  toViewerDelta,
} from "@/lib/balance/viewerDelta";
import { cardsCopy } from "@/lib/cards/cardsCopy";
import { dashboardCopy } from "@/lib/cards/dashboardCopy";
import {
  formatOfficialBalanceAmount,
  formatPendingBalanceDisplay,
} from "@/lib/cards/formatBalance";
import {
  formatEntryLedgerDate,
  getEntryDisplayDate,
} from "@/lib/ui/formatEntryLedgerDate";
import type { AccountCardSummary } from "@/types/card";

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

  const awaiting = card.pendingAwaitingMyApproval;
  const awaitingCount = awaiting.pendingAwaitingMyApprovalCount;
  const hasAwaitingApproval = awaitingCount > 0;
  const hasFinancialPending =
    toViewerDelta(
      card.pendingBalanceImpact,
      viewerUid,
      card.balancePerspectiveUid
    ) !== 0;

  const singleAwaiting = awaiting.pendingAwaitingMyApproval;
  const singleAwaitingDate = singleAwaiting
    ? getEntryDisplayDate(singleAwaiting)
    : null;
  const singleAwaitingDateLine = singleAwaitingDate
    ? formatEntryLedgerDate(singleAwaitingDate)
    : null;
  const singleAwaitingAmount = singleAwaiting
    ? formatSignedDelta(
        toViewerDelta(
          canonicalDeltaFromEffect(
            singleAwaiting.effectOnPerspectiveBalance,
            singleAwaiting.amount
          ),
          viewerUid,
          card.balancePerspectiveUid
        )
      )
    : null;

  return (
    <Link
      href={`/app/cards/${card.id}`}
      aria-label={`${dashboardCopy.openCard}: ${card.title}`}
      className={`vault-account-file group relative block overflow-hidden rounded-xl p-[18px] pe-4 ps-5 transition-[border-color,box-shadow,transform] active:scale-[0.995] ${
        hasAwaitingApproval ? "vault-account-file--attention" : ""
      }`}
    >
      <span
        className={`vault-file-spine pointer-events-none absolute start-0 top-0 bottom-0 w-[3px] ${
          hasAwaitingApproval ? "vault-file-spine--attention" : ""
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
              hasAwaitingApproval
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
          hasAwaitingApproval
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
        {hasFinancialPending ? (
          <p className="text-xs font-medium tabular-nums text-[var(--color-vault-gold-green)]">
            {cardsCopy.pendingApproval}: {pending.amount}
          </p>
        ) : null}
      </div>

      {awaitingCount >= 2 ? (
        <p className="mt-3 text-xs font-medium text-[var(--color-vault-gold-green)]">
          {dashboardCopy.pendingActionsReview}
        </p>
      ) : null}

      {awaitingCount === 1 && singleAwaiting ? (
        <p className="mt-3 text-xs leading-relaxed text-[var(--color-mist)]">
          <span className="text-[var(--color-pearl)]/90">{singleAwaiting.title}</span>
          {singleAwaitingAmount ? (
            <>
              <span className="text-[var(--color-champagne)]/30" aria-hidden>
                {" "}
                ·{" "}
              </span>
              <span className="tabular-nums font-medium text-[var(--color-champagne)]">
                {singleAwaitingAmount}
              </span>
            </>
          ) : null}
          {singleAwaitingDateLine ? (
            <>
              <span className="text-[var(--color-champagne)]/30" aria-hidden>
                {" "}
                ·{" "}
              </span>
              <span className="tabular-nums text-[var(--color-mist)]/80">
                {singleAwaitingDateLine}
              </span>
            </>
          ) : null}
        </p>
      ) : null}
    </Link>
  );
}
