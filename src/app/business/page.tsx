import type { Metadata } from "next";
import Link from "next/link";
import { BrandMarkButton } from "@/components/brand/BrandMarkButton";
import { LegalFooterLinks } from "@/components/legal/LegalFooterLinks";

const businessDescription =
  "התחשבנות ברורה מול לקוחות וספקים — חיובים, זיכויים ואישור של שני הצדדים במקום אחד.";

const businessOgImage = {
  url: "/og/business.png",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: "כרטיס חשבון לעסק — התחשבנות ברורה מול לקוחות וספקים",
};

export const metadata: Metadata = {
  metadataBase: new URL(
    (process.env.NEXT_PUBLIC_APP_URL ?? "https://account-card-prod.vercel.app")
      .trim()
      .replace(/\/$/, "")
  ),
  title: "כרטיס חשבון לעסק",
  description: businessDescription,
  openGraph: {
    title: "כרטיס חשבון לעסק",
    description: businessDescription,
    type: "website",
    locale: "he_IL",
    url: "/business",
    images: [businessOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "כרטיס חשבון לעסק",
    description: businessDescription,
    images: [businessOgImage],
  },
};

const valueCards = [
  {
    title: "פחות הודעות מפוזרות",
    body: "כל חיוב, החזר וזיכוי נמצאים במקום אחד, במקום להיעלם בין וואטסאפים, פתקים וזיכרון.",
  },
  {
    title: "אישור של שני הצדדים",
    body: "לא רק “רשמתי לעצמי” — הצד השני רואה, מאשר, ולשניכם יש תיעוד מוסכם.",
  },
  {
    title: "מתאים לעסק קטן",
    body: "לקוחות, ספקים, שותפים או כל מי שיש איתו חשבון פתוח.",
  },
];

const steps = [
  "פותחים כרטיס משותף מול לקוח או ספק",
  "מוסיפים חיוב, החזר או זיכוי",
  "הצד השני מאשר",
  "הכרטיס מציג יתרה מתעדכנת וברורה לשני הצדדים",
];

export default function BusinessPage() {
  return (
    <main className="vault-bg relative min-h-dvh overflow-x-hidden px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_48%_at_50%_-6%,rgba(194,176,146,0.1),transparent_58%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-[radial-gradient(ellipse_80%_70%_at_50%_100%,rgba(28,29,25,0.82),transparent)]"
      />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-3xl flex-col">
        <header className="flex items-center justify-between gap-3 py-3">
          <BrandMarkButton />
          <Link
            href="/login"
            className="inline-flex min-h-10 items-center rounded-full border border-[var(--color-vault-border-metallic)] px-4 py-2 text-sm text-[var(--color-mist)] transition-colors hover:border-[var(--color-champagne)]/35 hover:text-[var(--color-pearl)]"
          >
            כניסה
          </Link>
        </header>

        <section className="py-8 sm:py-12">
          <div className="join-hero-card rounded-2xl p-7 sm:p-10">
            <p className="mb-5 text-sm font-medium text-[var(--color-champagne)]">
              פנקס משותף לעסק קטן
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-[var(--color-pearl)] sm:text-5xl">
              התחשבנות מול לקוחות וספקים — בלי בלגן
            </h1>
            <p className="mt-5 text-lg leading-8 text-[var(--color-mist)]">
              כרטיס חשבון הוא פנקס דיגיטלי משותף: צד אחד מוסיף חיוב, החזר או
              זיכוי, הצד השני מאשר, והיתרה מתעדכנת לשניכם במקום אחד ברור.
            </p>
            <p className="mt-4 text-base leading-7 text-[var(--color-mist)]/86">
              המערכת מחשבת את היתרה בכל רגע: חיובים, החזרים וזיכויים מתקזזים
              לכרטיס אחד ברור.
            </p>
            <div className="mt-8">
              <p className="mb-3 text-sm font-medium text-[var(--color-champagne)]">
                התחל לסדר את החשבונות שלך במקום אחד.
              </p>
              <Link
                href="/login"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[var(--color-champagne)] bg-[rgba(201,184,150,0.14)] px-7 py-3.5 text-base font-semibold text-[var(--color-pearl)] shadow-[0_4px_24px_rgba(201,184,150,0.12)] transition-colors hover:bg-[rgba(201,184,150,0.2)] sm:w-auto"
              >
                פתח כרטיס ראשון
              </Link>
            </div>
          </div>
        </section>

        <section
          className="grid gap-3 sm:grid-cols-3"
          aria-label="למה זה עוזר"
        >
          {valueCards.map((card) => (
            <article key={card.title} className="glass-card rounded-2xl p-5">
              <h2 className="text-base font-semibold text-[var(--color-pearl)]">
                {card.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--color-mist)]">
                {card.body}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-[1.05fr_0.95fr]">
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-2xl font-semibold text-[var(--color-pearl)]">
              איך זה עובד בפועל?
            </h2>
            <ol className="mt-5 space-y-3">
              {steps.map((step, index) => (
                <li key={step} className="flex gap-3 text-[var(--color-mist)]">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--color-champagne)]/32 bg-[rgba(201,184,150,0.08)] text-sm font-semibold text-[var(--color-champagne)]">
                    {index + 1}
                  </span>
                  <span className="pt-0.5 text-sm leading-6">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-2xl font-semibold text-[var(--color-pearl)]">
              דוגמה פשוטה
            </h2>
            <p className="mt-4 text-base leading-7 text-[var(--color-mist)]">
              לקוח חייב 320 ₪ → נוסף זיכוי של 120 ₪ → היתרה מתעדכנת ל־200 ₪,
              עם תיעוד ואישור.
            </p>
          </div>
        </section>

        <section className="py-8 sm:py-10">
          <div className="join-hero-card rounded-2xl p-7 text-center sm:p-9">
            <h2 className="text-2xl font-semibold text-[var(--color-pearl)]">
              רוצה לעשות סדר בהתחשבנות?
            </h2>
            <Link
              href="/login"
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[var(--color-champagne)] bg-[rgba(201,184,150,0.14)] px-7 py-3.5 text-base font-semibold text-[var(--color-pearl)] transition-colors hover:bg-[rgba(201,184,150,0.2)] sm:w-auto"
            >
              פתח כרטיס ראשון
            </Link>
            <p className="mt-3 text-sm text-[var(--color-mist)]/78">
              מתאים להתחלה מול לקוח, ספק או כל מי שיש איתו חשבון פתוח.
            </p>
          </div>
        </section>

        <footer className="pb-4 text-center">
          <LegalFooterLinks className="text-[11px] text-[var(--color-mist)]/70" />
        </footer>
      </div>
    </main>
  );
}
