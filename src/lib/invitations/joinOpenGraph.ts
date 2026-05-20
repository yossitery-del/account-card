/** Open Graph — הזמנה (/join). תוכן קבוע בלבד, ללא token / Firebase / נתוני כרטיס. */

export const JOIN_OG_TITLE = "כרטיס חשבון משותף";

export const JOIN_OG_DESCRIPTION =
  "מקום מסודר לרישום חיובים, החזרים ואישורים בין שני צדדים.";

export const JOIN_OG_IMAGE_ALT = "כרטיס חשבון — כרטיס משותף ברור ומאושר";

/** כותרות בתוך תמונת OG — לא נתונים אמיתיים מהמערכת */
export const JOIN_OG_IMAGE_HEADLINE = "כרטיס חשבון";

export const JOIN_OG_IMAGE_TAGLINE = "כרטיס משותף ברור ומאושר";

/** בסיס URL מוחלט ל־og:image (WhatsApp / מטא). */
export function joinOgMetadataBase(): URL {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    return new URL(explicit.endsWith("/") ? explicit : `${explicit}/`);
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return new URL(`https://${vercel}/`);
  }
  return new URL("https://account-card-prod.vercel.app/");
}
