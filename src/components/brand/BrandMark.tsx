import { APP_NAME } from "@/lib/constants/app";

type BrandMarkProps = {
  className?: string;
  align?: "start" | "center";
  size?: "compact" | "hero";
};

export function BrandMark({
  className = "",
  align = "start",
  size = "compact",
}: BrandMarkProps) {
  const isHero = size === "hero";

  return (
    <div
      className={`inline-flex items-center gap-2.5 ${
        align === "center" ? "justify-center" : "justify-start"
      } ${className}`}
      aria-label={APP_NAME}
    >
      <span
        className={`relative inline-flex shrink-0 items-center justify-center rounded-xl border border-[var(--color-champagne)]/28 bg-[rgba(201,184,150,0.075)] shadow-[inset_0_1px_0_rgba(194,176,146,0.12)] ${
          isHero ? "h-12 w-12" : "h-8 w-8"
        }`}
        aria-hidden
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className={isHero ? "h-8 w-8" : "h-5 w-5"}
        >
          <rect
            x="7"
            y="6"
            width="18"
            height="20"
            rx="4"
            stroke="currentColor"
            strokeWidth="1.7"
            className="text-[var(--color-champagne)]"
          />
          <path
            d="M11 12.5h10M11 17h7"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            className="text-[var(--color-mist)]"
          />
          <path
            d="M21.5 20.5l2 2 3.5-4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--color-vault-gold-green)]"
          />
        </svg>
      </span>
      <span className="min-w-0 text-start">
        <span
          className={`block whitespace-nowrap font-semibold leading-none tracking-tight text-[var(--color-pearl)] ${
            isHero ? "text-2xl" : "text-sm"
          }`}
        >
          {APP_NAME}
        </span>
        {isHero ? (
          <span className="mt-2 block text-sm leading-relaxed text-[var(--color-mist)]">
            חשבון משותף. ברור. מאושר על ידי שני הצדדים.
          </span>
        ) : null}
      </span>
    </div>
  );
}
