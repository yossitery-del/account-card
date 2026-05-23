import type { ReactNode } from "react";
import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";
import { JOIN_LANDING_TRUST_LINE } from "@/lib/invitations/joinPreviewCopy";

type JoinLandingShellProps = {
  header: ReactNode;
  children: ReactNode;
};

/**
 * מעטפת מלאת מסך לדף join אחרי לחיצה על הקישור — לא תצוגת OG.
 */
export function JoinLandingShell({ header, children }: JoinLandingShellProps) {
  return (
    <main className="join-landing vault-bg relative flex min-h-dvh flex-col overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_50%_at_50%_-5%,rgba(194,176,146,0.09),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-[radial-gradient(ellipse_80%_70%_at_50%_100%,rgba(28,29,25,0.85),transparent)]"
      />
      <div className="relative z-10 flex min-h-dvh flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6">
        <div className="shrink-0">{header}</div>
        <div className="flex flex-1 flex-col justify-center py-6">
          <div className="mx-auto w-full max-w-lg">{children}</div>
        </div>
        <footer className="shrink-0 space-y-2 text-center">
          <p className="text-[11px] leading-relaxed text-[var(--color-mist)]/60">
            {JOIN_LANDING_TRUST_LINE}
          </p>
          <LegalFooterLinks className="text-[11px] text-[var(--color-mist)]/70" />
        </footer>
      </div>
    </main>
  );
}
