"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  activeCardsLabel,
  pendingCardsLabel,
} from "@/lib/cards/dashboardCopy";
import { computeDashboardStats } from "@/lib/cards/dashboardStats";
import { formatLocalDateTimeLine } from "@/lib/ui/formatLocalDateTime";
import { formatAccountGreeting } from "@/lib/users/accountGreeting";
import type { AccountCardSummary } from "@/types/card";

type DashboardHeaderProps = {
  cards: AccountCardSummary[];
  viewerUid: string;
};

/**
 * כותרת אישית לדשבורד — ברכה, תאריך/שעה מקומיים, סיכום בטוח מהכרטיסים שכבר נטענו.
 */
export function DashboardHeader({ cards, viewerUid }: DashboardHeaderProps) {
  const { user } = useAuth();
  const [clockAt, setClockAt] = useState(() => Date.now());

  useEffect(() => {
    const onFocus = () => setClockAt(Date.now());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const now = useMemo(() => new Date(clockAt), [clockAt]);

  const greeting = useMemo(() => {
    if (!user) {
      return null;
    }
    return formatAccountGreeting(user.displayName, user.email, now);
  }, [user, now]);

  const stats = useMemo(
    () => computeDashboardStats(cards, viewerUid),
    [cards, viewerUid]
  );

  const dateTimeLine = formatLocalDateTimeLine(now);
  const cardsLabel = activeCardsLabel(stats.activeCardCount);
  const pendingLabel = pendingCardsLabel(stats.cardsWithPending);

  if (!greeting) {
    return null;
  }

  return (
    <section
      className="glass-card mb-6 rounded-2xl border border-[var(--color-glass-border)]/80 px-5 py-5 sm:px-6"
      aria-label="סיכום כרטיסי חשבון"
    >
      <p className="text-lg font-medium tracking-wide text-[var(--color-pearl)]">
        {greeting}
      </p>
      <p className="mt-1.5 text-sm text-[var(--color-mist)]">{dateTimeLine}</p>

      {stats.activeCardCount > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex min-h-9 items-center rounded-full border border-[var(--color-glass-border)] bg-[var(--color-glass-surface)] px-3.5 text-xs font-medium text-[var(--color-pearl)]">
            {cardsLabel}
          </span>
          {pendingLabel ? (
            <span className="inline-flex min-h-9 items-center rounded-full border border-[var(--color-champagne)]/35 bg-[rgba(201,184,150,0.08)] px-3.5 text-xs font-medium text-[var(--color-champagne)]">
              {pendingLabel}
            </span>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
