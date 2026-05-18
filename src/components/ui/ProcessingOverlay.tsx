"use client";

import { loadingLabels } from "@/lib/ui/loadingLabels";
import { PremiumLoader } from "@/components/ui/PremiumLoader";

type ProcessingOverlayProps = {
  visible: boolean;
  label?: string;
};

/**
 * Full-screen mutation / page-load feedback — perceived speed only; does not replace data refresh.
 */
export function ProcessingOverlay({
  visible,
  label = loadingLabels.updating,
}: ProcessingOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      className="vault-overlay-scrim fixed inset-0 z-[100] flex cursor-wait items-center justify-center backdrop-blur-sm pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
      role="presentation"
    >
      <PremiumLoader label={label} />
    </div>
  );
}
