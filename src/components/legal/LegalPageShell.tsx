import type { ReactNode } from "react";
import Link from "next/link";
import { BrandMarkButton } from "@/components/brand/BrandMarkButton";
import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";

/** Needs legal review — תאריך עדכון וניסוח באנר */
export const LEGAL_LAST_UPDATED = "23 במאי 2026";

type LegalPageShellProps = {
  title: string;
  children: ReactNode;
};

export function LegalPageShell({ title, children }: LegalPageShellProps) {
  return (
    <main className="min-h-dvh px-4 py-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <BrandMarkButton />
          <Link
            href="/login"
            className="text-sm text-[var(--color-champagne)] transition-colors hover:text-[var(--color-champagne-hover)]"
          >
            חזרה
          </Link>
        </div>

        <article className="glass-card rounded-2xl p-6 sm:p-10">
          <p
            className="mb-8 rounded-xl border border-[var(--color-glass-border)] bg-[rgba(194,176,146,0.05)] px-4 py-3 text-sm leading-relaxed text-[var(--color-mist)]"
            role="note"
          >
            מסמך זה מנוסח לשלב הפיילוט הראשוני של השירות ויעודכן מעת לעת.
          </p>

          <header className="mb-8 border-b border-[var(--color-glass-border)] pb-6">
            <h1 className="text-2xl font-medium text-[var(--color-pearl)]">
              {title}
            </h1>
            <p className="mt-2 text-sm text-[var(--color-mist)]">
              עודכן לאחרונה: {LEGAL_LAST_UPDATED}
            </p>
          </header>

          <div className="legal-prose space-y-8 text-sm leading-relaxed text-[var(--color-mist)]">
            {children}
          </div>

          <footer className="mt-10 border-t border-[var(--color-glass-border)] pt-6">
            <LegalFooterLinks className="w-full" />
          </footer>
        </article>
      </div>
    </main>
  );
}
