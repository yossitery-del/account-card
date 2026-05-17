"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { signInWithGoogle } from "@/lib/auth/google";
import { acceptInvitation } from "@/lib/invitations/acceptInvitation";
import {
  consumeJoinIntentForToken,
  setJoinIntent,
  clearJoinIntent,
} from "@/lib/invitations/joinIntent";
import { mapAcceptInvitationError } from "@/lib/invitations/joinAcceptErrors";
import {
  JOIN_ERROR_MESSAGES,
  JOIN_LOGGED_IN_SECURE_LABEL,
  JOIN_PREVIEW_ACCEPTING,
  JOIN_PREVIEW_BODY_DETAIL,
  JOIN_PREVIEW_BODY_LEAD,
  JOIN_PREVIEW_CTA,
  JOIN_PREVIEW_GOOGLE_CTA,
  JOIN_PREVIEW_GOOGLE_NOTE,
  JOIN_PREVIEW_SIGN_IN_LABEL,
  joinLoggedInAs,
  joinPreviewTitle,
} from "@/lib/invitations/joinPreviewCopy";
import type { InvitationPreviewResult } from "@/types/invitation";

type JoinPreviewScreenProps = {
  preview: InvitationPreviewResult;
  token: string;
  onAuthChange: () => void;
};

function displayNameFromUser(user: {
  displayName: string | null;
  email: string | null;
}): string {
  const name = user.displayName?.trim();
  if (name) {
    return name;
  }
  if (user.email) {
    return user.email;
  }
  return "משתמש";
}

export function JoinPreviewScreen({
  preview,
  token,
  onAuthChange,
}: JoinPreviewScreenProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [signInPending, setSignInPending] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [acceptPending, setAcceptPending] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const acceptInFlightRef = useRef(false);

  const runAccept = useCallback(async () => {
    if (acceptInFlightRef.current) {
      return;
    }
    if (!token.trim()) {
      setAcceptError(JOIN_ERROR_MESSAGES.invalid);
      return;
    }

    acceptInFlightRef.current = true;
    setAcceptError(null);
    setAcceptPending(true);
    try {
      const result = await acceptInvitation(token);
      clearJoinIntent();
      router.push(`/app/cards/${result.cardId}`);
    } catch (err) {
      console.error("acceptInvitation failed:", err);
      acceptInFlightRef.current = false;
      setAcceptError(mapAcceptInvitationError(err));
    } finally {
      setAcceptPending(false);
    }
  }, [token, router]);

  useEffect(() => {
    if (!user || preview.status !== "valid" || !token.trim()) {
      return;
    }
    if (!consumeJoinIntentForToken(token)) {
      return;
    }
    queueMicrotask(() => {
      void runAccept();
    });
  }, [user, preview.status, token, runAccept]);

  const handleGoogleSignIn = useCallback(async () => {
    if (!token.trim()) {
      setAcceptError(JOIN_ERROR_MESSAGES.invalid);
      return;
    }

    setSignInError(null);
    setJoinIntent(token);
    setSignInPending(true);
    try {
      await signInWithGoogle();
      onAuthChange();
    } catch (err) {
      console.error("signInWithGoogle failed:", err);
      clearJoinIntent();
      setSignInError("לא הצלחנו להתחבר. נסה שוב.");
    } finally {
      setSignInPending(false);
    }
  }, [token, onAuthChange]);

  const handleAcceptClick = useCallback(() => {
    void runAccept();
  }, [runAccept]);

  if (preview.status !== "valid") {
    const message = JOIN_ERROR_MESSAGES[preview.status];
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="mb-8 text-sm leading-relaxed text-[var(--color-mist)]" role="alert">
          {message}
        </p>
        <Link
          href="/"
          className="inline-block rounded-full border border-[var(--color-glass-border)] px-6 py-3 text-sm text-[var(--color-pearl)] transition-colors hover:border-[var(--color-champagne)]"
        >
          חזרה לעמוד הראשי
        </Link>
      </div>
    );
  }

  const title = joinPreviewTitle(preview.inviterDisplayName);

  return (
    <div className="glass-card rounded-2xl p-8">
      <h1 className="mb-4 text-2xl font-medium leading-snug text-[var(--color-pearl)]">
        {title}
      </h1>
      <div className="mb-8 space-y-2">
        <p className="text-sm leading-relaxed text-[var(--color-mist)]">
          {JOIN_PREVIEW_BODY_LEAD}
        </p>
        <p className="text-xs leading-relaxed text-[var(--color-mist)]/70">
          {JOIN_PREVIEW_BODY_DETAIL}
        </p>
      </div>
      {user ? (
        <div
          className="rounded-xl border border-[var(--color-glass-border)] bg-[rgba(201,184,150,0.06)] p-5 ring-1 ring-inset ring-[var(--color-champagne)]/10"
          role="status"
        >
          <p className="mb-1 text-sm text-[var(--color-mist)]">
            {JOIN_LOGGED_IN_SECURE_LABEL}
          </p>
          <p className="mb-4 text-sm font-medium text-[var(--color-pearl)]">
            {joinLoggedInAs(displayNameFromUser(user))}
          </p>
          <button
            type="button"
            onClick={handleAcceptClick}
            disabled={acceptPending}
            className="w-full rounded-full border border-[var(--color-champagne)] bg-[rgba(201,184,150,0.14)] px-6 py-4 text-base font-medium text-[var(--color-pearl)] shadow-[0_4px_24px_rgba(201,184,150,0.12)] transition-[background-color,box-shadow] hover:bg-[rgba(201,184,150,0.2)] disabled:opacity-50"
          >
            {acceptPending ? JOIN_PREVIEW_ACCEPTING : JOIN_PREVIEW_CTA}
          </button>
          {acceptError ? (
            <p
              className="mt-3 text-center text-sm text-[var(--color-muted-rose)]"
              role="alert"
            >
              {acceptError}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-center text-sm text-[var(--color-mist)]">
            {JOIN_PREVIEW_SIGN_IN_LABEL}
          </p>
          <button
            type="button"
            onClick={() => void handleGoogleSignIn()}
            disabled={signInPending || acceptPending}
            className="w-full rounded-full border border-[var(--color-champagne)] bg-[rgba(201,184,150,0.14)] px-6 py-4 text-base font-medium text-[var(--color-pearl)] shadow-[0_4px_24px_rgba(201,184,150,0.12)] transition-[background-color,box-shadow] hover:bg-[rgba(201,184,150,0.2)] disabled:opacity-50"
          >
            {signInPending ? "מתחבר..." : JOIN_PREVIEW_GOOGLE_CTA}
          </button>
          <p className="text-center text-[11px] leading-relaxed text-[var(--color-mist)]/65">
            {JOIN_PREVIEW_GOOGLE_NOTE}
          </p>
          {signInError ? (
            <p
              className="text-center text-sm text-[var(--color-muted-rose)]"
              role="alert"
            >
              {signInError}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
