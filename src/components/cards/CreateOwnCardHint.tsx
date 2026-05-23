import Link from "next/link";
import { createOwnCardHintCopy } from "@/lib/cards/dashboardCopy";

/** עידוד עדין לפתיחת כרטיס עצמאי — למשתמש שהצטרף להזמנה ועדיין לא יצר כרטיס */
export function CreateOwnCardHint() {
  return (
    <aside
      className="mb-5 rounded-2xl border border-[var(--color-glass-border)] bg-[rgba(194,176,146,0.04)] px-4 py-4 sm:px-5"
      aria-labelledby="create-own-card-hint-title"
    >
      <h2
        id="create-own-card-hint-title"
        className="mb-1.5 text-sm font-medium text-[var(--color-pearl)]"
      >
        {createOwnCardHintCopy.title}
      </h2>
      <p className="mb-4 text-xs leading-relaxed text-[var(--color-mist)]">
        {createOwnCardHintCopy.body}
      </p>
      <Link
        href="/app/cards/new"
        className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--color-champagne)]/55 bg-[rgba(201,184,150,0.08)] px-5 py-2.5 text-sm text-[var(--color-pearl)] transition-colors hover:border-[var(--color-champagne)] hover:bg-[rgba(201,184,150,0.14)]"
      >
        {createOwnCardHintCopy.cta}
      </Link>
    </aside>
  );
}
