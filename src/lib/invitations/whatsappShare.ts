/**
 * שיתוף בסיסי ב-WhatsApp (wa.me intent) — לא Business API, לא שליחה מהשרת.
 */

/** נוסח מאושר לוואטסאפ — שורה אחת לפני הקישור, הקישור בשורה נפרדת */
export function buildInviteWhatsAppMessage(inviteLink: string): string {
  return `פתחתי לנו כרטיס חשבון משותף — מקום מסודר לנהל את החשבון בינינו.
כנס כאן 👇🏼
${inviteLink}`;
}

export function buildWhatsAppShareUrl(inviteLink: string): string {
  const text = buildInviteWhatsAppMessage(inviteLink);
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
