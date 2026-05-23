import { BrandMarkButton } from "@/components/brand/BrandMarkButton";
import { LoginRedirect } from "@/components/auth/LoginRedirect";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { LoginAuthMessage } from "@/components/auth/LoginAuthMessage";
import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";

export default function LoginPage() {
  return (
    <LoginRedirect>
      <main className="vault-bg relative flex min-h-dvh flex-col items-center justify-center overflow-x-hidden px-4 py-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_50%_at_50%_-5%,rgba(194,176,146,0.09),transparent_55%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-[radial-gradient(ellipse_80%_70%_at_50%_100%,rgba(28,29,25,0.85),transparent)]"
        />
        <div className="relative z-10 w-full max-w-md">
        <div className="join-hero-card rounded-2xl p-8 text-center sm:p-10">
          <p className="mb-5 text-sm tracking-wide text-[var(--color-champagne)]">
            פנקס בתוך כספת
          </p>
          <BrandMarkButton align="center" size="hero" className="mb-8" />

          <LoginAuthMessage />
          <GoogleSignInButton />

          <p className="mt-8 text-xs leading-relaxed text-[var(--color-mist)] opacity-90">
            המידע נשמר בתשתית מאובטחת, עם גישה רק למשתתפים הפעילים בכרטיס.
          </p>

          <LegalFooterLinks className="mt-4 w-full" />
        </div>
        </div>
      </main>
    </LoginRedirect>
  );
}
