"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ProcessingOverlay } from "@/components/ui/ProcessingOverlay";
import {
  createAccountCard,
  validateCardTitle,
} from "@/lib/cards/createAccountCard";
import { loadingLabels } from "@/lib/ui/loadingLabels";

export function CreateCardForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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

    setPending(true);
    try {
      const cardId = await createAccountCard(user, title);
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
        שם הכרטיס
      </label>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={pending}
        maxLength={200}
        autoFocus
        className="mb-4 w-full rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass-surface)] px-4 py-3 text-[var(--color-pearl)] outline-none focus:border-[var(--color-champagne)]"
        placeholder="למשל: פנקס עם סתיו"
      />
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
        {pending ? loadingLabels.creatingCard : "יצירת כרטיס"}
      </button>
      </form>
      <ProcessingOverlay visible={pending} label={loadingLabels.creatingCard} />
    </>
  );
}
