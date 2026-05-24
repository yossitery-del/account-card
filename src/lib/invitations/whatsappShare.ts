/**
 * שיתוף בסיסי ב-WhatsApp (wa.me intent) — לא Business API, לא שליחה מהשרת.
 */

/** שיתוף נקי: גוף ההודעה הוא הקישור בלבד; ה-preview מגיע מ-Open Graph. */
export function buildInviteWhatsAppMessage(inviteLink: string): string {
  return inviteLink;
}

export function buildWhatsAppShareUrl(inviteLink: string): string {
  const text = buildInviteWhatsAppMessage(inviteLink);
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
