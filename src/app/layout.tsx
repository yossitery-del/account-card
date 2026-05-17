import type { Metadata, Viewport } from "next";
import { Assistant } from "next/font/google";
import {
  APP_DESCRIPTION,
  APP_DIR,
  APP_LANG,
  APP_NAME,
  THEME_COLOR,
} from "@/lib/constants/app";
import { AuthProvider } from "@/components/auth/AuthProvider";
import "./globals.css";

const assistant = Assistant({
  subsets: ["hebrew", "latin"],
  variable: "--font-assistant-family",
  display: "swap",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={APP_LANG}
      dir={APP_DIR}
      className={`${assistant.variable} h-full antialiased`}
    >
      <body className="min-h-full vault-bg">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
