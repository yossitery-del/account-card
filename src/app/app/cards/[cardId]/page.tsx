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
import { ProcessingOverlay } from "@/components/ui/ProcessingOverlay";
import { loadingLabels } from "@/lib/ui/loadingLabels";
import { cardsCopy } from "@/lib/cards/cardsCopy";
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
import type { EntryMutationCallableResult } from "@/lib/firebase/functions";
import { approveEntry } from "@/lib/entries/approveEntry";
import { cancelEntry } from "@/lib/entries/cancelEntry";
import { entriesCopy } from "@/lib/entries/entriesCopy";
import { listEntries } from "@/lib/entries/listEntries";
import { rejectEntry } from "@/lib/entries/rejectEntry";
import {
  measurePerfEntryAction,
  perfLog,
} from "@/lib/dev/perfDiagnostics";
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
  const [pageReady, setPageReady] = useState(false);
  const [entriesRefreshing, setEntriesRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  const cardSessionStartRef = useRef(0);

  useEffect(() => {
    cardSessionStartRef.current = performance.now();
  }, [cardId]);

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
        setError(null);
      }
      applyEntriesResult(entriesResult);
    } catch (err) {
      console.error("refreshCardData failed:", err);
    } finally {
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
        setError(null);

        const entriesResult = await listEntries(cardId);
        applyEntriesResult(entriesResult);
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
        setPageReady(false);
        setEntriesRefreshing(false);
      });
      return;
    }

    const loadId = ++loadGenerationRef.current;
    let cancelled = false;

    startTransition(() => {
      setPageReady(false);
      setError(null);
    });

    perfLog("card", "auth ready", {
      ms: Math.round(performance.now() - cardSessionStartRef.current),
    });

    void (async () => {
      const parallelStart = performance.now();
      let contextMs = 0;
      let entriesMs = 0;
      let entryCount = 0;
      let participantCount = 0;

      try {
        const [ctx, entriesResult] = await Promise.all([
          (async () => {
            const stepStart = performance.now();
            const result = await getCardPageContext(cardId, user.uid);
            contextMs = Math.round(performance.now() - stepStart);
            return result;
          })(),
          (async () => {
            const stepStart = performance.now();
            const result = await listEntries(cardId);
            entriesMs = Math.round(performance.now() - stepStart);
            entryCount = result.entries.length;
            participantCount = result.participantNames.size;
            return result;
          })(),
        ]);

        if (cancelled || loadId !== loadGenerationRef.current) return;

        perfLog("card", "getCardPageContext", { ms: contextMs });
        perfLog("card", "listEntries", {
          ms: entriesMs,
          entryCount,
          participantCount,
        });

        if (!ctx) {
          setError("לא נמצא כרטיס או שאין לך גישה אליו.");
          setContext(null);
          setEntries([]);
          setParticipantNames(new Map());
        } else {
          setContext(ctx);
          applyEntriesResult(entriesResult);
        }

        perfLog("card", "page ready", {
          totalMs: Math.round(performance.now() - cardSessionStartRef.current),
          parallelMs: Math.round(performance.now() - parallelStart),
          entryCount,
          participantCount,
        });
      } catch (err) {
        console.error("card page load failed:", err);
        perfLog("card", "page load failed", {
          ms: Math.round(performance.now() - parallelStart),
        });
        if (!cancelled && loadId === loadGenerationRef.current) {
          setError("לא הצלחנו לטעון את הכרטיס. נסה שוב.");
        }
      } finally {
        if (!cancelled && loadId === loadGenerationRef.current) {
          setPageReady(true);
          setEntriesRefreshing(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, cardId, applyEntriesResult]);

  useEffect(() => {
    if (!pageReady || entriesRefreshing || !user) return;
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
  }, [entries, pageReady, entriesRefreshing, user]);

  const card = context?.card ?? null;
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

  const handleApprove = useCallback(
    async (entryId: string) => {
      if (!user || actingEntryId) return;
      setActingEntryId(entryId);
      setActingKind("approve");
      setEntryActionError(null);
      try {
        await measurePerfEntryAction(
          { action: "approve", surface: "card", cardId, entryId },
          {
            callable: () => approveEntry(user, cardId, entryId),
            refresh: (result) => refreshAfterEntryMutation(result),
          }
        );
      } catch (err) {
        setEntryActionError(
          err instanceof Error ? err.message : "לא הצלחנו לאשר את הרשומה"
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
        await measurePerfEntryAction(
          { action: "reject", surface: "card", cardId, entryId },
          {
            callable: () => rejectEntry(user, cardId, entryId),
            refresh: (result) => refreshAfterEntryMutation(result),
          }
        );
      } catch (err) {
        setEntryActionError(
          err instanceof Error ? err.message : "לא הצלחנו לדחות את הרשומה"
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
        await measurePerfEntryAction(
          { action: "cancel", surface: "card", cardId, entryId },
          {
            callable: () => cancelEntry(user, cardId, entryId),
            refresh: (result) => refreshAfterEntryMutation(result),
          }
        );
      } catch (err) {
        setEntryActionError(
          err instanceof Error ? err.message : "לא הצלחנו לבטל את הרשומה"
        );
      } finally {
        setActingEntryId(null);
        setActingKind(null);
      }
    },
    [user, cardId, actingEntryId, refreshAfterEntryMutation]
  );

  const pageLoading = authLoading || !pageReady;
  const entriesLoading = !pageReady || entriesRefreshing;
  const mutationProcessing = actingEntryId !== null || sheetMutationPending;
  const overlayVisible = pageLoading || mutationProcessing;
  const overlayLabel = mutationProcessing
    ? loadingLabels.updating
    : loadingLabels.card;

  return (
    <main className="min-h-dvh px-6 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))]">
      <div className="mx-auto w-full max-w-lg">
        <AppShellHeader
          title={card?.title ?? "כרטיס"}
          backHref="/app"
          backLabel="חזרה לכרטיסים"
        />

        {pageLoading ? null : error ? (
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
                {card.title}
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
              loading={entriesLoading && entries.length === 0}
              refreshing={entriesRefreshing && !mutationProcessing}
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
