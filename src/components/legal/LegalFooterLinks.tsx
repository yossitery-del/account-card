import Link from "next/link";

type LegalFooterLinksProps = {
  className?: string;
};

/** קישורים לתנאי שימוש ומדיניות פרטיות — לשימוש ב-login, join ופוטר */
export function LegalFooterLinks({ className = "" }: LegalFooterLinksProps) {
  const linkClass =
    "text-[var(--color-champagne)] underline-offset-2 transition-colors visited:text-[var(--color-champagne)] hover:text-[var(--color-champagne-hover)] hover:underline";

  return (
    <nav
      className={`inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs ${className}`}
      aria-label="מסמכים משפטיים"
    >
      <Link href="/terms" className={linkClass}>
        תנאי שימוש
      </Link>
      <span className="text-[var(--color-mist)]/50" aria-hidden>
        ·
      </span>
      <Link href="/privacy" className={linkClass}>
        מדיניות פרטיות
      </Link>
    </nav>
  );
}
