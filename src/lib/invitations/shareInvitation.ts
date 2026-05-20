import { buildInviteWhatsAppMessage } from "@/lib/invitations/whatsappShare";

export function canUseNativeShare(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function"
  );
}

export function buildInviteShareTitle(): string {
  return "כרטיס חשבון משותף";
}

/** נוסח קצר ל-Web Share — הקישור מועבר ב-`url`. */
export function buildInviteShareText(): string {
  return "פתחתי לנו כרטיס חשבון משותף — מקום מסודר לנהל את החשבון בינינו.";
}

export function buildInviteMessageForCopy(inviteLink: string): string {
  return buildInviteWhatsAppMessage(inviteLink);
}

/** תצוגה מקומית בלי חשיפת token מלא ב-UI. */
export function formatInviteLinkPreview(inviteLink: string): string {
  try {
    const url = new URL(inviteLink);
    const path = url.pathname.startsWith("/j/")
      ? url.pathname
      : url.pathname.replace(/^\/join\//, "/j/");
    return `${url.hostname}${path.length > 28 ? `${path.slice(0, 24)}…` : path}`;
  } catch {
    return "קישור כרטיס";
  }
}

export type NativeShareOutcome = "shared" | "cancelled" | "unavailable";

export async function shareInvitationNative(
  inviteLink: string
): Promise<NativeShareOutcome> {
  if (!canUseNativeShare()) {
    return "unavailable";
  }

  try {
    await navigator.share({
      title: buildInviteShareTitle(),
      text: buildInviteShareText(),
      url: inviteLink,
    });
    return "shared";
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return "cancelled";
    }
    return "cancelled";
  }
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fallback below */
    }
  }

  if (typeof document === "undefined") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}
