"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOutUser } from "@/lib/auth/google";

type SignOutButtonProps = {
  /** subtle — קישור קטן בפינה; default — כפתור מלא (דשבורד) */
  variant?: "default" | "subtle";
};

export function SignOutButton({ variant = "default" }: SignOutButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    try {
      await signOutUser();
      router.replace("/login");
    } catch {
      setPending(false);
    }
  }

  if (variant === "subtle") {
    return (
      <button
        type="button"
        onClick={handleSignOut}
        disabled={pending}
        className="text-xs text-[var(--color-mist)] underline-offset-2 transition-colors hover:text-[var(--color-muted-rose)] hover:underline disabled:opacity-50"
      >
        {pending ? "יוצא..." : "יציאה"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      className="rounded-full border border-[var(--color-glass-border)] bg-[var(--color-glass-surface)] px-5 py-2 text-sm text-[var(--color-mist)] transition-colors hover:border-[var(--color-glass-border)] hover:text-[var(--color-pearl)] disabled:opacity-50"
    >
      {pending ? "יוצא..." : "יציאה"}
    </button>
  );
}
