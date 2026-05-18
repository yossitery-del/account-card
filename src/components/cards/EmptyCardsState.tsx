import Link from "next/link";

export function EmptyCardsState() {
  return (
    <div className="glass-card rounded-2xl p-8 text-center">
      <p className="mb-2 text-lg text-[var(--color-pearl)]">
        עדיין אין כרטיסים
      </p>
      <p className="mb-6 text-sm leading-relaxed text-[var(--color-mist)]">
        פתח כרטיס חשבון ראשון כדי להתחיל חשבון משותף מסודר.
      </p>
      <Link
        href="/app/cards/new"
        className="inline-block rounded-full border border-[var(--color-champagne)] px-6 py-3 text-sm text-[var(--color-pearl)] transition-colors hover:border-[var(--color-champagne-hover)] hover:text-[var(--color-champagne-hover)]"
      >
        כרטיס חדש
      </Link>
    </div>
  );
}
