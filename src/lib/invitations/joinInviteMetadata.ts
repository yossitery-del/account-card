import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants/app";
import {
  JOIN_OG_DESCRIPTION,
  JOIN_OG_IMAGE_ALT,
  JOIN_OG_IMAGE_HEIGHT,
  JOIN_OG_IMAGE_WIDTH,
  JOIN_OG_TITLE,
  joinOgMetadataBase,
  joinOgPublicOrigin,
} from "@/lib/invitations/joinOpenGraph";

/** נתיב שיתוף קצר או legacy */
export type InviteLinkPathPrefix = "j" | "join";

function invitePathSegment(token: string): string {
  const trimmed = token.trim();
  if (!trimmed) {
    return "invite";
  }
  return encodeURIComponent(trimmed);
}

/**
 * URL מוחלט ל־opengraph-image — אותו נכס סטטי לכל token (הנתיב רק לניתוב Next).
 * WhatsApp חייב לקבל 200 + image/png מדומיין ציבורי יציב.
 */
export function buildJoinOgImageAbsoluteUrl(
  pathPrefix: InviteLinkPathPrefix,
  token: string
): string {
  const origin = joinOgPublicOrigin();
  const segment = invitePathSegment(token);
  return `${origin}/${pathPrefix}/${segment}/opengraph-image`;
}

export function buildJoinInvitePageUrl(
  pathPrefix: InviteLinkPathPrefix,
  token: string
): string {
  const origin = joinOgPublicOrigin();
  const segment = invitePathSegment(token);
  return `${origin}/${pathPrefix}/${segment}`;
}

/**
 * מטא־דאטה ל־/j/{token} ו־/join/{token} — og:image מפורש (לא favicon / PWA icon).
 * generateMetadata בלבד — לא נתוני כרטיס/משתמש.
 */
export function buildJoinInviteMetadata(
  pathPrefix: InviteLinkPathPrefix,
  token: string
): Metadata {
  const pageUrl = buildJoinInvitePageUrl(pathPrefix, token);
  const imageUrl = buildJoinOgImageAbsoluteUrl(pathPrefix, token);

  const ogImage = {
    url: imageUrl,
    secureUrl: imageUrl,
    width: JOIN_OG_IMAGE_WIDTH,
    height: JOIN_OG_IMAGE_HEIGHT,
    type: "image/png" as const,
    alt: JOIN_OG_IMAGE_ALT,
  };

  return {
    metadataBase: joinOgMetadataBase(),
    title: JOIN_OG_TITLE,
    description: JOIN_OG_DESCRIPTION,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: JOIN_OG_TITLE,
      description: JOIN_OG_DESCRIPTION,
      type: "website",
      locale: "he_IL",
      siteName: APP_NAME,
      url: pageUrl,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: JOIN_OG_TITLE,
      description: JOIN_OG_DESCRIPTION,
      images: [
        {
          url: imageUrl,
          width: JOIN_OG_IMAGE_WIDTH,
          height: JOIN_OG_IMAGE_HEIGHT,
          alt: JOIN_OG_IMAGE_ALT,
        },
      ],
    },
  };
}
