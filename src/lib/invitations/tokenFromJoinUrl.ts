import { tokenFromInvitePath } from "@/lib/invitations/invitePaths";

/**
 * מחלץ token מנתיב /join/[token] או /j/[token] — מפענח URI בבטחה.
 * @deprecated Prefer tokenFromInvitePath
 */
export function tokenFromJoinUrl(raw: string): string {
  return tokenFromInvitePath(raw);
}
