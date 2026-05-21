import type { Metadata } from "next";
import { buildJoinInviteMetadata } from "@/lib/invitations/joinInviteMetadata";

/**
 * OG tags + opengraph-image route = תצוגת WhatsApp בלבד.
 * JoinLandingPage (page.tsx) = חוויית מובייל אחרי לחיצה.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  return buildJoinInviteMetadata("j", token);
}

export default function ShortInviteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
