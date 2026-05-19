"use client";

import { forwardRef } from "react";
import { entriesCopy } from "@/lib/entries/entriesCopy";
import { loadingLabels } from "@/lib/ui/loadingLabels";
import type { AccountCardEntryWithId } from "@/types/entry";
import { EntryListItem } from "./EntryListItem";

type EntryListProps = {
  entries: AccountCardEntryWithId[];
  currentUid: string;
  balancePerspectiveUid: string;
  participantNames: Map<string, string>;
  loading?: boolean;
  refreshing?: boolean;
  error?: string | null;
  highlightPending?: boolean;
  actingEntryId?: string | null;
  actingKind?: "approve" | "reject" | "cancel" | null;
  onApprove?: (entryId: string) => void;
  onReject?: (entryId: string) => void;
  onEdit?: (entryId: string) => void;
  onCancel?: (entryId: string) => void;
};

export const EntryList = forwardRef<HTMLElement, EntryListProps>(function EntryList(
  {
    entries,
    currentUid,
    balancePerspectiveUid,
    participantNames,
    loading = false,
    refreshing = false,
    error = null,
    highlightPending = false,
    actingEntryId = null,
    actingKind = null,
    onApprove,
    onReject,
    onEdit,
    onCancel,
  },
  ref
) {
  return (
    <section
      ref={ref}
      id="card-entries-section"
      className={`mt-8 scroll-mt-6 transition-[box-shadow] duration-700 ${
        highlightPending
          ? "rounded-lg ring-1 ring-[var(--color-champagne)]/20 ring-offset-2 ring-offset-[var(--color-vault-black)]"
          : ""
      }`}
    >
      <div className="mb-4 flex items-baseline justify-between gap-2 border-b border-[var(--color-glass-border)]/40 pb-2">
        <h3 className="text-base font-medium text-[var(--color-pearl)]">
          {entriesCopy.listTitle}
        </h3>
        {refreshing ? (
          <span className="text-[10px] text-[var(--color-mist)]">
            {loadingLabels.updating}
          </span>
        ) : null}
      </div>

      {error ? (
        <p
          className="py-8 text-center text-sm text-[var(--color-muted-rose)]"
          role="alert"
        >
          {error}
        </p>
      ) : loading ? (
        <EntryListSkeleton />
      ) : entries.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-[var(--color-pearl)]">{entriesCopy.emptyTitle}</p>
          <p className="mt-2 text-xs leading-relaxed text-[var(--color-mist)]">
            {entriesCopy.emptyBody}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--color-glass-border)]/40">
          {entries.map((entry) => (
            <li key={entry.id}>
              <EntryListItem
                entry={entry}
                currentUid={currentUid}
                balancePerspectiveUid={balancePerspectiveUid}
                creatorDisplayName={
                  participantNames.get(entry.createdByUid) ?? "משתתף"
                }
                actingEntryId={actingEntryId}
                actingKind={actingKind}
                onApprove={onApprove}
                onReject={onReject}
                onEdit={onEdit}
                onCancel={onCancel}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
});

function EntryListSkeleton() {
  return (
    <div className="space-y-3 py-2" role="status" aria-label={loadingLabels.entries}>
      <span className="sr-only">{loadingLabels.entries}</span>
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-[var(--color-glass-border)]/35 p-4"
        >
          <div className="h-4 w-2/3 rounded-full bg-[var(--color-pearl)]/10" />
          <div className="mt-3 h-3 w-5/6 rounded-full bg-[var(--color-mist)]/10" />
          <div className="mt-3 h-3 w-1/3 rounded-full bg-[var(--color-champagne)]/10" />
        </div>
      ))}
    </div>
  );
}
