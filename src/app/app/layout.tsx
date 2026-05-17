import { AuthGuard } from "@/components/auth/AuthGuard";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
