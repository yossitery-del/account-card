"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { AppShellHeader } from "@/components/cards/AppShellHeader";
import { CardShareStatus } from "@/components/cards/CardShareStatus";
import { AddEntrySheet } from "@/components/entries/AddEntrySheet";
import { EditEntrySheet } from "@/components/entries/EditEntrySheet";
import { EntryList } from "@/components/entries/EntryList";
import { LoadingVault } from "@/components/ui/LoadingVault";
import { ProcessingOverlay } from "@/components/ui/ProcessingOverlay";
import { loadingLabels } from "@/lib/ui/loadingLabels";
import { cardsCopy } from "@/lib/cards/cardsCopy";
import {
  readDashboardCardSnapshot,
  updateDashboardCardsSnapshot,
} from "@/lib/cards/dashboardSessionState";
import {
  formatOfficialBalanceAmount,
  formatOfficialBalanceHint,
  formatPendingBalanceDisplay,
} from "@/lib/cards/formatBalance";
import {
  getCardPageContext,
  type CardPageContext,
} from "@/lib/cards/getCardPageContext";
import {
  hasCardBalancePatch,
  patchCardBalances,
} from "@/lib/cards/patchCardBalances";
import { replaceDashboardCard } from "@/lib/cards/refreshDashboardCard";
import {
  parseViewerPendingAwaitingMyApproval,
} from "@/lib/cards/parseViewerPendingSummary";
import type { EntryMutationCallableResult } from "@/lib/firebase/functions";
import { approveEntry } from "@/lib/entries/approveEntry";
import { cancelEntry } from "@/lib/entries/cancelEntry";
import { entriesCopy } from "@/lib/entries/entriesCopy";
import { listEntries } from "@/lib/entries/listEntries";
import { rejectEntry } from "@/lib/entries/rejectEntry";
import type { AccountCardEntryWithId } from "@/types/entry";

