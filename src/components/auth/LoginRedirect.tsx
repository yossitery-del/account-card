"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

/**
 * מפנה משתמש מחובר ל-/app — רק ב-useEffect.
 * תמיד מחזיר children כדי למנוע hydration mismatch.
 */
export function LoginRedirect({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/app");
    }
  }, [user, loading, router]);

  return <>{children}</>;
}
