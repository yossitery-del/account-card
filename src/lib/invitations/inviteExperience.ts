/**
 * Invitation experience architecture (pilot)
 *
 * שלוש שכבות נפרדות — אל תערבב ביניהן:
 *
 * 1. **Share URL** (`/j/{token}`)
 *    הקישור בוואטסאפ / העתקה. קצר ונקי. אותו token ואותה אבטחה כמו `/join/{token}`.
 *
 * 2. **Open Graph** (`opengraph-image.tsx` + `buildJoinInviteMetadata`)
 *    נכס PNG לזחלנים (WhatsApp preview card) — og:image מוחלט לדומיין ציבורי יציב.
 *    לא favicon/PWA icon. לא דף אמיתי למשתמש.
 *
 * 3. **Join landing** (`JoinLandingPage` + `JoinPreviewScreen`)
 *    חוויית מובייל מלאה אחרי לחיצה — רקע כהה, היררכיה, CTA, שלב שם נקי.
 *
 * Legacy: `/join/{token}` ממשיך לעבוד (אותו landing + אותו OG).
 */

export {
  buildShareInvitePath,
  buildShareInviteUrl,
  tokenFromInvitePath,
} from "@/lib/invitations/invitePaths";
