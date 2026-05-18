import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";

/** פעולות חשבון — לא מתחרות עם סטטוס המרכז */
export function DashboardToolbar() {
  return (
    <header className="mb-5 flex items-center justify-end gap-3">
      <Link
        href="/app/cards/new"
        className="min-h-10 rounded-full border border-[var(--color-vault-border-metallic)] px-4 py-2 text-sm text-[var(--color-mist)] transition-colors hover:border-[var(--color-champagne)]/32 hover:text-[var(--color-pearl)]"
      >
        כרטיס חדש
      </Link>
      <SignOutButton variant="subtle" />
    </header>
  );
}
