"use client";

import { useAuth } from "@/components/auth/AuthProvider";

const isDev = process.env.NODE_ENV === "development";

/**
 * זיהוי משתמש מחובר — development בלבד (למניעת בלבול A/B בבדיקות).
 * לא מציג UID.
 */
export function DevAuthIdentity() {
  const { user } = useAuth();

  if (!isDev || !user) {
    return null;
  }

  const displayName = user.displayName?.trim() || "ללא שם תצוגה";
  const email = user.email ?? "ללא אימייל";

  return (
    <p
      className="mb-3 border-b border-dashed border-[var(--color-glass-border)]/50 pb-2 text-center text-[11px] text-[var(--color-mist)]/80"
      aria-label="זיהוי משתמש לפיתוח"
    >
      מחובר כ־{displayName} · {email}
    </p>
  );
}
