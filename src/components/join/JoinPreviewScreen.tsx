"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ProcessingOverlay } from "@/components/ui/ProcessingOverlay";
import { loadingLabels } from "@/lib/ui/loadingLabels";
import { signInWithGoogle } from "@/lib/auth/google";
import { acceptInvitation } from "@/lib/invitations/acceptInvitation";
import {
  consumeJoinIntentForToken,
  setJoinIntent,
  clearJoinIntent,
} from "@/lib/invitations/joinIntent";
import { mapAcceptInvitationError } from "@/lib/invitations/joinAcceptErrors";
import {
  JOIN_DISPLAY_NAME_CONTINUE,
  JOIN_DISPLAY_NAME_HELPER,
  JOIN_DISPLAY_NAME_LABEL,
  JOIN_DISPLAY_NAME_PLACEHOLDER,
  JOIN_ERROR_MESSAGES,
  JOIN_LOGGED_IN_SECURE_LABEL,
  JOIN_PREVIEW_ACCEPTING,
  JOIN_PREVIEW_CTA,
  JOIN_PREVIEW_GOOGLE_CTA,
  JOIN_PREVIEW_GOOGLE_NOTE,
  JOIN_PREVIEW_MAIN_HEADLINE,
  JOIN_PREVIEW_SIGN_IN_LABEL,
  JOIN_PREVIEW_VALUE_PROSE,
  joinInviterSecondaryLine,
  joinLoggedInAs,
} from "@/lib/invitations/joinPreviewCopy";
import {
  isCleanDisplayName,
  suggestedDisplayNameFromAuth,
  validateDisplayNameInput,
} from "@/lib/users/displayNameQuality";
import type { InvitationPreviewResult } from "@/types/invitation";

type JoinPreviewScreenProps = {
  preview: InvitationPreviewResult;
  token: string;
  onAuthChange: () => void;
};

