"use client";

import { useCallback, useEffect, useId, useState } from "react";

type InstallMode = "hidden" | "prompt" | "ios";

type BeforeInstallPromptChoice = {
  outcome: "accepted" | "dismissed";
  platform: string;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<BeforeInstallPromptChoice>;
};

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

type InstallAppButtonProps = {
  className?: string;
  compact?: boolean;
};

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorWithStandalone = window.navigator as NavigatorWithStandalone;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function isIosSafari(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgent = window.navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(userAgent);
  const isSafari = /safari/i.test(userAgent);
  const isOtherIosBrowser = /crios|fxios|edgios/i.test(userAgent);

  return isIos && isSafari && !isOtherIosBrowser;
}

export function InstallAppButton({
  className = "",
  compact = false,
}: InstallAppButtonProps) {
  const [mode, setMode] = useState<InstallMode>("hidden");
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [iosGuideOpen, setIosGuideOpen] = useState(false);

  useEffect(() => {
    if (isStandaloneDisplay()) {
      return;
    }

    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const hideIfStandalone = () => {
      if (isStandaloneDisplay()) {
        setInstallPrompt(null);
        setIosGuideOpen(false);
        setMode("hidden");
      }
    };

    if (isIosSafari()) {
      queueMicrotask(() => setMode("ios"));
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setMode("prompt");
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      setIosGuideOpen(false);
      setMode("hidden");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    window.addEventListener("focus", hideIfStandalone);
    window.addEventListener("pageshow", hideIfStandalone);
    standaloneQuery.addEventListener("change", hideIfStandalone);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleInstalled);
      window.removeEventListener("focus", hideIfStandalone);
      window.removeEventListener("pageshow", hideIfStandalone);
      standaloneQuery.removeEventListener("change", hideIfStandalone);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (isStandaloneDisplay()) {
      setMode("hidden");
      return;
    }

    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      setMode("hidden");
      return;
    }

    if (mode === "ios") {
      setIosGuideOpen(true);
    }
  }, [installPrompt, mode]);

  if (mode === "hidden") {
    return null;
  }

  return (
    <>
      <div className={className}>
        <button
          type="button"
          className={
            compact
              ? "inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-vault-border-metallic)] bg-[rgba(194,176,146,0.045)] text-[var(--color-mist)] shadow-[inset_0_1px_0_rgba(194,176,146,0.08)] transition-colors hover:border-[var(--color-champagne)]/35 hover:text-[var(--color-pearl)]"
              : "inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--color-vault-border-metallic)] bg-[rgba(194,176,146,0.045)] px-4 py-2 text-sm font-medium text-[var(--color-mist)] shadow-[inset_0_1px_0_rgba(194,176,146,0.08)] transition-colors hover:border-[var(--color-champagne)]/35 hover:text-[var(--color-pearl)]"
          }
          aria-label={mode === "ios" ? "הוסף למסך הבית" : "התקן כאפליקציה"}
          title={mode === "ios" ? "הוסף למסך הבית" : "התקן כאפליקציה"}
          onClick={() => void handleInstallClick()}
        >
          {compact ? (
            <InstallIcon />
          ) : (
            <>
              <span
                className="h-1.5 w-1.5 rounded-full bg-[var(--color-vault-gold-green)]"
                aria-hidden
              />
              {mode === "ios" ? "הוסף למסך הבית" : "התקן כאפליקציה"}
            </>
          )}
        </button>
      </div>
      <IosInstallGuideModal
        open={iosGuideOpen}
        onClose={() => setIosGuideOpen(false)}
      />
    </>
  );
}

function InstallIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-[18px] w-[18px]"
      aria-hidden
    >
      <path
        d="M12 4v9m0 0 3.5-3.5M12 13 8.5 9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 14.5v2.2c0 1.2 1 2.3 2.3 2.3h8.4c1.3 0 2.3-1 2.3-2.3v-2.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IosInstallGuideModal({
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
        className="vault-sheet-panel w-full max-w-sm rounded-3xl p-7 text-center backdrop-blur-xl sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="mb-3 text-sm font-medium text-[var(--color-champagne)]">
          התקנה באייפון
        </p>
        <h2
          id={titleId}
          className="text-2xl font-semibold tracking-tight text-[var(--color-pearl)]"
        >
          הוסף למסך הבית
        </h2>
        <p
          id={descriptionId}
          className="mx-auto mt-4 max-w-xs text-base leading-relaxed text-[var(--color-mist)]"
        >
          לחץ על שיתוף → הוסף למסך הבית → הוסף
        </p>
        <button
          type="button"
          className="mt-8 min-h-11 rounded-full border border-[var(--color-champagne)]/35 px-6 py-3 text-sm font-medium text-[var(--color-pearl)] transition-colors hover:border-[var(--color-champagne)] hover:bg-[rgba(194,176,146,0.08)]"
          onClick={handleClose}
        >
          הבנתי
        </button>
      </div>
    </div>
  );
}
