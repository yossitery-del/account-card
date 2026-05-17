"use client";

import { entriesCopy } from "@/lib/entries/entriesCopy";
import { formatEntryForViewer } from "@/lib/entries/entryIntent";
import type { AccountCardEntryWithId } from "@/types/entry";

type EntryListItemProps = {
  entry: AccountCardEntryWithId;
  currentUid: string;
  balancePerspectiveUid: string;
  creatorDisplayName: string;
  actingEntryId: string | null;
  actingKind: "approve" | "reject" | "cancel" | null;
  onApprove?: (entryId: string) => void;
  onReject?: (entryId: string) => void;
  onEdit?: (entryId: string) => void;
  onCancel?: (entryId: string) => void;
};

export function EntryListItem({
  entry,
  currentUid,
  balancePerspectiveUid,
  creatorDisplayName,
  actingEntryId,
  actingKind,
  onApprove,
  onReject,
  onEdit,
  onCancel,
}: EntryListItemProps) {
  const isOwn = entry.createdByUid === currentUid;
  const isPending = entry.status === "pending";
  const isApproved = entry.status === "approved";
  const isRejected = entry.status === "rejected";
  const isCancelled = entry.status === "cancelled";
  const needsYourAttention = isPending && !isOwn;
  const canEditOwn = isPending && isOwn;
  const isActing = actingEntryId === entry.id;
  const actionsDisabled = actingEntryId !== null;

  const { intentLabel, amountLine } = formatEntryForViewer(
    entry,
    currentUid,
    balancePerspectiveUid
  );

  const attribution = isOwn
    ? entriesCopy.addedByYou
    : entriesCopy.addedByOther(creatorDisplayName);

  const statusChip = isApproved
    ? entriesCopy.approvedChip
    : isRejected
      ? entriesCopy.rejectedChip
      : isCancelled
        ? entriesCopy.cancelledChip
        : isPending
          ? entriesCopy.pendingChip
          : null;

  const statusChipClass = isApproved
    ? "border-[var(--color-champagne)]/25 bg-[var(--color-champagne)]/10 text-[var(--color-champagne)]/95"
    : isRejected
      ? "border-[var(--color-glass-border)]/50 bg-transparent text-[var(--color-mist)]"
      : isCancelled
        ? "border-[var(--color-glass-border)]/45 bg-transparent text-[var(--color-mist)]"
        : "border-[var(--color-amber-mist)]/30 bg-[var(--color-amber-mist)]/8 text-[var(--color-champagne)]/90";

  return (
    <article className="py-3.5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h4 className="text-[15px] font-medium leading-snug text-[var(--color-pearl)]">
            {entry.title}
          </h4>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs leading-relaxed text-[var(--color-mist)]">
            <span>{intentLabel}</span>
            <span className="text-[var(--color-mist)]/50" aria-hidden>
              ·
            </span>
            <span>{attribution}</span>
            {canEditOwn ? (
              <>
                <span className="text-[var(--color-mist)]/50" aria-hidden>
                  ·
                </span>
                <span>{entriesCopy.pendingOtherSide}</span>
              </>
            ) : null}
            {needsYourAttention ? (
              <>
                <span className="text-[var(--color-mist)]/50" aria-hidden>
                  ·
                </span>
                <span className="text-[var(--color-champagne)]/85">
                  {entriesCopy.pendingYourApproval}
                </span>
              </>
            ) : null}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <p
            className="text-lg font-semibold leading-none tabular-nums text-[var(--color-champagne)]"
            dir="ltr"
          >
            {amountLine}
          </p>
          {statusChip ? (
            <span
              className={`rounded border px-1.5 py-px text-[10px] ${statusChipClass}`}
            >
              {statusChip}
            </span>
          ) : null}
        </div>
      </div>

      {needsYourAttention && onApprove && onReject ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={() => onApprove(entry.id)}
            className="rounded-lg border border-[var(--color-champagne)]/35 bg-[var(--color-champagne)]/12 px-3 py-1.5 text-xs font-medium text-[var(--color-champagne)] transition hover:bg-[var(--color-champagne)]/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isActing && actingKind === "approve"
              ? entriesCopy.approving
              : entriesCopy.approve}
          </button>
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={() => onReject(entry.id)}
            className="rounded-lg border border-[var(--color-glass-border)]/60 bg-transparent px-3 py-1.5 text-xs font-medium text-[var(--color-mist)] transition hover:border-[var(--color-mist)]/40 hover:text-[var(--color-pearl)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isActing && actingKind === "reject"
              ? entriesCopy.rejecting
              : entriesCopy.reject}
          </button>
        </div>
      ) : null}

      {canEditOwn && (onEdit || onCancel) ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {onEdit ? (
            <button
              type="button"
              disabled={actionsDisabled}
              onClick={() => onEdit(entry.id)}
              className="rounded-lg border border-[var(--color-champagne)]/35 bg-[var(--color-champagne)]/12 px-3 py-1.5 text-xs font-medium text-[var(--color-champagne)] transition hover:bg-[var(--color-champagne)]/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {entriesCopy.edit}
            </button>
          ) : null}
          {onCancel ? (
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={() => onCancel(entry.id)}
            className="rounded-lg border border-[var(--color-glass-border)]/60 bg-transparent px-3 py-1.5 text-xs font-medium text-[var(--color-mist)] transition hover:border-[var(--color-mist)]/40 hover:text-[var(--color-pearl)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isActing && actingKind === "cancel"
              ? entriesCopy.cancelling
              : entriesCopy.cancel}
          </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
