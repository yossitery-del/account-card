"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { BrandMarkButton } from "@/components/brand/BrandMarkButton";
import { LoadingVault } from "@/components/ui/LoadingVault";
import { getFirebaseAuth } from "@/lib/firebase/client";
import type {
  PilotMetricsAggregate,
  PilotMetricsDelta,
  PilotMetricsSnapshot,
} from "@/types/pilotMetrics";

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

function formatDelta(value: number | null, suffix = ""): string {
  if (value === null || Number.isNaN(value)) {
    return "—";
  }
  if (value === 0) {
    return "ללא שינוי";
  }
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("he-IL")}${suffix}`;
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

function deltaValue(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null) {
    return null;
  }
  return Math.round((current - previous) * 10) / 10;
}

function computeDelta(
  current: PilotMetricsAggregate,
  snapshot: PilotMetricsSnapshot | null
): PilotMetricsDelta | null {
  if (!snapshot) {
    return null;
  }
  const previous = snapshot.metrics;

  return {
    usersWithProfiles: deltaValue(
      current.usersWithProfiles,
      previous.usersWithProfiles
    ),
    totalCards: deltaValue(current.totalCards, previous.totalCards),
    twoSidedCards: deltaValue(current.twoSidedCards, previous.twoSidedCards),
    cardsWithEntries: deltaValue(
      current.cardsWithEntries,
      previous.cardsWithEntries
    ),
    cardsWithApprovedEntries: deltaValue(
      current.cardsWithApprovedEntries,
      previous.cardsWithApprovedEntries
    ),
    invitationsCreated: deltaValue(
      current.invitationsCreated,
      previous.invitationsCreated
    ),
    invitationsAccepted: deltaValue(
      current.invitationsAccepted,
      previous.invitationsAccepted
    ),
    pendingEntries: deltaValue(current.pendingEntries, previous.pendingEntries),
    approvedEntries: deltaValue(
      current.approvedEntries,
      previous.approvedEntries
    ),
    usersWhoCreatedCards: deltaValue(
      current.usersWhoCreatedCards,
      previous.usersWhoCreatedCards
    ),
    usersWithMoreThanOneCard: deltaValue(
      current.usersWithMoreThanOneCard,
      previous.usersWithMoreThanOneCard
    ),
    conversionRates: {
      cardsToTwoSidedCards: deltaValue(
        current.conversionRates.cardsToTwoSidedCards,
        previous.conversionRates.cardsToTwoSidedCards
      ),
      twoSidedCardsToApprovedActivity: deltaValue(
        current.conversionRates.twoSidedCardsToApprovedActivity,
        previous.conversionRates.twoSidedCardsToApprovedActivity
      ),
      invitationsToAccepted: deltaValue(
        current.conversionRates.invitationsToAccepted,
        previous.conversionRates.invitationsToAccepted
      ),
    },
  };
}

export default function PilotControlRoomPage() {
  const { user, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<PilotMetricsAggregate | null>(null);
  const [latestSnapshot, setLatestSnapshot] =
    useState<PilotMetricsSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingSnapshot, setSavingSnapshot] = useState(false);
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

      const headers = { Authorization: `Bearer ${token}` };
      const [response, snapshotResponse] = await Promise.all([
        fetch("/api/admin/pilot-metrics", {
          headers,
          cache: "no-store",
        }),
        fetch("/api/admin/pilot-metrics/snapshots", {
          headers,
          cache: "no-store",
        }),
      ]);

      const body = (await response.json()) as
        | PilotMetricsAggregate
        | { error?: string };
      const snapshotBody = (await snapshotResponse.json()) as
        | PilotMetricsSnapshot
        | null
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

      if (!snapshotResponse.ok) {
        setError(
          typeof snapshotBody === "object" &&
            snapshotBody &&
            "error" in snapshotBody &&
            snapshotBody.error
            ? snapshotBody.error
            : "לא הצלחנו לטעון תמונת מצב."
        );
        setMetrics(null);
        setLatestSnapshot(null);
        return;
      }

      setMetrics(body as PilotMetricsAggregate);
      setLatestSnapshot(snapshotBody as PilotMetricsSnapshot | null);
    } catch {
      setError("לא הצלחנו לטעון מדדים. נסה שוב.");
      setMetrics(null);
      setLatestSnapshot(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const saveSnapshot = useCallback(async () => {
    if (!user) {
      return;
    }

    setSavingSnapshot(true);
    setError(null);

    try {
      const token = await getFirebaseAuth().currentUser?.getIdToken();
      if (!token) {
        setError("נדרשת התחברות.");
        return;
      }

      const response = await fetch("/api/admin/pilot-metrics/snapshots", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
      const body = (await response.json()) as
        | PilotMetricsSnapshot
        | { error?: string };

      if (!response.ok) {
        setError(
          typeof body === "object" && body && "error" in body && body.error
            ? body.error
            : "לא הצלחנו לשמור תמונת מצב."
        );
        return;
      }

      await loadMetrics();
    } catch {
      setError("לא הצלחנו לשמור תמונת מצב. נסה שוב.");
    } finally {
      setSavingSnapshot(false);
    }
  }, [loadMetrics, user]);

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
  const delta = metrics ? computeDelta(metrics, latestSnapshot) : null;

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
            savingSnapshot={savingSnapshot}
            generatedAt={metrics?.generatedAt ?? null}
            snapshotCreatedAt={latestSnapshot?.createdAt ?? null}
            onRefresh={() => void loadMetrics()}
            onSaveSnapshot={() => void saveSnapshot()}
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
                    <DeltaLine
                      delta={delta ? (delta[key] as number | null) : null}
                      hasSnapshot={Boolean(latestSnapshot)}
                    />
                  </article>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-base font-medium text-[var(--color-pearl)]">
                יחסי המרה
              </h2>
              <ConversionGrid
                metrics={metrics}
                delta={delta}
                hasSnapshot={Boolean(latestSnapshot)}
              />
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
  savingSnapshot,
  generatedAt,
  snapshotCreatedAt,
  onRefresh,
  onSaveSnapshot,
}: {
  loading: boolean;
  savingSnapshot: boolean;
  generatedAt: string | null;
  snapshotCreatedAt: string | null;
  onRefresh: () => void;
  onSaveSnapshot: () => void;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-glass-border)] pt-4">
      <div className="space-y-1 text-xs text-[var(--color-mist)]">
        <p>עודכן לאחרונה: {formatTimestamp(generatedAt)}</p>
        <p>
          {snapshotCreatedAt
            ? `תמונת מצב אחרונה: ${formatTimestamp(snapshotCreatedAt)}`
            : "אין עדיין תמונת מצב קודמת"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSaveSnapshot}
          disabled={loading || savingSnapshot}
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--color-champagne)]/55 bg-[rgba(201,184,150,0.08)] px-5 py-2.5 text-sm text-[var(--color-pearl)] transition-colors hover:border-[var(--color-champagne)] hover:bg-[rgba(201,184,150,0.14)] disabled:opacity-50"
        >
          {savingSnapshot ? "שומר..." : "שמור תמונת מצב"}
        </button>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading || savingSnapshot}
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--color-champagne)]/55 bg-[rgba(201,184,150,0.08)] px-5 py-2.5 text-sm text-[var(--color-pearl)] transition-colors hover:border-[var(--color-champagne)] hover:bg-[rgba(201,184,150,0.14)] disabled:opacity-50"
        >
          {loading ? "מרענן..." : "רענן"}
        </button>
      </div>
    </div>
  );
}

function DeltaLine({
  delta,
  hasSnapshot,
  suffix = "",
}: {
  delta: number | null;
  hasSnapshot: boolean;
  suffix?: string;
}) {
  return (
    <p className="mt-2 text-xs text-[var(--color-mist)]">
      {hasSnapshot ? formatDelta(delta, suffix) : "אין תמונת מצב קודמת"}
    </p>
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

function ConversionGrid({
  metrics,
  delta,
  hasSnapshot,
}: {
  metrics: PilotMetricsAggregate;
  delta: PilotMetricsDelta | null;
  hasSnapshot: boolean;
}) {
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
          <DeltaLine
            delta={delta?.conversionRates[key] ?? null}
            hasSnapshot={hasSnapshot}
            suffix=" נק׳"
          />
        </article>
      ))}
    </div>
  );
}