function joinSessionLabel(user: {
  displayName: string | null;
  email: string | null;
}): string {
  const clean = isCleanDisplayName(user.displayName)
    ? user.displayName!.trim()
    : null;
  if (clean) {
    return clean;
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
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const acceptInFlightRef = useRef(false);

  const needsDisplayNameStep = Boolean(
    user && !isCleanDisplayName(user.displayName)
  );

  const runAccept = useCallback(
    async (explicitDisplayName?: string) => {
      if (acceptInFlightRef.current) {
        return;
      }
      if (!token.trim()) {
        setAcceptError(JOIN_ERROR_MESSAGES.invalid);
        return;
      }

      const trimmedExplicit = explicitDisplayName?.trim();
      const tokenName = user?.displayName?.trim() ?? "";
      const resolvedName =
        trimmedExplicit ||
        (isCleanDisplayName(tokenName) ? tokenName : undefined);

      if (!resolvedName || !isCleanDisplayName(resolvedName)) {
        setDisplayNameError("נא להזין שם תצוגה תקין");
        return;
      }

      acceptInFlightRef.current = true;
      setAcceptError(null);
      setDisplayNameError(null);
      setAcceptPending(true);
      try {
        const result = await acceptInvitation(token, resolvedName);
        clearJoinIntent();
        router.push(`/app/cards/${result.cardId}`);
      } catch (err) {
        console.error("acceptInvitation failed:", err);
        acceptInFlightRef.current = false;
        setAcceptError(mapAcceptInvitationError(err));
      } finally {
        setAcceptPending(false);
      }
    },
    [token, router, user]
  );

  useEffect(() => {
    if (!user || preview.status !== "valid" || !token.trim()) {
      return;
    }
    if (!consumeJoinIntentForToken(token)) {
      return;
    }
    if (isCleanDisplayName(user.displayName)) {
      queueMicrotask(() => {
        void runAccept(user.displayName!.trim());
      });
    }
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
      <div className="join-hero-card rounded-2xl p-8 text-center">
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

  const inviterNote = joinInviterSecondaryLine(preview.inviterDisplayName);
  const joinBusy = acceptPending;

  return (
    <>
      <div className="join-hero-card rounded-2xl p-7 sm:p-8">
        <h1
          className={`text-[1.65rem] font-semibold leading-snug tracking-tight text-[var(--color-pearl)] sm:text-2xl ${
            inviterNote ? "mb-2" : "mb-4"
          }`}
        >
          {JOIN_PREVIEW_MAIN_HEADLINE}
        </h1>
        {inviterNote ? (
          <p className="mb-5 text-sm leading-relaxed text-[var(--color-champagne)]/85">
            {inviterNote}
          </p>
        ) : null}
        <div className="mb-8">
          <p className="text-sm leading-relaxed text-[var(--color-mist)]">
            {JOIN_PREVIEW_VALUE_PROSE}
          </p>
        </div>
        {user ? (
          needsDisplayNameStep ? (
            <JoinDisplayNameStep
              key={user.uid}
              user={user}
              acceptPending={acceptPending}
              displayNameError={displayNameError}
              acceptError={acceptError}
              onContinue={(name) => {
                const validationError = validateDisplayNameInput(name);
                if (validationError) {
                  setDisplayNameError(validationError);
                  return;
                }
                setDisplayNameError(null);
                void runAccept(name);
              }}
              onInputChange={() => setDisplayNameError(null)}
            />
          ) : (
            <div
              className="rounded-xl border border-[var(--color-glass-border)] bg-[rgba(201,184,150,0.06)] p-5 ring-1 ring-inset ring-[var(--color-champagne)]/10"
              role="status"
            >
              <p className="mb-1 text-sm text-[var(--color-mist)]">
                {JOIN_LOGGED_IN_SECURE_LABEL}
              </p>
              <p className="mb-4 text-sm font-medium text-[var(--color-pearl)]">
                {joinLoggedInAs(joinSessionLabel(user))}
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
          )
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
      <ProcessingOverlay visible={joinBusy} label={loadingLabels.joiningCard} />
    </>
  );
}

type JoinDisplayNameStepProps = {
  user: { displayName: string | null; email: string | null; uid: string };
  acceptPending: boolean;
  displayNameError: string | null;
  acceptError: string | null;
  onContinue: (name: string) => void;
  onInputChange: () => void;
};

function JoinDisplayNameStep({
  user,
  acceptPending,
  displayNameError,
  acceptError,
  onContinue,
  onInputChange,
}: JoinDisplayNameStepProps) {
  const [displayNameInput, setDisplayNameInput] = useState(() =>
    suggestedDisplayNameFromAuth(user.displayName)
  );

  return (
    <div className="space-y-4">
      <p className="mb-1 text-sm text-[var(--color-mist)]">
        {JOIN_LOGGED_IN_SECURE_LABEL}
      </p>
      <p className="text-sm font-medium text-[var(--color-pearl)]">
        {joinLoggedInAs(joinSessionLabel(user))}
      </p>
      <label className="block text-sm text-[var(--color-mist)]">
        {JOIN_DISPLAY_NAME_LABEL}
      </label>
      <input
        type="text"
        value={displayNameInput}
        onChange={(e) => {
          setDisplayNameInput(e.target.value);
          onInputChange();
        }}
        disabled={acceptPending}
        maxLength={80}
        autoFocus
        placeholder={JOIN_DISPLAY_NAME_PLACEHOLDER}
        className="w-full rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass-surface)] px-4 py-3 text-[var(--color-pearl)] outline-none focus:border-[var(--color-champagne)]"
      />
      <p className="text-xs leading-relaxed text-[var(--color-mist)]">
        {JOIN_DISPLAY_NAME_HELPER}
      </p>
      {displayNameError ? (
        <p className="text-sm text-[var(--color-muted-rose)]" role="alert">
          {displayNameError}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => onContinue(displayNameInput)}
        disabled={acceptPending}
        className="w-full rounded-full border border-[var(--color-champagne)] bg-[rgba(201,184,150,0.14)] px-6 py-4 text-base font-medium text-[var(--color-pearl)] shadow-[0_4px_24px_rgba(201,184,150,0.12)] transition-[background-color,box-shadow] hover:bg-[rgba(201,184,150,0.2)] disabled:opacity-50"
      >
        {acceptPending ? JOIN_PREVIEW_ACCEPTING : JOIN_DISPLAY_NAME_CONTINUE}
      </button>
      {acceptError ? (
        <p
          className="text-center text-sm text-[var(--color-muted-rose)]"
          role="alert"
        >
          {acceptError}
        </p>
      ) : null}
    </div>
  );
}
