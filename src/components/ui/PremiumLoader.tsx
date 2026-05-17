type PremiumLoaderProps = {
  label: string;
  className?: string;
};

/** ספינר + תווית — שפה ויזואלית משותפת עם ProcessingOverlay */
export function PremiumLoader({ label, className = "" }: PremiumLoaderProps) {
  return (
    <div
      className={`flex flex-col items-center gap-4 rounded-2xl border border-[var(--color-glass-border)]/60 bg-[rgba(18,20,28,0.92)] px-10 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)] ${className}`}
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
  );
}
