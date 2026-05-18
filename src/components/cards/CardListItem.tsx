"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  canonicalDeltaFromEffect,
  formatSignedDelta,
  toViewerDelta,
} from "@/lib/balance/viewerDelta";
import { cardsCopy } from "@/lib/cards/cardsCopy";
import { dashboardCopy } from "@/lib/cards/dashboardCopy";
import { getDashboardQuickActionTarget } from "@/lib/cards/dashboardQuickActions";
import {
  formatOfficialBalanceAmount,
  formatPendingBalanceDisplay,
} from "@/lib/cards/formatBalance";
import { approveEntry } from "@/lib/entries/approveEntry";
import { entriesCopy } from "@/lib/entries/entriesCopy";
import { rejectEntry } from "@/lib/entries/rejectEntry";
import {
  formatEntryLedgerDate,
  getEntryDisplayDate,
} from "@/lib/ui/formatEntryLedgerDate";
import type { AccountCardSummary } from "@/types/card";

type CardListItemProps = {
  card: AccountCardSummary;
  viewerUid: string;
  onCardsRefresh: () => Promise<void>;
};

type QuickActionKind = "approve" | "reject";

export function CardListItem({
  card,
  viewerUid,
  onCardsRefresh,
}: CardListItemProps) {
  const { user } = useAuth();
  const [busyKind, setBusyKind] = useState<QuickActionKind | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
  const quickActionTarget = getDashboardQuickActionTarget(awaiting);
  const showQuickActions = quickActionTarget !== null;
  const isBusy = busyKind !== null;

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

  const runQuickAction = useCallback(
    async (kind: QuickActionKind) => {
      if (!user || !quickActionTarget || isBusy) {
        return;
      }

      setBusyKind(kind);
      setActionError(null);

      try {
        if (kind === "approve") {
          await approveEntry(user, card.id, quickActionTarget.entryId);
        } else {
          await rejectEntry(user, card.id, quickActionTarget.entryId);
        }
        await onCardsRefresh();
      } catch (err) {
        setActionError(
          err instanceof Error
            ? err.message
            : kind === "approve"
              ? "לא הצלחנו לאשר את הרשומה. נסה שוב."
              : "לא הצלחנו לדחות את הרשומה. נסה שוב."
        );
      } finally {
        setBusyKind(null);
      }
    },
    [user, quickActionTarget, isBusy, card.id, onCardsRefresh]
  );

  return (
    <article
      className={`vault-account-file group relative overflow-hidden rounded-xl transition-[border-color,box-shadow,transform] ${
        hasAwaitingApproval ? "vault-account-file--attention" : ""
      } ${isBusy ? "opacity-90" : ""}`}
    >
      <span
        className={`vault-file-spine pointer-events-none absolute start-0 top-0 bottom-0 w-[3px] ${
          hasAwaitingApproval ? "vault-file-spine--attention" : ""
        }`}
        aria-hidden
      />

      <Link
        href={`/app/cards/${card.id}`}
        aria-label={`${dashboardCopy.openCard}: ${card.title}`}
        className="block p-[18px] pe-4 ps-5 transition-[transform] active:scale-[0.995]"
      >
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

      {showQuickActions ? (
        <div
          className="border-t border-[var(--color-champagne)]/18 px-5 pb-4 pt-3"
          role="group"
          aria-label={dashboardCopy.quickActionsLabel}
          onClick={(e) => e.stopPropagation()}
        >
          {actionError ? (
            <p
              className="mb-2.5 text-xs leading-relaxed text-[var(--color-muted-rose)]"
              role="alert"
            >
              {actionError}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => void runQuickAction("approve")}
              className="inline-flex min-h-10 min-w-[4.25rem] items-center justify-center rounded-lg border border-[var(--color-champagne)]/35 bg-[var(--color-champagne)]/12 px-3.5 py-2 text-sm font-medium text-[var(--color-champagne)] transition hover:bg-[var(--color-champagne)]/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busyKind === "approve" ? entriesCopy.approving : entriesCopy.approve}
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => void runQuickAction("reject")}
              className="inline-flex min-h-10 min-w-[4.25rem] items-center justify-center rounded-lg border border-[var(--color-vault-border-metallic)] bg-transparent px-3.5 py-2 text-sm font-medium text-[var(--color-mist)] transition hover:border-[var(--color-mist)]/40 hover:text-[var(--color-pearl)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busyKind === "reject" ? entriesCopy.rejecting : entriesCopy.reject}
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
