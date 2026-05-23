"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { BrandMarkButton } from "@/components/brand/BrandMarkButton";
import { LoadingVault } from "@/components/ui/LoadingVault";
import { getFirebaseAuth } from "@/lib/firebase/client";
import type { PilotMetricsAggregate } from "@/types/pilotMetrics";

type HealthLevel = "green" | "yellow" | "red";

function resolveHealthLevel(metrics: PilotMetricsAggregate): HealthLevel {
  if ((metrics.cardsWithApprovedEntries ?? 0) > 0) {
    return "green";
  }
  if ((metrics.twoSidedCards ?? 0) > 0) {
    return "yellow";
  }
  return "red";
}

const healthCopy: Record<
  HealthLevel,
  { label: string; description: string; className: string }
> = {
  green: {
    label: "ירוק",
    description: "יש כרטיסים עם פעולה מאושרת — אות חיובי לפיילוט.",
    className:
      "border-[var(--color-trust-green)]/35 bg-[rgba(132,154,136,0.1)] text-[var(--color-trust-green)]",
  },
  yellow: {
    label: "צהוב",
    description: "יש כרטיסים עם שני צדדים, עדיין בלי אישור ראשון.",
    className:
      "border-[var(--color-amber-mist)]/35 bg-[rgba(196,168,120,0.1)] text-[var(--color-amber-mist)]",
  },
  red: {
    label: "אדום",
    description: "עדיין אין כרטיסים עם שני צדדים פעילים.",
    className:
      "border-[var(--color-muted-rose)]/35 bg-[rgba(184,122,122,0.08)] text-[var(--color-muted-rose)]",
  },
};

function formatMetric(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }
  return value.toLocaleString("he-IL");
}

function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }
  return `${value.toLocaleString("he-IL")}%`;
}

function formatTimestamp(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  try {
    return new Intl.DateTimeFormat("he-IL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

const inventoryMetrics: Array<{
  key: keyof Omit<PilotMetricsAggregate, "conversionRates" | "generatedAt">;
  label: string;
}> = [
  { key: "usersWithProfiles", label: "משתמשים עם פרופיל" },
  { key: "totalCards", label: "כרטיסים פעילים" },
  { key: "twoSidedCards", label: "כרטיסים עם שני צדדים" },
  { key: "cardsWithEntries", label: "כרטיסים עם פעולה אחת לפחות" },
  {
    key: "cardsWithApprovedEntries",
    label: "כרטיסים עם פעולה מאושרת לפחות",
  },
  { key: "invitationsCreated", label: "הזמנות שנוצרו" },
  { key: "invitationsAccepted", label: "הצטרפויות שהושלמו" },
  { key: "pendingEntries", label: "פעולות ממתינות" },
  { key: "approvedEntries", label: "פעולות שאושרו" },
  { key: "usersWhoCreatedCards", label: "משתמשים שיצרו כרטיס" },
  { key: "usersWithMoreThanOneCard", label: "משתמשים עם יותר מכרטיס אחד" },
];

const conversionMetrics: Array<{
  key: keyof PilotMetricsAggregate["conversionRates"];
  label: string;
}> = [
  { key: "cardsToTwoSidedCards", label: "כרטיסים → שני צדדים" },
  {
    key: "twoSidedCardsToApprovedActivity",
    label: "שני צדדים → פעולה מאושרת",
  },
  { key: "invitationsToAccepted", label: "הזמנות → הצטרפות" },
];

export default function PilotControlRoomPage() {
  const { user, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<PilotMetricsAggregate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getFirebaseAuth().currentUser?.getIdToken();
      if (!token) {
        setError("נדרשת התחברות.");
        setMetrics(null);
        return;
      }

      const response = await fetch("/api/admin/pilot-metrics", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const body = (await response.json()) as
        | PilotMetricsAggregate
        | { error?: string };

      if (!response.ok) {
        setError(
          typeof body === "object" && body && "error" in body && body.error
            ? body.error
            : "לא הצלחנו לטעון מדדים."
        );
        setMetrics(null);
        return;
      }

      setMetrics(body as PilotMetricsAggregate);
    } catch {
      setError("לא הצלחנו לטעון מדדים. נסה שוב.");
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      setMetrics(null);
      return;
    }
    void loadMetrics();
  }, [authLoading, user, loadMetrics]);

  const health = metrics ? resolveHealthLevel(metrics) : null;

  return (
    <main className="vault-bg relative min-h-dvh overflow-x-hidden px-4 py-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6">
      <PilotBackdrop />
      <MotionContent>
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <BrandMarkButton />
          <Link
            href="/app"
            className="text-sm text-[var(--color-champagne)] transition-colors hover:text-[var(--color-champagne-hover)]"
          >
            חזרה לדשבורד
          </Link>
        </header>

        <section className="join-hero-card mb-6 rounded-2xl p-6 sm:p-8">
          <h1 className="text-2xl font-semibold text-[var(--color-pearl)]">
            חדר בקרת פיילוט
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-mist)]">
            מדדים מצרפיים בלבד — ללא שמות, סכומים או פרטי כרטיסים
          </p>

          <MetricsToolbar
            loading={loading}
            generatedAt={metrics?.generatedAt ?? null}
            onRefresh={() => void loadMetrics()}
          />

          {health ? (
            <HealthBanner health={health} />
          ) : null}
        </section>

        {authLoading || (loading && !metrics) ? (
          <LoadingVault inline label="טוען מדדי פיילוט..." />
        ) : !user ? (
          <section className="glass-card rounded-2xl p-6 text-center">
            <p className="mb-4 text-sm text-[var(--color-mist)]">
              נדרשת התחברות לצפייה בחדר הבקרה.
            </p>
            <Link
              href="/login"
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--color-champagne)] px-5 py-2.5 text-sm text-[var(--color-pearl)]"
            >
              התחברות
            </Link>
          </section>
        ) : error ? (
          <p
            className="rounded-2xl border border-[var(--color-muted-rose)]/30 bg-[rgba(184,122,122,0.08)] px-4 py-3 text-sm text-[var(--color-muted-rose)]"
            role="alert"
          >
            {error}
          </p>
        ) : metrics ? (
          <>
            <section className="mb-6">
              <h2 className="mb-4 text-base font-medium text-[var(--color-pearl)]">
                מלאי
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {inventoryMetrics.map(({ key, label }) => (
                  <article
                    key={key}
                    className="glass-card rounded-xl px-4 py-3.5"
                  >
                    <p className="text-xs text-[var(--color-mist)]">{label}</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--color-champagne)]">
                      {formatMetric(metrics[key] as number | null)}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-base font-medium text-[var(--color-pearl)]">
                יחסי המרה
              </h2>
              <ConversionGrid metrics={metrics} />
            </section>
          </>
        ) : null}
      </MotionContent>
    </main>
  );
}

function PilotBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_50%_at_50%_-5%,rgba(194,176,146,0.09),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-[radial-gradient(ellipse_80%_70%_at_50%_100%,rgba(28,29,25,0.85),transparent)]"
      />
    </>
  );
}

function MotionContent({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-10 mx-auto w-full max-w-3xl">{children}</div>
  );
}

function MetricsToolbar({
  loading,
  generatedAt,
  onRefresh,
}: {
  loading: boolean;
  generatedAt: string | null;
  onRefresh: () => void;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-glass-border)] pt-4">
      <p className="text-xs text-[var(--color-mist)]">
        עודכן לאחרונה: {formatTimestamp(generatedAt)}
      </p>
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--color-champagne)]/55 bg-[rgba(201,184,150,0.08)] px-5 py-2.5 text-sm text-[var(--color-pearl)] transition-colors hover:border-[var(--color-champagne)] hover:bg-[rgba(201,184,150,0.14)] disabled:opacity-50"
      >
        {loading ? "מרענן..." : "רענן"}
      </button>
    </div>
  );
}

function HealthBanner({ health }: { health: HealthLevel }) {
  const copy = healthCopy[health];
  return (
    <div
      className={`mt-5 rounded-xl border px-4 py-3 text-sm leading-relaxed ${copy.className}`}
      role="status"
    >
      <p className="font-medium">מצב: {copy.label}</p>
      <p className="mt-1 opacity-90">{copy.description}</p>
    </div>
  );
}

function ConversionGrid({ metrics }: { metrics: PilotMetricsAggregate }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {conversionMetrics.map(({ key, label }) => (
        <article key={key} className="glass-card rounded-xl px-4 py-3.5">
          <p className="text-xs leading-relaxed text-[var(--color-mist)]">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--color-pearl)]">
            {formatPercent(metrics.conversionRates[key])}
          </p>
        </article>
      ))}
    </div>
  );
}
