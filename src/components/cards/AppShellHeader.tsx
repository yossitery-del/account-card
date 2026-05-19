import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { BrandMarkButton } from "@/components/brand/BrandMarkButton";

type AppShellHeaderProps = {
  title: string;
  showNewCard?: boolean;
  backHref?: string;
  /** תווית לכפתור חזרה — ברירת מחדל: חזרה */
  backLabel?: string;
};

export function AppShellHeader({
  title,
  showNewCard = false,
  backHref,
  backLabel = "חזרה",
}: AppShellHeaderProps) {
  const isNested = Boolean(backHref);

  if (isNested) {
    return (
      <header className="relative mb-8 pt-[max(0px,calc(env(safe-area-inset-top,0px)-1.25rem))] sm:pt-0">
        <div className="mb-5 flex items-center justify-between gap-3">
          <BrandMarkButton />
          <SignOutButton variant="subtle" />
        </div>

        <Link
          href={backHref!}
          className="mb-5 inline-flex items-center gap-2 rounded-xl border border-[var(--color-champagne)]/50 bg-[var(--color-glass-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-champagne)] shadow-[0_0_24px_rgba(201,184,150,0.08)] transition-colors hover:border-[var(--color-champagne)] hover:bg-[rgba(201,184,150,0.1)]"
        >
          <span aria-hidden className="text-base leading-none">
            →
          </span>
          {backLabel}
        </Link>

        <h1 className="text-2xl font-medium text-[var(--color-pearl)]">
          {title}
        </h1>
      </header>
    );
  }

  return (
    <header className="mb-8 flex flex-col gap-4 pt-[max(0px,calc(env(safe-area-inset-top,0px)-1.25rem))] sm:flex-row sm:items-center sm:justify-between sm:pt-0">
      <div>
        <BrandMarkButton className="mb-5" />
        <h1 className="text-2xl font-medium text-[var(--color-pearl)]">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        {showNewCard ? (
          <Link
            href="/app/cards/new"
            className="rounded-full border border-[var(--color-champagne)] px-5 py-2.5 text-sm font-medium text-[var(--color-pearl)] transition-colors hover:border-[var(--color-champagne-hover)] hover:bg-[rgba(201,184,150,0.08)]"
          >
            כרטיס חדש
          </Link>
        ) : null}
        <SignOutButton variant="default" />
      </div>
    </header>
  );
}
