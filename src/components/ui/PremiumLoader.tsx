type PremiumLoaderProps = {
  label: string;
  className?: string;
};

/** ספינר + תווית — שפה ויזואלית משותפת עם ProcessingOverlay */
export function PremiumLoader({ label, className = "" }: PremiumLoaderProps) {
  return (
    <div
      className={`vault-loader-panel flex flex-col items-center gap-4 rounded-2xl px-10 py-8 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <div className="relative h-11 w-11" aria-hidden>
        <span className="absolute inset-0 rounded-full border-2 border-[var(--color-champagne)]/22" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[var(--color-vault-gold-green)]" />
        <span className="absolute inset-[6px] rounded-full bg-[var(--color-champagne)]/12" />
      </div>
      <p className="text-sm font-medium tracking-wide text-[var(--color-pearl)]">
        {label}
      </p>
    </div>
  );
}
