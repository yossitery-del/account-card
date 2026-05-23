import Link from "next/link";
import { DASHBOARD_NEW_CARD_INDEPENDENCE_HINT } from "@/lib/cards/dashboardCopy";

export function EmptyCardsState() {
  return (
    <div className="glass-card rounded-2xl p-8 text-center">
      <p className="mb-2 text-lg text-[var(--color-pearl)]">
        פתח כרטיס חשבון ראשון
      </p>
      <p className="mb-4 text-sm leading-relaxed text-[var(--color-mist)]">
        כרטיס חשבון הוא מקום משותף לתיעוד חיובים והחזרים, עם אישור ברור של שני הצדדים.
      </p>
      <p className="mb-6 text-xs leading-relaxed text-[var(--color-mist)]/85">
        {DASHBOARD_NEW_CARD_INDEPENDENCE_HINT}
      </p>
      <Link
        href="/app/cards/new"
        className="inline-block rounded-full border border-[var(--color-champagne)] px-6 py-3 text-sm text-[var(--color-pearl)] transition-colors hover:border-[var(--color-champagne-hover)] hover:text-[var(--color-champagne-hover)]"
      >
        פתח כרטיס חשבון
      </Link>
    </div>
  );
}