export default function CardDetailPage() {
  const params = useParams();
  const cardId = typeof params.cardId === "string" ? params.cardId : "";
  const { user, loading: authLoading } = useAuth();
  const [context, setContext] = useState<CardPageContext | null>(null);
  const [entries, setEntries] = useState<AccountCardEntryWithId[]>([]);
  const [participantNames, setParticipantNames] = useState<Map<string, string>>(
    new Map()
  );
  const [contextLoading, setContextLoading] = useState(true);
  const [entriesLoaded, setEntriesLoaded] = useState(false);
  const [entriesRefreshing, setEntriesRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AccountCardEntryWithId | null>(
    null
  );
  const [highlightEntries, setHighlightEntries] = useState(false);
  const [actingEntryId, setActingEntryId] = useState<string | null>(null);
  const [actingKind, setActingKind] = useState<
    "approve" | "reject" | "cancel" | null
  >(null);
  const [entryActionError, setEntryActionError] = useState<string | null>(null);
  const [sheetMutationPending, setSheetMutationPending] = useState(false);

  const entriesSectionRef = useRef<HTMLElement>(null);
  const didScrollToPendingRef = useRef(false);
  const loadGenerationRef = useRef(0);
  const contextRef = useRef<CardPageContext | null>(null);
  const authUid = user?.uid ?? null;

  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  const applyEntriesResult = useCallback(
    (result: Awaited<ReturnType<typeof listEntries>>) => {
      setEntries(result.entries);
      setParticipantNames(result.participantNames);
    },
    []
  );

  /** רענון מלא — טעינה ראשונית; fallback ל-P1A/P1B */
  const refreshCardData = useCallback(async () => {
    if (!user || !cardId) return;
    setEntriesRefreshing(true);
    try {
      const [ctx, entriesResult] = await Promise.all([
        getCardPageContext(cardId, user.uid),
        listEntries(cardId),
      ]);
      if (ctx) {
        setContext(ctx);
        updateDashboardCardsSnapshot(user.uid, (cachedCards) => {
          const existing = cachedCards.find((card) => card.id === cardId);
          if (!existing) {
            return cachedCards;
          }
          return replaceDashboardCard(cachedCards, {
            ...existing,
            title: ctx.viewerCardDisplayTitle,
            balancePerspectiveUid: ctx.card.balancePerspectiveUid,
            officialBalance: ctx.card.officialBalance,
            pendingBalanceImpact: ctx.card.pendingBalanceImpact,
            updatedAt: ctx.card.updatedAt,
          });
        });
        setError(null);
      } else {
        setContext(null);
        setError("לא נמצא כרטיס או שאין לך גישה אליו.");
      }
      applyEntriesResult(entriesResult);
      setEntriesLoaded(true);
      setEntriesError(null);
    } catch (err) {
      console.error("refreshCardData failed:", err);
      setEntriesError("לא הצלחנו לטעון את הפעולות. נסה שוב.");
    } finally {
      setContextLoading(false);
      setEntriesRefreshing(false);
    }
  }, [user, cardId, applyEntriesResult]);

  /** 2D-P1A/P1B — אחרי mutation: patch יתרות מהשרת + listEntries בלבד */
  const refreshAfterEntryMutation = useCallback(
    async (mutation: EntryMutationCallableResult) => {
      if (!user || !cardId) return;

      if (!hasCardBalancePatch(mutation)) {
        await refreshCardData();
        return;
      }

      const currentContext = contextRef.current;
      if (!currentContext) {
        await refreshCardData();
        return;
      }

      setEntriesRefreshing(true);
      try {
        setContext((prev) =>
          prev ? patchCardBalances(prev, mutation) : prev
        );
        updateDashboardCardsSnapshot(user.uid, (cachedCards) => {
          const existing = cachedCards.find((card) => card.id === cardId);
          if (!existing) {
            return cachedCards;
          }

          const pendingAwaitingMyApproval =
            parseViewerPendingAwaitingMyApproval(
              mutation.pendingAwaitingMyApproval
            ) ?? existing.pendingAwaitingMyApproval;

          return replaceDashboardCard(cachedCards, {
            ...existing,
            officialBalance: mutation.officialBalance,
            pendingBalanceImpact: mutation.pendingBalanceImpact,
            updatedAt: mutation.updatedAt,
            pendingAwaitingMyApproval,
          });
        });
        setError(null);

        const entriesResult = await listEntries(cardId);
        applyEntriesResult(entriesResult);
        setEntriesError(null);
      } catch (err) {
        console.error("refreshAfterEntryMutation failed:", err);
        await refreshCardData();
      } finally {
        setEntriesRefreshing(false);
      }
    },
    [user, cardId, applyEntriesResult, refreshCardData]
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user || !cardId) {
      startTransition(() => {
        setContext(null);
        setEntries([]);
        setParticipantNames(new Map());
        setContextLoading(false);
        setEntriesLoaded(false);
        setEntriesRefreshing(false);
        setError(null);
        setEntriesError(null);
      });
      return;
    }

    const loadId = ++loadGenerationRef.current;
    let cancelled = false;

    startTransition(() => {
      setContext(null);
      setEntries([]);
      setParticipantNames(new Map());
      setContextLoading(true);
      setEntriesLoaded(false);
      setEntriesRefreshing(true);
      setError(null);
      setEntriesError(null);
    });

    const isCurrentLoad = () =>
      !cancelled && loadId === loadGenerationRef.current;

    const contextPromise = (async () => {
      try {
        const ctx = await getCardPageContext(cardId, user.uid);
        if (!isCurrentLoad()) return;

        if (!ctx) {
          setError("לא נמצא כרטיס או שאין לך גישה אליו.");
          setContext(null);
          setEntries([]);
          setParticipantNames(new Map());
          return;
        }

        setContext(ctx);
        setError(null);
      } catch (err) {
        console.error("getCardPageContext failed:", err);
        if (isCurrentLoad()) {
          setError("לא הצלחנו לטעון את הכרטיס. נסה שוב.");
        }
      } finally {
        if (isCurrentLoad()) {
          setContextLoading(false);
        }
      }
    })();

    const entriesPromise = (async () => {
      try {
        const entriesResult = await listEntries(cardId);
        if (!isCurrentLoad()) return;

        applyEntriesResult(entriesResult);
        setEntriesError(null);
      } catch (err) {
        console.error("listEntries failed:", err);
        if (isCurrentLoad()) {
          setEntriesError("לא הצלחנו לטעון את הפעולות. נסה שוב.");
        }
      } finally {
        if (isCurrentLoad()) {
          setEntriesLoaded(true);
        }
      }
    })();

    void Promise.allSettled([contextPromise, entriesPromise]).then(() => {
      if (!isCurrentLoad()) return;

      setEntriesRefreshing(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, cardId, applyEntriesResult]);

  useEffect(() => {
    if (!entriesLoaded || entriesRefreshing || !user) return;
    if (didScrollToPendingRef.current) return;

    const needsAttention = entries.some(
      (e) => e.status === "pending" && e.createdByUid !== user.uid
    );
    if (!needsAttention) return;

    didScrollToPendingRef.current = true;

    const attentionTimer = window.setTimeout(() => {
      setHighlightEntries(true);
      entriesSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      window.setTimeout(() => setHighlightEntries(false), 2400);
    }, 120);

    return () => {
      window.clearTimeout(attentionTimer);
    };
  }, [entries, entriesLoaded, entriesRefreshing, user]);

  const card = context?.card ?? null;
  const cachedCard = authUid && cardId
    ? readDashboardCardSnapshot(authUid, cardId)
    : null;

  const viewerShellTitle =
    context?.viewerCardDisplayTitle?.trim() ||
    cachedCard?.title?.trim() ||
    card?.title?.trim() ||
    "כרטיס";

  const officialAmount =
    card && user
      ? formatOfficialBalanceAmount(
          card.officialBalance,
          user.uid,
          card.balancePerspectiveUid
        )
      : "₪0";
  const officialHint =
    card && user
      ? formatOfficialBalanceHint(
          card.officialBalance,
          user.uid,
          card.balancePerspectiveUid
        )
      : null;
  const pendingDisplay =
    card && user
      ? formatPendingBalanceDisplay(
          card.pendingBalanceImpact,
          user.uid,
          card.balancePerspectiveUid
        )
      : { amount: "₪0", hint: "אין ממתין לאישור" };

  const canInvite =
    context?.currentParticipant.permissions.canInvite === true;
  const canAddEntry =
    context?.currentParticipant.permissions.canAddEntry === true;
  const activeParticipantsCount = context?.activeParticipantsCount ?? 0;
  const otherParticipantName =
    context?.otherParticipantName ??
    (user
      ? [...participantNames.entries()].find(([uid]) => uid !== user.uid)?.[1]
      : undefined) ??
    card?.title?.trim() ??
    cachedCard?.title?.trim();

  const handleApprove = useCallback(
    async (entryId: string) => {
      if (!user || actingEntryId) return;
      setActingEntryId(entryId);
      setActingKind("approve");
      setEntryActionError(null);
      try {
        const result = await approveEntry(user, cardId, entryId);
        await refreshAfterEntryMutation(result);
      } catch (err) {
        setEntryActionError(
          err instanceof Error ? err.message : "לא הצלחנו לאשר את הפעולה"
        );
      } finally {
        setActingEntryId(null);
        setActingKind(null);
      }
    },
    [user, cardId, actingEntryId, refreshAfterEntryMutation]
  );

  const handleReject = useCallback(
    async (entryId: string) => {
      if (!user || actingEntryId) return;
      setActingEntryId(entryId);
      setActingKind("reject");
      setEntryActionError(null);
      try {
        const result = await rejectEntry(user, cardId, entryId);
        await refreshAfterEntryMutation(result);
      } catch (err) {
        setEntryActionError(
          err instanceof Error ? err.message : "לא הצלחנו לדחות את הפעולה"
        );
      } finally {
        setActingEntryId(null);
        setActingKind(null);
      }
    },
    [user, cardId, actingEntryId, refreshAfterEntryMutation]
  );

  const handleEdit = useCallback(
    (entryId: string) => {
      if (actingEntryId || sheetMutationPending) return;
      const entry = entries.find((e) => e.id === entryId);
      if (!entry) return;
      setEditingEntry(entry);
      setEditOpen(true);
    },
    [entries, actingEntryId, sheetMutationPending]
  );

  const handleCancel = useCallback(
    async (entryId: string) => {
      if (!user || actingEntryId) return;
      setActingEntryId(entryId);
      setActingKind("cancel");
      setEntryActionError(null);
      try {
        const result = await cancelEntry(user, cardId, entryId);
        await refreshAfterEntryMutation(result);
      } catch (err) {
        setEntryActionError(
          err instanceof Error ? err.message : "לא הצלחנו לבטל את הפעולה"
        );
      } finally {
        setActingEntryId(null);
        setActingKind(null);
      }
    },
    [user, cardId, actingEntryId, refreshAfterEntryMutation]
  );

  const pageLoading = authLoading || contextLoading;
  const entriesLoading = !entriesLoaded || (entriesRefreshing && entries.length === 0);
  const mutationProcessing = actingEntryId !== null || sheetMutationPending;
  const overlayVisible = mutationProcessing;
  const overlayLabel = loadingLabels.updating;

  return (
    <main className="min-h-dvh px-6 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))]">
      <div className="mx-auto w-full max-w-lg">
        <AppShellHeader
          title={viewerShellTitle}
          backHref="/app"
          backLabel="חזרה לכרטיסים"
        />

        {pageLoading && !context ? (
          <LoadingVault inline label={loadingLabels.card} />
        ) : error ? (
          <p
            className="text-center text-sm text-[var(--color-muted-rose)]"
            role="alert"
          >
            {error}
          </p>
        ) : card && context && user ? (
          <>
            <div className="glass-card rounded-2xl p-8">
              <h2 className="mb-6 text-2xl font-medium text-[var(--color-pearl)]">
                {viewerShellTitle}
              </h2>

              <div className="mb-6 grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-[var(--color-mist)]">
                    {cardsCopy.balanceInCard}
                  </p>
                  <p className="mt-1 text-xl tabular-nums text-[var(--color-champagne)]">
                    {officialAmount}
                  </p>
                  {officialHint ? (
                    <p className="mt-0.5 text-[10px] text-[var(--color-mist)]">
                      {officialHint}
                    </p>
                  ) : null}
                </div>
                <div>
                  <p className="text-xs text-[var(--color-mist)]">
                    {cardsCopy.pendingApproval}
                  </p>
                  <p className="mt-1 text-xl tabular-nums text-[var(--color-pearl)]">
                    {pendingDisplay.amount}
                  </p>
                  {pendingDisplay.hint ? (
                    <p className="mt-0.5 text-[10px] text-[var(--color-mist)]">
                      {pendingDisplay.hint}
                    </p>
                  ) : null}
                </div>
              </div>

              {canAddEntry ? (
                <button
                  type="button"
                  disabled={mutationProcessing}
                  onClick={() => setAddOpen(true)}
                  className="mb-5 min-h-11 w-full rounded-xl bg-[var(--color-champagne)] py-3.5 text-base font-medium text-[var(--color-vault-black)] transition hover:bg-[var(--color-champagne-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {entriesCopy.addButton}
                </button>
              ) : null}

              <CardShareStatus
                cardId={cardId}
                activeParticipantsCount={activeParticipantsCount}
                canInvite={canInvite}
              />
            </div>

            {entryActionError ? (
              <p
                className="mt-4 text-center text-sm text-[var(--color-muted-rose)]"
                role="alert"
              >
                {entryActionError}
              </p>
            ) : null}

            <EntryList
              ref={entriesSectionRef}
              entries={entries}
              currentUid={user.uid}
              balancePerspectiveUid={card.balancePerspectiveUid}
              participantNames={participantNames}
              otherParticipantName={otherParticipantName}
              loading={entriesLoading && entries.length === 0}
              refreshing={entriesRefreshing && entriesLoaded && !mutationProcessing}
              error={entriesError}
              highlightPending={highlightEntries}
              actingEntryId={actingEntryId}
              actingKind={actingKind}
              onApprove={(id) => void handleApprove(id)}
              onReject={(id) => void handleReject(id)}
              onEdit={handleEdit}
              onCancel={(id) => void handleCancel(id)}
            />

            <EditEntrySheet
              key={editingEntry?.id ?? "edit-closed"}
              cardId={cardId}
              entry={editingEntry}
              balancePerspectiveUid={card.balancePerspectiveUid}
              otherParticipantName={otherParticipantName}
              open={editOpen}
              onClose={() => {
                setEditOpen(false);
                setEditingEntry(null);
              }}
              onEdited={async (result) => {
                await refreshAfterEntryMutation(result);
              }}
              onPendingChange={setSheetMutationPending}
            />

            <AddEntrySheet
              cardId={cardId}
              otherParticipantName={otherParticipantName}
              open={addOpen}
              onClose={() => setAddOpen(false)}
              onCreated={async (result) => {
                await refreshAfterEntryMutation(result);
              }}
              onPendingChange={setSheetMutationPending}
            />
          </>
        ) : null}

        <ProcessingOverlay visible={overlayVisible} label={overlayLabel} />
      </div>
    </main>
  );
}
