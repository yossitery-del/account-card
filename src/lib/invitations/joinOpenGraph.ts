/**
 * Open Graph — תצוגת WhatsApp / זחלנים בלבד (/j, /join).
 * opengraph-image.tsx = נכס PNG לזחלנים; JoinLandingPage = דף אמיתי אחרי לחיצה.
 * תוכן קבוע בלבד, ללא token / Firebase / נתוני כרטיס בתוך התמונה.
 */

export const JOIN_OG_TITLE = "כרטיס חשבון משותף";

export const JOIN_OG_DESCRIPTION =
  "מקום מסודר לרישום חיובים, החזרים ואישורים בין שני צדדים.";

export const JOIN_OG_IMAGE_ALT = "כרטיס חשבון משותף — שני צדדים, תמונה אחת";

export const JOIN_OG_IMAGE_WIDTH = 1200;
export const JOIN_OG_IMAGE_HEIGHT = 630;

/** כותרות בתוך תמונת OG — לא נתונים אמיתיים מהמערכת */
export const JOIN_OG_IMAGE_HEADLINE = "כרטיס חשבון משותף";

export const JOIN_OG_IMAGE_TAGLINE = "שני צדדים. תמונה אחת.";

export const JOIN_OG_IMAGE_SUBLINE = "רושמים • מאשרים • מתעדכנים";

/** סטטוס מזויף במסך הטלפון ב-OG — מספר קבוע, לא נתוני משתמש */
export const JOIN_OG_MOCK_APP_STATUS = "2 החלטות ממתינות לאישורך";

/**
 * App UI uses Assistant via next/font (--font-assistant-family). No font files in repo.
 * OG uses build-emitted .woff2 from .next/static/media when present; else this stack.
 */
export const JOIN_OG_FONT_FAMILY_FALLBACK =
  "'Arial Hebrew', 'Noto Sans Hebrew', Arial, 'Helvetica Neue', Helvetica, sans-serif";

/**
 * Satori / ImageResponse renders Hebrew visually reversed without proper bidi.
 * Pre-reverse for PNG only — do not use in HTML metadata or UI.
 */
export function forOgHebrew(text: string): string {
  return [...text].reverse().join("");
}

/** דומיין ציבורי יציב ל־og:image — לא VERCEL_URL (פריסות מוגנות / זמניות). */
export const JOIN_OG_PUBLIC_ORIGIN_DEFAULT =
  "https://account-card-prod.vercel.app";

/**
 * Origin מוחלט לקישורי OG ו־metadataBase.
 * NEXT_PUBLIC_APP_URL בפרודקשן; אחרת alias קבוע (לא deployment URL).
 */
export function joinOgPublicOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  return JOIN_OG_PUBLIC_ORIGIN_DEFAULT;
}

/** בסיס URL מוחלט ל־Metadata API */
export function joinOgMetadataBase(): URL {
  return new URL(`${joinOgPublicOrigin()}/`);
}
