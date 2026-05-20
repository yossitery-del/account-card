/** Open Graph — הזמנה (/join). תוכן קבוע בלבד, ללא token / Firebase / נתוני כרטיס. */

export const JOIN_OG_TITLE = "כרטיס חשבון משותף";

export const JOIN_OG_DESCRIPTION =
  "מקום מסודר לרישום חיובים, החזרים ואישורים בין שני צדדים.";

export const JOIN_OG_IMAGE_ALT = "כרטיס חשבון משותף — שני צדדים, תמונה אחת";

/** כותרות בתוך תמונת OG — לא נתונים אמיתיים מהמערכת */
export const JOIN_OG_IMAGE_HEADLINE = "כרטיס חשבון משותף";

export const JOIN_OG_IMAGE_TAGLINE = "שני צדדים. תמונה אחת.";

export const JOIN_OG_IMAGE_SUBLINE = "רישום • אישור • בהירות";

/**
 * Satori / ImageResponse renders Hebrew visually reversed without proper bidi.
 * Pre-reverse for PNG only — do not use in HTML metadata or UI.
 */
export function forOgHebrew(text: string): string {
  return [...text].reverse().join("");
}

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
