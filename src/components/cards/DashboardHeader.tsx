"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  activeCardsMeta,
  primaryStatusMessage,
} from "@/lib/cards/dashboardCopy";
import { computeDashboardStats } from "@/lib/cards/dashboardStats";
import { formatLocalDateTimeLine } from "@/lib/ui/formatLocalDateTime";
import { formatAccountGreeting } from "@/lib/users/accountGreeting";
import type { AccountCardSummary } from "@/types/card";

type DashboardCommandCenterProps = {
  cards: AccountCardSummary[];
};

/**
 * מרכז פיקוד — סטטוס ראשון, ברכה משנית, ללא מסגרת כרטיס.
 */
export function DashboardCommandCenter({ cards }: DashboardCommandCenterProps) {
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

  const stats = useMemo(() => computeDashboardStats(cards), [cards]);

  const statusPrimary = primaryStatusMessage(
    stats.pendingDecisionsCount,
    stats.activeCardCount
  );
  const cardsMeta = activeCardsMeta(stats.activeCardCount);
  const dateTimeLine = formatLocalDateTimeLine(now);
  const hasAttention = stats.pendingDecisionsCount > 0;

  if (!greeting) {
    return null;
  }

  return (
    <section
      className="vault-command-divider mb-9 border-b pb-8"
      aria-label="מרכז פיקוד"
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-2.5 h-2 w-2 shrink-0 rounded-full ${
            hasAttention
              ? "bg-[var(--color-vault-gold-green)]"
              : "bg-[var(--color-mist)]/45"
          }`}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold leading-snug tracking-tight text-[var(--color-pearl)] sm:text-2xl">
            {statusPrimary}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-mist)]">
            {greeting}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-relaxed text-[var(--color-mist)]">
        <span>{cardsMeta}</span>
        <span className="text-[var(--color-champagne)]/30" aria-hidden>
          ·
        </span>
        <span>{dateTimeLine}</span>
      </div>
    </section>
  );
}
