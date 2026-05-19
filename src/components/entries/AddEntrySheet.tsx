"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  createEntry,
  validateEntryAmount,
  validateEntryTitle,
} from "@/lib/entries/createEntry";
import { entriesCopy } from "@/lib/entries/entriesCopy";
import type { CreateEntryCallableResult } from "@/lib/firebase/functions";
import type { EntryIntent } from "@/types/entry";

type AddEntrySheetProps = {
  cardId: string;
  open: boolean;
  onClose: () => void;
  onCreated: (result: CreateEntryCallableResult) => void | Promise<void>;
  onPendingChange?: (pending: boolean) => void;
};

export function AddEntrySheet({
  cardId,
  open,
  onClose,
  onCreated,
  onPendingChange,
}: AddEntrySheetProps) {
  const { user } = useAuth();
  const [selectedIntent, setSelectedIntent] = useState<EntryIntent | null>(null);
  const [amountRaw, setAmountRaw] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const resetForm = useCallback(() => {
    setSelectedIntent(null);
    setAmountRaw("");
    setTitle("");
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    if (pending) return;
    resetForm();
    onClose();
  }, [pending, resetForm, onClose]);

  useEffect(() => {
    onPendingChange?.(pending);
  }, [pending, onPendingChange]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) {
        handleClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pending, handleClose]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!selectedIntent) {
        setError("נא לבחור זיכוי או חיוב");
        return;
      }

      const amountResult = validateEntryAmount(amountRaw);
      if ("error" in amountResult) {
        setError(amountResult.error);
        return;
      }

      const titleError = validateEntryTitle(title);
      if (titleError) {
        setError(titleError);
        return;
      }

      if (!user) {
        setError("נדרשת התחברות");
        return;
      }

      setPending(true);
      try {
        const result = await createEntry(
          user,
          cardId,
          selectedIntent,
          amountResult.amount,
          title
        );
        await onCreated(result);
        handleClose();
      } catch (err) {
        console.error("createEntry failed:", err);
        setError(
          err instanceof Error
            ? err.message
            : "לא הצלחנו לשלוח את הרשומה. נסה שוב."
        );
      } finally {
        setPending(false);
      }
    },
    [selectedIntent, amountRaw, title, user, cardId, onCreated, handleClose]
  );

  if (!open) {
    return null;
  }

  return (
    <div
      className="vault-sheet-scrim fixed inset-0 z-50 flex items-end justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))] backdrop-blur-md sm:items-center"
      role="presentation"
      onClick={pending ? undefined : handleClose}
    >
      <div
        className="vault-sheet-panel w-full max-w-md rounded-2xl p-6 backdrop-blur-xl sm:p-8"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-6 text-center text-xl font-medium text-[var(--color-pearl)]">
          {entriesCopy.modalTitle}
        </h2>

        <div className="grid grid-cols-2 gap-3" dir="rtl">
          <TypeChoiceButton
            label={entriesCopy.receiveLabel}
            helper={entriesCopy.receiveHelper}
            selected={selectedIntent === "to_receive"}
            disabled={pending}
            onClick={() => setSelectedIntent("to_receive")}
          />
          <TypeChoiceButton
            label={entriesCopy.payLabel}
            helper={entriesCopy.payHelper}
            selected={selectedIntent === "to_pay"}
            disabled={pending}
            onClick={() => setSelectedIntent("to_pay")}
          />
        </div>

        {selectedIntent ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="entry-amount"
                className="mb-2 block text-sm text-[var(--color-mist)]"
              >
                {entriesCopy.amountLabel}
              </label>
              <input
                id="entry-amount"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                dir="ltr"
                className="vault-input-field w-full rounded-xl px-4 py-3 text-base text-[var(--color-pearl)]"
                value={amountRaw}
                onChange={(e) => setAmountRaw(e.target.value)}
                disabled={pending}
              />
            </div>

            <div>
              <label
                htmlFor="entry-title"
                className="mb-2 block text-sm text-[var(--color-mist)]"
              >
                {entriesCopy.titleLabel}
              </label>
              <input
                id="entry-title"
                type="text"
                autoComplete="off"
                className="vault-input-field w-full rounded-xl px-4 py-3 text-base text-[var(--color-pearl)]"
                placeholder={entriesCopy.titlePlaceholder}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={pending}
              />
            </div>

            {error ? (
              <p
                className="text-center text-sm text-[var(--color-muted-rose)]"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <p className="text-center text-xs leading-relaxed text-[var(--color-mist)]">
              {entriesCopy.submitHint}
            </p>

            <button
              type="submit"
              disabled={pending}
              className="min-h-11 w-full rounded-xl bg-[var(--color-champagne)] py-3.5 text-base font-medium text-[var(--color-vault-black)] transition hover:bg-[var(--color-champagne-hover)] disabled:opacity-60"
            >
              {pending ? "שולח…" : entriesCopy.submit}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

function TypeChoiceButton({
  label,
  helper,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  helper: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-h-11 rounded-2xl border px-4 py-3 text-start transition ${
        selected
          ? "border-[var(--color-champagne)] bg-[rgba(201,184,150,0.14)] shadow-[0_0_0_1px_rgba(201,184,150,0.3)]"
          : "vault-choice-inactive hover:border-[var(--color-mist)]"
      } disabled:opacity-60`}
    >
      <span className="block text-lg font-medium text-[var(--color-pearl)]">
        {label}
      </span>
      <span className="mt-1.5 block text-sm leading-relaxed text-[var(--color-mist)]">
        {helper}
      </span>
    </button>
  );
}
