import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants/app";
import {
  JOIN_OG_DESCRIPTION,
  JOIN_OG_TITLE,
  joinOgMetadataBase,
} from "@/lib/invitations/joinOpenGraph";

/**
 * מטא־דאטה לנתיבי הזמנה (/j, /join) — לזחלני WhatsApp בלבד.
 * ללא Firebase, ללא token, ללא נתוני הזמנה.
 */
export const joinInviteMetadata: Metadata = {
  metadataBase: joinOgMetadataBase(),
  title: JOIN_OG_TITLE,
  description: JOIN_OG_DESCRIPTION,
  openGraph: {
    title: JOIN_OG_TITLE,
    description: JOIN_OG_DESCRIPTION,
    type: "website",
    locale: "he_IL",
    siteName: APP_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: JOIN_OG_TITLE,
    description: JOIN_OG_DESCRIPTION,
  },
};
