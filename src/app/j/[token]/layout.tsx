import { joinInviteMetadata } from "@/lib/invitations/joinInviteMetadata";

export const metadata = joinInviteMetadata;

export default function ShortInviteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
