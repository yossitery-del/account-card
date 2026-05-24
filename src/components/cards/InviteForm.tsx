"use client";

import Link from "next/link";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/components/auth/AuthProvider";
import { ProcessingOverlay } from "@/components/ui/ProcessingOverlay";
import { createInvitation } from "@/lib/invitations/createInvitation";
import { inviteCopy } from "@/lib/invitations/inviteCopy";
import {
  buildInviteMessageForCopy,
  canUseNativeShare,
  copyTextToClipboard,
  formatInviteLinkPreview,
  shareInvitationNative,
} from "@/lib/invitations/shareInvitation";
import { buildWhatsAppShareUrl } from "@/lib/invitations/whatsappShare";
import type { CreateInvitationResult } from "@/types/invitation";

const INVITE_TIMEOUT_MS = 20_000;
const COPY_FEEDBACK_MS = 2_500;
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
  const [linkCopied, setLinkCopied] = useState(false);
  const [messageCopied, setMessageCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  const attemptGenerationRef = useRef(0);
  const inflightByCardIdRef = useRef(
    new Map<string, Promise<CreateInvitationResult>>()
  );

  const nativeShareAvailable = canUseNativeShare();

  useEffect(() => {
    if (!linkCopied) return;
    const timer = window.setTimeout(() => setLinkCopied(false), COPY_FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [linkCopied]);

  useEffect(() => {
    if (!messageCopied) return;
    const timer = window.setTimeout(
      () => setMessageCopied(false),
      COPY_FEEDBACK_MS
    );
    return () => window.clearTimeout(timer);
  }, [messageCopied]);

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
        setCopyError(null);
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

  async function handleNativeShare() {
    if (!result?.inviteLink) return;
    setCopyError(null);
    await shareInvitationNative(result.inviteLink);
  }

  async function handleCopyLink() {
    if (!result?.inviteLink) return;
    setCopyError(null);
    const ok = await copyTextToClipboard(result.inviteLink);
    if (ok) {
      setLinkCopied(true);
      return;
    }
    setCopyError(inviteCopy.copyFailed);
  }

  async function handleCopyMessage() {
    if (!result?.inviteLink) return;
    setCopyError(null);
    const ok = await copyTextToClipboard(
      buildInviteMessageForCopy(result.inviteLink)
    );
    if (ok) {
      setMessageCopied(true);
      return;
    }
    setCopyError(inviteCopy.copyFailed);
  }

  function handleRetry() {
    if (!user || !cardId) return;

    inflightByCardIdRef.current.delete(cardId);
    const attemptId = ++attemptGenerationRef.current;

    setResult(null);
    setError(null);
    setErrorKind(null);
    setCopyError(null);
    setLinkCopied(false);
    setMessageCopied(false);
    setLoading(true);

    void runCreateAttempt(attemptId);
  }

  if (authLoading || loading) {
    return (
      <>
        <div className="glass-card min-h-[12rem] rounded-2xl" aria-hidden />
        <ProcessingOverlay visible label={inviteCopy.loading} />
      </>
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
            className="min-h-11 w-full rounded-full border border-[var(--color-champagne)] bg-[var(--color-glass-surface)] px-6 py-3.5 text-base font-medium text-[var(--color-pearl)] transition-colors hover:bg-[rgba(201,184,150,0.12)]"
          >
            {inviteCopy.retry}
          </button>
          {isTimeout ? (
            <Link
              href={`/app/cards/${cardId}`}
              className="min-h-11 w-full rounded-full border border-[var(--color-glass-border)] bg-transparent px-6 py-3.5 text-center text-base font-medium text-[var(--color-mist)] transition-colors hover:bg-[rgba(194,176,146,0.06)]"
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
  const linkPreview = formatInviteLinkPreview(result.inviteLink);

  return (
    <div className="glass-card rounded-2xl p-8">
      <h2 className="mb-2 text-xl font-medium text-[var(--color-pearl)]">
        {inviteCopy.successTitle}
      </h2>
      <p className="mb-4 text-sm leading-relaxed text-[var(--color-mist)]">
        {inviteCopy.successBody}
      </p>

      <div className="mb-6 rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass-surface)] px-4 py-3 text-center">
        <p className="text-xs text-[var(--color-mist)]">{inviteCopy.readyHint}</p>
        <p
          className="mt-1 text-sm font-medium text-[var(--color-champagne)]"
          dir="ltr"
        >
          {linkPreview}
        </p>
        <p className="mt-2 text-[10px] leading-relaxed text-[var(--color-mist)]">
          {inviteCopy.expiryHint}
        </p>
      </div>

      {copyError ? (
        <p
          className="mb-4 text-center text-sm text-[var(--color-muted-rose)]"
          role="alert"
        >
          {copyError}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {nativeShareAvailable ? (
          <button
            type="button"
            onClick={() => void handleNativeShare()}
            className="min-h-11 w-full rounded-full border border-[var(--color-champagne)] bg-[var(--color-champagne)] px-6 py-3.5 text-base font-medium text-[var(--color-vault-black)] transition-colors hover:bg-[var(--color-champagne-hover)]"
          >
            {inviteCopy.sharePrimary}
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => void handleCopyLink()}
          className={`min-h-11 w-full rounded-full border px-6 py-3.5 text-base font-medium transition-colors ${
            nativeShareAvailable
              ? "border-[var(--color-glass-border)] bg-[var(--color-glass-surface)] text-[var(--color-pearl)] hover:bg-[rgba(194,176,146,0.06)]"
              : "border-[var(--color-champagne)] bg-[var(--color-champagne)] text-[var(--color-vault-black)] hover:bg-[var(--color-champagne-hover)]"
          }`}
        >
          {linkCopied ? inviteCopy.copyLinkDone : inviteCopy.copyLink}
        </button>

        <button
          type="button"
          onClick={() => void handleCopyMessage()}
          className="min-h-11 w-full rounded-full border border-[var(--color-glass-border)] bg-transparent px-6 py-3.5 text-base font-medium text-[var(--color-mist)] transition-colors hover:bg-[rgba(194,176,146,0.06)] hover:text-[var(--color-pearl)]"
        >
          {messageCopied ? inviteCopy.copyMessageDone : inviteCopy.copyMessage}
        </button>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 text-center text-sm text-[var(--color-mist)] underline-offset-4 transition hover:text-[var(--color-pearl)] hover:underline"
        >
          {inviteCopy.whatsappSecondary}
        </a>

        <p className="pt-1 text-center text-[11px] leading-relaxed text-[var(--color-mist)]/70">
          טיפ: בוואטסאפ כדאי לחכות רגע לתצוגה המקדימה לפני השליחה.
        </p>
      </div>
    </div>
  );
}
