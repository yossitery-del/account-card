"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { LoadingVault } from "@/components/ui/LoadingVault";

/** / — מפנה ל-/app או /login לפי מצב Auth */
export function HomeRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/app" : "/login");
  }, [user, loading, router]);

  return <LoadingVault />;
}
