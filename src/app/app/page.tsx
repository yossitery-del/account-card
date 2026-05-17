"use client";

import { startTransition, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AppShellHeader } from "@/components/cards/AppShellHeader";
import { CardList } from "@/components/cards/CardList";
import { EmptyCardsState } from "@/components/cards/EmptyCardsState";
import { DevAuthIdentity } from "@/components/dev/DevAuthIdentity";
import { LoadingVault } from "@/components/ui/LoadingVault";
import { loadingLabels } from "@/lib/ui/loadingLabels";
import { FunctionsHealthDebug } from "@/components/dev/FunctionsHealthDebug";
import { listUserCards } from "@/lib/cards/listUserCards";
import type { AccountCardSummary } from "@/types/card";

const isDev = process.env.NODE_ENV === "development";

export default function AppPage() {
  const { user, loading: authLoading } = useAuth();
  const [cards, setCards] = useState<AccountCardSummary[]>([]);
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
        setLoading(false);
        setError(null);
      });
      return;
    }

    let cancelled = false;

    startTransition(() => {
      setCards([]);
      setLoading(true);
      setError(null);
    });

    void (async () => {
      try {
        const list = await listUserCards(authUid);
        if (!cancelled) {
          setCards(list);
        }
      } catch (err) {
        console.error("listUserCards failed:", err);
        if (!cancelled) {
          setError("לא הצלחנו לטעון את הכרטיסים. נסה שוב.");
          setCards([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authUid, authLoading]);

  return (
    <main className="min-h-dvh px-6 py-10">
      <div className="mx-auto w-full max-w-lg">
        <AppShellHeader title="הכרטיסים שלי" showNewCard />

        <DevAuthIdentity />

        {authLoading || loading ? (
          <LoadingVault inline label={loadingLabels.cards} />
        ) : error ? (
          <p className="text-center text-sm text-[var(--color-muted-rose)]" role="alert">
            {error}
          </p>
        ) : cards.length === 0 ? (
          <EmptyCardsState />
        ) : (
          <CardList cards={cards} viewerUid={authUid!} />
        )}

        {isDev ? <FunctionsHealthDebug /> : null}
      </div>
    </main>
  );
}
