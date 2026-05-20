import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants/app";
import {
  JOIN_OG_DESCRIPTION,
  JOIN_OG_TITLE,
  joinOgMetadataBase,
} from "@/lib/invitations/joinOpenGraph";

/**
 * מטא־דאטה לשרת בלבד — ללא Firebase, ללא token, ללא נתוני הזמנה.
 * דף join נשאר client; ה־layout מספק OG לזחלני WhatsApp.
 */
export const metadata: Metadata = {
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

export default function JoinTokenLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
