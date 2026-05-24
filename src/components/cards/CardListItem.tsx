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
import { formatOfficialBalanceAmount } from "@/lib/cards/formatBalance";
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
  onCardRefresh: (
    cardId: string,
    mutation?: Awaited<ReturnType<typeof approveEntry>>
  ) => Promise<void>;
};

type QuickActionKind = "approve" | "reject";

export function CardListItem({
  card,
  viewerUid,
  onCardRefresh,
}: CardListItemProps) {
  const { user } = useAuth();
  const [busyKind, setBusyKind] = useState<QuickActionKind | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const official = formatOfficialBalanceAmount(
    card.officialBalance,
    viewerUid,
    card.balancePerspectiveUid
  );

  const awaiting = card.pendingAwaitingMyApproval;
  const awaitingCount = awaiting.pendingAwaitingMyApprovalCount;
  const hasAwaitingApproval = awaitingCount > 0;

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
  const singleAwaitingTitle = singleAwaiting?.title.trim() || null;

  const runQuickAction = useCallback(
    async (kind: QuickActionKind) => {
      if (!user || !quickActionTarget || isBusy) {
        return;
      }

      setBusyKind(kind);
      setActionError(null);

      try {
        const mutation =
          kind === "approve"
            ? await approveEntry(user, card.id, quickActionTarget.entryId)
            : await rejectEntry(user, card.id, quickActionTarget.entryId);
        await onCardRefresh(card.id, mutation);
      } catch (err) {
        setActionError(
          err instanceof Error
            ? err.message
            : kind === "approve"
              ? "לא הצלחנו לאשר את הפעולה. נסה שוב."
              : "לא הצלחנו לדחות את הפעולה. נסה שוב."
        );
      } finally {
        setBusyKind(null);
      }
    },
    [user, quickActionTarget, isBusy, card.id, onCardRefresh]
  );

  return (
    <article
      className={`vault-account-file group relative overflow-hidden rounded-xl transition-[border-color,box-shadow,transform] ${
        isBusy ? "opacity-90" : ""
      }`}
    >
      <span
        className="vault-file-spine pointer-events-none absolute start-0 top-0 bottom-0 w-[3px]"
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
              className={`overflow-hidden text-lg font-semibold leading-snug transition-colors [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] group-hover:text-[var(--color-champagne-hover)] ${
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

        <div className="mt-4 border-t border-[var(--color-glass-border)]/28 pt-3.5">
          <p className="text-[11px] font-medium tracking-wide text-[var(--color-mist)]">
            {cardsCopy.balanceInCard}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--color-champagne)]">
            {official}
          </p>
        </div>

        {hasAwaitingApproval ? (
          <div className="mt-4 rounded-xl border border-[var(--color-champagne)]/16 bg-[rgba(201,184,150,0.055)] px-4 py-3">
            {awaitingCount === 1 && singleAwaiting ? (
              <>
                <p className="text-sm font-medium text-[var(--color-pearl)]">
                  {cardsCopy.pendingYourApproval}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-relaxed text-[var(--color-mist)]">
                  {singleAwaitingAmount ? (
                    <span className="tabular-nums font-medium text-[var(--color-champagne)]">
                      {singleAwaitingAmount}
                    </span>
                  ) : null}
                  {singleAwaitingDateLine ? (
                    <span className="tabular-nums text-[var(--color-mist)]/80">
                      {singleAwaitingDateLine}
                    </span>
                  ) : null}
                </p>
                {singleAwaitingTitle ? (
                  <p className="mt-2 overflow-hidden text-xs leading-relaxed text-[var(--color-mist)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:1]">
                    {singleAwaitingTitle}
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-[var(--color-pearl)]">
                  {cardsCopy.pendingAwaitingCount(awaitingCount)}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-mist)]">
                  {cardsCopy.openToReviewPending}
                </p>
              </>
            )}
          </div>
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
          <p className="mb-2.5 text-xs leading-relaxed text-[var(--color-mist)]/78">
            האישור מעדכן את החשבון ביניכם בלבד — ללא העברת תשלום.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => void runQuickAction("approve")}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--color-champagne)]/30 bg-[rgba(201,184,150,0.08)] px-3.5 py-2 text-sm font-medium text-[var(--color-champagne)] transition hover:bg-[rgba(201,184,150,0.13)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busyKind === "approve" ? entriesCopy.approving : entriesCopy.approve}
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => void runQuickAction("reject")}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--color-vault-border-metallic)] bg-transparent px-3.5 py-2 text-sm font-medium text-[var(--color-mist)] transition hover:border-[var(--color-mist)]/40 hover:bg-[rgba(194,176,146,0.045)] hover:text-[var(--color-pearl)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busyKind === "reject" ? entriesCopy.rejecting : entriesCopy.reject}
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
