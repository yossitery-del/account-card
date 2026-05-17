"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { LoadingVault } from "@/components/ui/LoadingVault";
import { loadingLabels } from "@/lib/ui/loadingLabels";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <LoadingVault label={loadingLabels.account} />;
  }

  return <>{children}</>;
}
