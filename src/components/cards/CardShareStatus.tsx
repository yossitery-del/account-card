import Link from "next/link";

type CardShareStatusProps = {
  cardId: string;
  activeParticipantsCount: number;
  canInvite: boolean;
};

export function CardShareStatus({
  cardId,
  activeParticipantsCount,
  canInvite,
}: CardShareStatusProps) {
  const isConnected = activeParticipantsCount >= 2;

  if (isConnected) {
    return (
      <p
        className="flex flex-wrap items-center gap-x-2 gap-y-0.5 border-t border-[var(--color-glass-border)]/35 pt-2.5 text-[11px] leading-snug text-[var(--color-mist)]"
        role="status"
      >
        <span className="inline-flex items-center gap-1 text-[var(--color-champagne)]/90">
          <span
            className="h-1 w-1 shrink-0 rounded-full bg-[var(--color-vault-gold-green)]"
            aria-hidden
          />
          מחובר
        </span>
        <span className="text-[var(--color-mist)]/40" aria-hidden>
          ·
        </span>
        <span>שני הצדדים רואים את אותו כרטיס, תמיד מעודכן.</span>
      </p>
    );
  }

  if (!canInvite) {
    return null;
  }

  return (
    <div
      className="vault-status-surface mt-2 rounded-lg px-3.5 py-3 backdrop-blur-sm"
      aria-labelledby="share-card-heading"
    >
      <h3
        id="share-card-heading"
        className="mb-1 text-sm font-medium text-[var(--color-pearl)]"
      >
        שתפו את הכרטיס
      </h3>
      <p className="mb-3 max-w-prose text-xs leading-relaxed text-[var(--color-mist)]">
        כשהצד השני מצטרף, שניכם רואים את אותו כרטיס — ברור, מסודר, ומתעדכן באישור
        משותף.
      </p>
      <Link
        href={`/app/cards/${cardId}/invite`}
        className="block w-full rounded-lg border border-[var(--color-champagne)]/35 bg-[rgba(201,184,150,0.1)] px-4 py-2.5 text-center text-sm font-medium text-[var(--color-pearl)] transition hover:border-[var(--color-champagne)]/50 hover:bg-[rgba(201,184,150,0.16)]"
      >
        שליחת הזמנה
      </Link>
    </div>
  );
}
