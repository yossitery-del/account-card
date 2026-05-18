"use client";

import { startTransition, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { CardList } from "@/components/cards/CardList";
import { DashboardCommandCenter } from "@/components/cards/DashboardHeader";
import { DashboardToolbar } from "@/components/cards/DashboardToolbar";
import { EmptyCardsState } from "@/components/cards/EmptyCardsState";
import { DevAuthIdentity } from "@/components/dev/DevAuthIdentity";
import { LoadingVault } from "@/components/ui/LoadingVault";
import { loadingLabels } from "@/lib/ui/loadingLabels";
import { FunctionsHealthDebug } from "@/components/dev/FunctionsHealthDebug";
import {
  listDashboardPendingEntriesSafe,
  type DashboardPendingByCard,
} from "@/lib/cards/dashboardPending";
import { listUserCards } from "@/lib/cards/listUserCards";
import type { AccountCardSummary } from "@/types/card";

const isDev = process.env.NODE_ENV === "development";

export default function AppPage() {
  const { user, loading: authLoading } = useAuth();
  const [cards, setCards] = useState<AccountCardSummary[]>([]);
  const [pendingByCard, setPendingByCard] = useState<DashboardPendingByCard>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authUid = user?.uid ?? null;

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!authUid) {
      startTransition(() => {
        setCards([]);
        setPendingByCard({});
        setLoading(false);
        setError(null);
      });
      return;
    }

    let cancelled = false;

    startTransition(() => {
      setCards([]);
      setPendingByCard({});
      setLoading(true);
      setError(null);
    });

    void (async () => {
      let list: AccountCardSummary[] = [];
      let pending: DashboardPendingByCard = {};

      try {
        list = await listUserCards(authUid);
      } catch (err) {
        console.error("listUserCards failed:", err);
        if (!cancelled) {
          setError("לא הצלחנו לטעון את הכרטיסים. נסה שוב.");
          setCards([]);
          setPendingByCard({});
        }
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }

      pending = await listDashboardPendingEntriesSafe(authUid);

      if (!cancelled) {
        setCards(list);
        setPendingByCard(pending);
        setError(null);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authUid, authLoading]);

  return (
    <main className="min-h-dvh px-6 py-11 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))]">
      <div className="mx-auto w-full max-w-lg">
        <DashboardToolbar />

        <DevAuthIdentity />

        {authLoading || loading ? (
          <LoadingVault inline label={loadingLabels.cards} />
        ) : error ? (
          <p
            className="text-center text-sm text-[var(--color-muted-rose)]"
            role="alert"
          >
            {error}
          </p>
        ) : (
          <>
            {authUid ? (
              <DashboardCommandCenter cards={cards} viewerUid={authUid} />
            ) : null}
            {cards.length === 0 ? (
              <EmptyCardsState />
            ) : (
              <CardList
                cards={cards}
                viewerUid={authUid!}
                pendingByCard={pendingByCard}
              />
            )}
          </>
        )}

        {isDev ? <FunctionsHealthDebug /> : null}
      </div>
    </main>
  );
}
