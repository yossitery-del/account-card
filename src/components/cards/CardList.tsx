"use client";

import { useMemo, useState } from "react";
import {
  cardHasPendingApproval,
  filterDashboardCards,
  type CardListFilter,
} from "@/lib/cards/filterDashboardCards";
import { dashboardCopy } from "@/lib/cards/dashboardCopy";
import type { AccountCardSummary } from "@/types/card";
import { CardListItem } from "./CardListItem";

type CardListProps = {
  cards: AccountCardSummary[];
  viewerUid: string;
};

export function CardList({ cards, viewerUid }: CardListProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CardListFilter>("all");

  const filtered = useMemo(
    () => filterDashboardCards(cards, viewerUid, query, filter),
    [cards, viewerUid, query, filter]
  );

  const showControls = cards.length > 0;

  return (
    <section aria-labelledby="dashboard-cards-heading">
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <h2
          id="dashboard-cards-heading"
          className="text-lg font-medium text-[var(--color-pearl)]"
        >
          {dashboardCopy.cardsSectionTitle}
        </h2>
        {filtered.length !== cards.length ? (
          <span className="text-xs text-[var(--color-mist)]">
            מציג {filtered.length} מתוך {cards.length}
          </span>
        ) : null}
      </div>

      {showControls ? (
        <div className="mb-4 space-y-3">
          <label className="sr-only" htmlFor="card-search">
            {dashboardCopy.searchPlaceholder}
          </label>
          <input
            id="card-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dashboardCopy.searchPlaceholder}
            autoComplete="off"
            className="min-h-11 w-full rounded-xl border border-[var(--color-glass-border)]/80 bg-[rgba(12,14,20,0.65)] px-4 text-[16px] text-[var(--color-pearl)] outline-none placeholder:text-[var(--color-mist)]/70 focus:border-[var(--color-champagne)]/45"
            enterKeyHint="search"
          />
          <div className="flex gap-2" role="group" aria-label="סינון כרטיסים">
            <FilterChip
              active={filter === "all"}
              onClick={() => setFilter("all")}
              label={dashboardCopy.filterAll}
            />
            <FilterChip
              active={filter === "pending"}
              onClick={() => setFilter("pending")}
              label={dashboardCopy.filterPending}
            />
          </div>
        </div>
      ) : null}

      {filtered.length === 0 && cards.length > 0 ? (
        <p
          className="py-10 text-center text-sm text-[var(--color-mist)]"
          role="status"
        >
          {dashboardCopy.noFilterResults}
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {filtered.map((card) => (
            <li key={card.id}>
              <CardListItem
                card={card}
                viewerUid={viewerUid}
                hasPending={cardHasPendingApproval(card, viewerUid)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-full border px-4 text-sm transition-colors ${
        active
          ? "border-[var(--color-champagne)]/50 bg-[rgba(201,184,150,0.1)] text-[var(--color-pearl)]"
          : "border-[var(--color-glass-border)]/60 text-[var(--color-mist)] hover:text-[var(--color-pearl)]"
      }`}
    >
      {label}
    </button>
  );
}
