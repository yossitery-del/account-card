"use client";

import { useAuth } from "@/components/auth/AuthProvider";

export function LoginAuthMessage() {
  const { error } = useAuth();

  if (!error) return null;

  return (
    <p
      className="mb-4 text-sm text-[var(--color-muted-rose)]"
      role="alert"
    >
      {error}
    </p>
  );
}
