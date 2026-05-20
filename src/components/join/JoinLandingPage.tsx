"use client";

import { FirebaseError } from "firebase/app";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BrandMarkButton } from "@/components/brand/BrandMarkButton";
import { JoinLandingShell } from "@/components/join/JoinLandingShell";
import { JoinPreviewScreen } from "@/components/join/JoinPreviewScreen";
import { LoadingVault } from "@/components/ui/LoadingVault";
import { loadingLabels } from "@/lib/ui/loadingLabels";
import { tokenFromInvitePath } from "@/lib/invitations/invitePaths";
import { getInvitationPreview } from "@/lib/invitations/getInvitationPreview";
import type { InvitationPreviewResult } from "@/types/invitation";

function joinLoadErrorMessage(err: unknown): string {
  if (process.env.NODE_ENV === "development" && err instanceof FirebaseError) {
    return `לא הצלחנו לטעון את ההזמנה (${err.code}). נסה שוב.`;
  }
  return "לא הצלחנו לטעון את ההזמנה. נסה שוב.";
}

/**
 * דף join אמיתי אחרי לחיצה — מובייל מלא, פרימיום.
 * (תצוגת OG נפרדת ב־opengraph-image.tsx לזחלנים בלבד.)
 */
export default function JoinLandingPage() {
  const params = useParams();
  const rawToken = typeof params.token === "string" ? params.token : "";
  const token = tokenFromInvitePath(rawToken);

  const [preview, setPreview] = useState<InvitationPreviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    if (!token) {
      setPreview({ status: "invalid" });
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);
    try {
      const data = await getInvitationPreview(token);
      setPreview(data);
    } catch (err) {
      setLoadError(joinLoadErrorMessage(err));
      setPreview(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadPreview();
    });
  }, [loadPreview]);

  return (
    <JoinLandingShell
      header={<BrandMarkButton align="center" className="mb-2" />}
    >
      {loading ? (
        <LoadingVault inline label={loadingLabels.default} />
      ) : loadError ? (
        <div className="join-hero-card rounded-2xl p-8 text-center">
          <p className="mb-6 text-sm text-[var(--color-muted-rose)]" role="alert">
            {loadError}
          </p>
          <button
            type="button"
            onClick={() => void loadPreview()}
            className="rounded-full border border-[var(--color-champagne)] px-6 py-3 text-sm text-[var(--color-pearl)]"
          >
            נסה שוב
          </button>
        </div>
      ) : preview ? (
        <JoinPreviewScreen
          preview={preview}
          token={token}
          onAuthChange={loadPreview}
        />
      ) : null}
    </JoinLandingShell>
  );
}
