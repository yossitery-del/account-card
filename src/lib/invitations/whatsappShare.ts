/**
 * שיתוף בסיסי ב-WhatsApp (wa.me intent) — לא Business API, לא שליחה מהשרת.
 */

export function buildInviteWhatsAppMessage(inviteLink: string): string {
  return `היי, פתחתי לנו כרטיס חשבון משותף כדי שכל מה שקשור להתחשבנות בינינו יהיה מסודר וברור.

כל פעולה נכנסת קודם לאישור, ורק מה ששנינו מאשרים נכנס ליתרה הרשמית.

אפשר להצטרף מכאן:
${inviteLink}`;
}

export function buildWhatsAppShareUrl(inviteLink: string): string {
  const text = buildInviteWhatsAppMessage(inviteLink);
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
