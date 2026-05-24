"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ProcessingOverlay } from "@/components/ui/ProcessingOverlay";
import {
  createAccountCard,
  validateCardTitle,
} from "@/lib/cards/createAccountCard";
import { loadingLabels } from "@/lib/ui/loadingLabels";
import {
  isCleanDisplayName,
  suggestedDisplayNameFromAuth,
  validateDisplayNameInput,
} from "@/lib/users/displayNameQuality";

export function CreateCardForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const needsDisplayName = Boolean(
    user && !isCleanDisplayName(user.displayName)
  );
  const [displayName, setDisplayName] = useState(() =>
    suggestedDisplayNameFromAuth(user?.displayName)
  );
  const [displayNameTouched, setDisplayNameTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (displayNameTouched) {
      return;
    }
    setDisplayName(suggestedDisplayNameFromAuth(user?.displayName));
  }, [displayNameTouched, user?.displayName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validateCardTitle(title);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!user) {
      setError("נדרשת התחברות");
      return;
    }

    const cleanDisplayName = needsDisplayName
      ? displayName.trim()
      : user.displayName?.trim();
    if (needsDisplayName) {
      const displayNameError = validateDisplayNameInput(cleanDisplayName ?? "");
      if (displayNameError) {
        setError(displayNameError);
        return;
      }
    }

    setPending(true);
    try {
      const cardId = await createAccountCard(user, title, cleanDisplayName);
      router.replace(`/app/cards/${cardId}`);
    } catch (err) {
      console.error("createAccountCard failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "לא הצלחנו ליצור את הכרטיס. נסה שוב."
      );
      setPending(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8">
        <label className="mb-2 block text-sm text-[var(--color-mist)]">
          מול מי הכרטיס?
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={pending}
          maxLength={200}
          autoFocus
          className="mb-2 w-full rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass-surface)] px-4 py-3 text-[var(--color-pearl)] outline-none focus:border-[var(--color-champagne)]"
          placeholder="לדוגמה: שמעון כהן, חברת אלפא, ספק קבוע"
        />
        <p className="mb-4 text-xs leading-relaxed text-[var(--color-mist)]">
          זה השם שיופיע אצלך בדשבורד.
        </p>
        {needsDisplayName ? (
          <>
            <label className="mb-2 block text-sm text-[var(--color-mist)]">
              איך תרצה שהשם שלך יופיע לצד השני?
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => {
                setDisplayNameTouched(true);
                setDisplayName(e.target.value);
              }}
              disabled={pending}
              maxLength={80}
              className="mb-2 w-full rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass-surface)] px-4 py-3 text-[var(--color-pearl)] outline-none focus:border-[var(--color-champagne)]"
              placeholder="לדוגמה: יוסי טיירי / מהדרין תשמישי קדושה"
            />
            <p className="mb-4 text-xs leading-relaxed text-[var(--color-mist)]">
              זה השם שיופיע בכרטיס אצל הצד השני.
            </p>
          </>
        ) : null}
        <p className="mb-6 text-xs text-[var(--color-mist)]">מטבע: שקל (₪)</p>
        {error ? (
          <p className="mb-4 text-sm text-[var(--color-muted-rose)]" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full border border-[var(--color-champagne)] bg-[var(--color-glass-surface)] px-6 py-3.5 text-base font-medium text-[var(--color-pearl)] transition-colors hover:bg-[rgba(201,184,150,0.12)] disabled:opacity-50"
        >
          {pending ? loadingLabels.creatingCard : "פתח כרטיס חשבון"}
        </button>
      </form>
      <ProcessingOverlay visible={pending} label={loadingLabels.creatingCard} />
    </>
  );
}
