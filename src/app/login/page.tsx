import { APP_NAME } from "@/lib/constants/app";
import { LoginRedirect } from "@/components/auth/LoginRedirect";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { LoginAuthMessage } from "@/components/auth/LoginAuthMessage";

export default function LoginPage() {
  return (
    <LoginRedirect>
      <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-16">
        <div className="glass-card w-full max-w-md rounded-2xl p-10 text-center">
          <p className="mb-2 text-sm tracking-wide text-[var(--color-champagne)]">
            פנקס בתוך כספת
          </p>
          <h1 className="mb-3 text-3xl font-medium text-[var(--color-pearl)]">
            {APP_NAME}
          </h1>
          <p className="mb-8 text-base text-[var(--color-mist)]">
            פנקס משותף — תיעוד והסכמה
          </p>

          <LoginAuthMessage />
          <GoogleSignInButton />

          <p className="mt-8 text-xs leading-relaxed text-[var(--color-mist)] opacity-90">
            המידע נשמר בתשתית מאובטחת, עם גישה רק למשתתפים הפעילים בכרטיס.
          </p>
        </div>
      </main>
    </LoginRedirect>
  );
}
