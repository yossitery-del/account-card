"use client";

import { forwardRef } from "react";
import { PremiumLoader } from "@/components/ui/PremiumLoader";
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

      {loading ? (
        <div className="flex justify-center py-10">
          <PremiumLoader label={loadingLabels.entries} />
        </div>
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
