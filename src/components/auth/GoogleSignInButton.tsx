"use client";

import { useState } from "react";
import { signInWithGoogle } from "@/lib/auth/google";
import { useAuth } from "@/components/auth/AuthProvider";

export function GoogleSignInButton() {
  const { clearError, loading: authLoading } = useAuth();
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSignIn() {
    setLocalError(null);
    clearError();
    setPending(true);

    try {
      await signInWithGoogle();
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: string }).code)
          : "";

      if (code === "auth/popup-closed-by-user") {
        setLocalError(null);
      } else {
        setLocalError("לא הצלחנו להתחבר. נסה שוב.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleSignIn}
        disabled={pending || authLoading}
        className="w-full rounded-full border border-[var(--color-champagne)] bg-[var(--color-glass-surface)] px-6 py-3.5 text-base font-medium text-[var(--color-pearl)] transition-colors hover:bg-[rgba(201,184,150,0.12)] hover:text-[var(--color-champagne-hover)] disabled:opacity-50"
      >
        {pending ? "מתחבר..." : "התחברות עם Google"}
      </button>
      {localError ? (
        <p className="mt-3 text-sm text-[var(--color-muted-rose)]" role="alert">
          {localError}
        </p>
      ) : null}
    </div>
  );
}

