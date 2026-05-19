"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { APP_NAME } from "@/lib/constants/app";
import { BrandMark } from "@/components/brand/BrandMark";

type BrandMarkButtonProps = {
  className?: string;
  align?: "start" | "center";
  size?: "compact" | "hero";
};

export function BrandMarkButton({
  className = "",
  align = "start",
  size = "compact",
}: BrandMarkButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={`inline-flex rounded-xl text-start outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[var(--color-vault-focus-ring)] ${className}`}
        aria-label={`פתיחת תצוגת מותג ${APP_NAME}`}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <BrandMark align={align} size={size} />
      </button>
      <BrandPreviewModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function BrandPreviewModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="vault-sheet-scrim fixed inset-0 z-50 flex items-end justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-[max(1rem,env(safe-area-inset-top,0px))] backdrop-blur-md sm:items-center"
      role="presentation"
      onClick={handleClose}
    >
      <div
        className="vault-sheet-panel w-full max-w-sm rounded-3xl p-7 text-center shadow-[0_24px_80px_rgba(0,0,0,0.48)] backdrop-blur-xl sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-7 flex justify-center">
          <BrandMark align="center" size="hero" />
        </div>
        <h2
          id={titleId}
          className="sr-only"
        >
          {APP_NAME}
        </h2>
        <p
          id={descriptionId}
          className="sr-only"
        >
          חשבון משותף. ברור. מאושר על ידי שני הצדדים.
        </p>
        <button
          type="button"
          className="mt-8 min-h-11 rounded-full border border-[var(--color-champagne)]/35 px-6 py-3 text-sm font-medium text-[var(--color-pearl)] transition-colors hover:border-[var(--color-champagne)] hover:bg-[rgba(194,176,146,0.08)]"
          onClick={handleClose}
        >
          סגור
        </button>
      </div>
    </div>
  );
}
