"use client";

import { useCallback, useEffect, useRef } from "react";
import { listUserCards } from "@/lib/cards/listUserCards";
import type { AccountCardSummary } from "@/types/card";

/** מינימום בין רענוני רקע לדשבורד — מונע קריאות כפולות מ-focus + visibilitychange. */
export const DASHBOARD_REVALIDATE_THROTTLE_MS = 30_000;

type UseDashboardRevalidateOptions = {
  viewerUid: string | null;
  initialLoading: boolean;
  onCards: (cards: AccountCardSummary[]) => void;
};

/**
 * רענון שקט של listUserCards כשהמשתמש חוזר לטאב/לאפליקציה — ללא listeners בזמן אמת.
 */
export function useDashboardRevalidate({
  viewerUid,
  initialLoading,
  onCards,
}: UseDashboardRevalidateOptions): void {
  const initialLoadingRef = useRef(initialLoading);
  const inFlightRef = useRef(false);
  const lastRevalidateAtRef = useRef(0);

  useEffect(() => {
    initialLoadingRef.current = initialLoading;
  }, [initialLoading]);

  const revalidate = useCallback(async () => {
    if (!viewerUid || initialLoadingRef.current || inFlightRef.current) {
      return;
    }
    if (document.visibilityState !== "visible") {
      return;
    }

    const now = Date.now();
    if (now - lastRevalidateAtRef.current < DASHBOARD_REVALIDATE_THROTTLE_MS) {
      return;
    }

    inFlightRef.current = true;
    lastRevalidateAtRef.current = now;

    try {
      const list = await listUserCards(viewerUid);
      onCards(list);
    } catch (err) {
      console.error("dashboard revalidate on focus failed:", err);
    } finally {
      inFlightRef.current = false;
    }
  }, [viewerUid, onCards]);

  useEffect(() => {
    if (!viewerUid) {
      return;
    }

    const onAppVisible = () => {
      void revalidate();
    };

    window.addEventListener("focus", onAppVisible);
    document.addEventListener("visibilitychange", onAppVisible);

    return () => {
      window.removeEventListener("focus", onAppVisible);
      document.removeEventListener("visibilitychange", onAppVisible);
    };
  }, [viewerUid, revalidate]);
}
