"use client";

import Link from "next/link";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/components/auth/AuthProvider";
import { LoadingVault } from "@/components/ui/LoadingVault";
import { createInvitation } from "@/lib/invitations/createInvitation";
import { inviteCopy } from "@/lib/invitations/inviteCopy";
import { buildWhatsAppShareUrl } from "@/lib/invitations/whatsappShare";
import type { CreateInvitationResult } from "@/types/invitation";

const INVITE_TIMEOUT_MS = 20_000;
const isDev = process.env.NODE_ENV === "development";

type InviteFormProps = {
  cardId: string;
};

type InviteErrorKind = "timeout" | "generic" | null;

class InviteTimeoutError extends Error {
  constructor() {
    super("timeout");
    this.name = "InviteTimeoutError";
  }
}

function inviteDevLog(event: string, detail?: string) {
  if (!isDev) return;
  if (detail) {
    console.info(`[invite] ${event}: ${detail}`);
  } else {
    console.info(`[invite] ${event}`);
  }
}

function inviteDevLogFailed(err: unknown) {
  if (!isDev) return;
  if (err instanceof InviteTimeoutError) {
    inviteDevLog("create timeout");
    return;
  }
  const code = err instanceof FirebaseError ? err.code : undefined;
  const message = err instanceof Error ? err.message : "unknown";
  const detail = [code, message].filter(Boolean).join(" / ") || message;
  inviteDevLog("create failed", detail);
}

function withInviteTimeout<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new InviteTimeoutError());
    }, INVITE_TIMEOUT_MS);

    void promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        window.clearTimeout(timer);
        reject(err);
      }
    );
  });
}

export function InviteForm({ cardId }: InviteFormProps) {
  const { user, loading: authLoading } = useAuth();
  const [result, setResult] = useState<CreateInvitationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<InviteErrorKind>(null);
  const [loading, setLoading] = useState(true);
  const [copyDone, setCopyDone] = useState(false);

  const attemptGenerationRef = useRef(0);
  const inflightByCardIdRef = useRef(
    new Map<string, Promise<CreateInvitationResult>>()
  );

  const fetchInvitation = useCallback(async (targetCardId: string) => {
    const inflight = inflightByCardIdRef.current;
    const existing = inflight.get(targetCardId);
    if (existing) {
      return existing;
    }

    inviteDevLog("create started");

    const promise = withInviteTimeout(createInvitation(targetCardId));
    inflight.set(targetCardId, promise);

    void promise.finally(() => {
      if (inflight.get(targetCardId) === promise) {
        inflight.delete(targetCardId);
      }
    });

    return promise;
  }, []);

  const runCreateAttempt = useCallback(
    async (attemptId: number) => {
      try {
        const data = await fetchInvitation(cardId);
        if (attemptId !== attemptGenerationRef.current) return;

        setResult(data);
        setError(null);
        setErrorKind(null);
        inviteDevLog("create success");
      } catch (err) {
        if (attemptId !== attemptGenerationRef.current) return;

        if (err instanceof InviteTimeoutError) {
          setErrorKind("timeout");
          setError(inviteCopy.timeoutBody);
          inviteDevLog("create timeout");
        } else {
          setErrorKind("generic");
          setError(
            err instanceof Error ? err.message : inviteCopy.errorDefault
          );
          inviteDevLogFailed(err);
        }
      } finally {
        if (attemptId !== attemptGenerationRef.current) return;
        setLoading(false);
      }
    },
    [cardId, fetchInvitation]
  );

  useEffect(() => {
    if (authLoading) return;

    if (!user || !cardId) {
      startTransition(() => setLoading(false));
      return;
    }

    if (result?.inviteLink) {
      startTransition(() => setLoading(false));
      return;
    }

    const attemptId = ++attemptGenerationRef.current;

    startTransition(() => {
      setLoading(true);
      setError(null);
      setErrorKind(null);
    });

    void runCreateAttempt(attemptId);

    return () => {
      attemptGenerationRef.current += 1;
    };
  }, [authLoading, user, cardId, result?.inviteLink, runCreateAttempt]);

  async function handleCopy() {
    if (!result?.inviteLink) return;
    try {
      await navigator.clipboard.writeText(result.inviteLink);
      setCopyDone(true);
    } catch (err) {
      console.error("copy invite link failed:", err);
      setError("לא הצלחנו להעתיק את הקישור");
    }
  }

  function handleRetry() {
    if (!user || !cardId) return;

    inflightByCardIdRef.current.delete(cardId);
    const attemptId = ++attemptGenerationRef.current;

    setResult(null);
    setError(null);
    setErrorKind(null);
    setLoading(true);

    void runCreateAttempt(attemptId);
  }

  if (authLoading || loading) {
    return (
      <div className="glass-card rounded-2xl px-8 py-12">
        <LoadingVault />
        <p className="mt-6 text-center text-sm text-[var(--color-mist)]">
          {inviteCopy.loading}
        </p>
      </div>
    );
  }

  if (error && !result) {
    const isTimeout = errorKind === "timeout";

    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        {isTimeout ? (
          <h2 className="mb-3 text-lg font-medium text-[var(--color-pearl)]">
            {inviteCopy.timeoutTitle}
          </h2>
        ) : null}
        <p
          className="mb-6 text-sm text-[var(--color-muted-rose)]"
          role="alert"
        >
          {isTimeout ? inviteCopy.timeoutBody : error}
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleRetry}
            className="w-full rounded-full border border-[var(--color-champagne)] bg-[var(--color-glass-surface)] px-6 py-3.5 text-base font-medium text-[var(--color-pearl)] transition-colors hover:bg-[rgba(201,184,150,0.12)]"
          >
            {inviteCopy.retry}
          </button>
          {isTimeout ? (
            <Link
              href={`/app/cards/${cardId}`}
              className="w-full rounded-full border border-[var(--color-glass-border)] bg-transparent px-6 py-3.5 text-center text-base font-medium text-[var(--color-mist)] transition-colors hover:bg-white/5"
            >
              {inviteCopy.backToCard}
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const whatsappUrl = buildWhatsAppShareUrl(result.inviteLink);

  return (
    <div className="glass-card rounded-2xl p-8">
      <h2 className="mb-2 text-xl font-medium text-[var(--color-pearl)]">
        {inviteCopy.successTitle}
      </h2>
      <p className="mb-6 text-sm leading-relaxed text-[var(--color-mist)]">
        {inviteCopy.successBody}
      </p>
      <p className="mb-2 text-xs text-[var(--color-mist)]">{inviteCopy.linkLabel}</p>
      <p
        className="mb-4 break-all rounded-lg border border-[var(--color-glass-border)] bg-[var(--color-glass-surface)] p-3 text-sm text-[var(--color-champagne)]"
        dir="ltr"
      >
        {result.inviteLink}
      </p>
      <p className="mb-6 text-xs text-[var(--color-mist)]">
        {inviteCopy.expiryHint}
      </p>
      <div className="flex flex-col gap-3">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full rounded-full border border-[var(--color-champagne)] bg-[rgba(37,211,102,0.12)] px-6 py-3.5 text-center text-base font-medium text-[var(--color-pearl)] transition-colors hover:bg-[rgba(37,211,102,0.2)]"
        >
          {inviteCopy.whatsapp}
        </a>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="w-full rounded-full border border-[var(--color-glass-border)] bg-[var(--color-glass-surface)] px-6 py-3.5 text-base font-medium text-[var(--color-pearl)] transition-colors hover:bg-white/5"
        >
          {copyDone ? inviteCopy.copied : inviteCopy.copy}
        </button>
      </div>
    </div>
  );
}
