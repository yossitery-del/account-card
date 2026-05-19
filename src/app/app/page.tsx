"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { CardList } from "@/components/cards/CardList";
import { DashboardCommandCenter } from "@/components/cards/DashboardHeader";
import { DashboardToolbar } from "@/components/cards/DashboardToolbar";
import { EmptyCardsState } from "@/components/cards/EmptyCardsState";
import { DevAuthIdentity } from "@/components/dev/DevAuthIdentity";
import { LoadingVault } from "@/components/ui/LoadingVault";
import { loadingLabels } from "@/lib/ui/loadingLabels";
import { FunctionsHealthDebug } from "@/components/dev/FunctionsHealthDebug";
import type { DashboardQuickActionCallableResult } from "@/lib/firebase/functions";
import {
  patchDashboardCardFromQuickAction,
  refreshDashboardCardInPlace,
  replaceDashboardCard,
} from "@/lib/cards/refreshDashboardCard";
import { listUserCards } from "@/lib/cards/listUserCards";
import { useDashboardRevalidate } from "@/lib/cards/useDashboardRevalidate";
import {
  clearDashboardCardsSnapshot,
  readDashboardCardsSnapshot,
  writeDashboardCardsSnapshot,
} from "@/lib/cards/dashboardSessionState";
import type { AccountCardSummary } from "@/types/card";

const isDev = process.env.NODE_ENV === "development";

export default function AppPage() {
  const { user, loading: authLoading } = useAuth();
  const [cards, setCards] = useState<AccountCardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authUid = user?.uid ?? null;
  const applyDashboardCards = useCallback(
    (list: AccountCardSummary[]) => {
      setCards(list);
      if (authUid) {
        writeDashboardCardsSnapshot(authUid, list);
      }
    },
    [authUid]
  );

  const reloadAllCards = useCallback(async (): Promise<AccountCardSummary[]> => {
    if (!authUid) {
      return [];
    }
    return listUserCards(authUid);
  }, [authUid]);

  const handleRevalidatedCards = useCallback((list: AccountCardSummary[]) => {
    applyDashboardCards(list);
    setError(null);
  }, [applyDashboardCards]);

  useDashboardRevalidate({
    viewerUid: authUid,
    initialLoading: authLoading || loading,
    onCards: handleRevalidatedCards,
  });

  const refreshCard = useCallback(
    async (
      cardId: string,
      mutation?: DashboardQuickActionCallableResult
    ) => {
      if (!authUid) {
        return;
      }

      if (mutation?.cardId === cardId) {
        let didPatch = false;
        setCards((prev) => {
          const existing = prev.find((card) => card.id === cardId);
          if (!existing) {
            return prev;
          }
          const patched = patchDashboardCardFromQuickAction(existing, mutation);
          if (!patched) {
            return prev;
          }
          didPatch = true;
          const next = replaceDashboardCard(prev, patched);
          writeDashboardCardsSnapshot(authUid, next);
          return next;
        });
        if (didPatch) {
          return;
        }
      }

      const result = await refreshDashboardCardInPlace({
        cardId,
        viewerUid: authUid,
        reloadAllCards,
      });

      if (result.kind === "full") {
        applyDashboardCards(result.cards);
        return;
      }

      setCards((prev) => {
        const next = replaceDashboardCard(prev, result.updated);
        writeDashboardCardsSnapshot(authUid, next);
        return next;
      });
    },
    [authUid, applyDashboardCards, reloadAllCards]
  );

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!authUid) {
      startTransition(() => {
        setCards([]);
        setLoading(false);
        setError(null);
      });
      clearDashboardCardsSnapshot();
      return;
    }

    let cancelled = false;
    const cachedCards = readDashboardCardsSnapshot(authUid);
    const hasCachedCards = cachedCards !== null;

    startTransition(() => {
      if (cachedCards) {
        setCards(cachedCards);
      } else {
        setCards([]);
      }
      setLoading(!hasCachedCards);
      setError(null);
    });

    void (async () => {
      try {
        const list = await listUserCards(authUid);
        if (!cancelled) {
          applyDashboardCards(list);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        console.error("listUserCards failed:", err);
        if (!cancelled) {
          if (!hasCachedCards) {
            setError("לא הצלחנו לטעון את הכרטיסים. נסה שוב.");
            setCards([]);
          }
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authUid, authLoading, applyDashboardCards]);

  return (
    <main className="min-h-dvh px-6 py-11 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))]">
      <div className="mx-auto w-full max-w-lg">
        <DashboardToolbar />

        <DevAuthIdentity />

        {authLoading || (loading && cards.length === 0) ? (
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
              <DashboardCommandCenter cards={cards} />
            ) : null}
            {cards.length === 0 ? (
              <EmptyCardsState />
            ) : (
              <CardList
                cards={cards}
                viewerUid={authUid!}
                onCardRefresh={refreshCard}
              />
            )}
          </>
        )}

        {isDev ? <FunctionsHealthDebug /> : null}
      </div>
    </main>
  );
}
