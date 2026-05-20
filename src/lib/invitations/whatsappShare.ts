/**
 * שיתוף בסיסי ב-WhatsApp (wa.me intent) — לא Business API, לא שליחה מהשרת.
 */

export function buildInviteWhatsAppMessage(inviteLink: string): string {
  return `פתחתי לנו כרטיס חשבון משותף.

מקום אחד מסודר לרישום חיובים, החזרים ואישורים — כדי ששנינו תמיד רואים את אותה התמונה.

כניסה לכרטיס:
${inviteLink}`;
}

export function buildWhatsAppShareUrl(inviteLink: string): string {
  const text = buildInviteWhatsAppMessage(inviteLink);
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
