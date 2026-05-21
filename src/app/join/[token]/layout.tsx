import type { Metadata } from "next";
import { buildJoinInviteMetadata } from "@/lib/invitations/joinInviteMetadata";

/**
 * Legacy /join — אותם תגי OG כמו /j; דף join זהה.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  return buildJoinInviteMetadata("join", token);
}

export default function JoinTokenLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
