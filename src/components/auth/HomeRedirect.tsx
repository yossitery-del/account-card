"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { LoadingVault } from "@/components/ui/LoadingVault";
import { loadingLabels } from "@/lib/ui/loadingLabels";

/** / — מפנה ל-/app או /login לפי מצב Auth */
export function HomeRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/app" : "/login");
  }, [user, loading, router]);

  return <LoadingVault label={loadingLabels.account} />;
}
