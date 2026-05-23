import { BrandMarkButton } from "@/components/brand/BrandMarkButton";
import { LoginRedirect } from "@/components/auth/LoginRedirect";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { LoginAuthMessage } from "@/components/auth/LoginAuthMessage";
import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";

export default function LoginPage() {
  return (
    <LoginRedirect>
      <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-16">
        <div className="glass-card w-full max-w-md rounded-2xl p-10 text-center">
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
      </main>
    </LoginRedirect>
  );
}
