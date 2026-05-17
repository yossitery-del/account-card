"use client";

type ProcessingOverlayProps = {
  visible: boolean;
  label?: string;
};

/**
 * Full-screen mutation feedback — perceived speed only; does not replace data refresh.
 */
export function ProcessingOverlay({
  visible,
  label = "מעדכן…",
}: ProcessingOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex cursor-wait items-center justify-center bg-slate-950/70 backdrop-blur-sm pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
      role="presentation"
    >
      <div
        className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--color-glass-border)]/60 bg-[rgba(18,20,28,0.92)] px-10 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={label}
      >
        <div className="relative h-11 w-11" aria-hidden>
          <span className="absolute inset-0 rounded-full border-2 border-[var(--color-champagne)]/20" />
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[var(--color-champagne)]" />
          <span className="absolute inset-[6px] animate-pulse rounded-full bg-[var(--color-champagne)]/15" />
        </div>
        <p className="text-sm font-medium tracking-wide text-[var(--color-pearl)]">
          {label}
        </p>
      </div>
    </div>
  );
}
