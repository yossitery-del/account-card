import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { BrandMarkButton } from "@/components/brand/BrandMarkButton";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";

/** פעולות חשבון — לא מתחרות עם סטטוס המרכז */
export function DashboardToolbar() {
  return (
    <>
      <header className="mb-7 flex items-center justify-between gap-2">
        <BrandMarkButton />
        <div className="flex shrink-0 items-center gap-2">
          <InstallAppButton compact />
          <Link
            href="/app/cards/new"
            className="min-h-10 rounded-full border border-[var(--color-vault-border-metallic)] px-3 py-2 text-sm text-[var(--color-mist)] transition-colors hover:border-[var(--color-champagne)]/32 hover:text-[var(--color-pearl)] sm:px-4"
          >
            כרטיס חדש
          </Link>
          <SignOutButton variant="subtle" />
        </div>
      </header>
    </>
  );
}
