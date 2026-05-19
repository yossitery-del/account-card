"use client";

import { callGetInvitationPreviewFunction } from "@/lib/firebase/functions";
import type { InvitationPreviewResult } from "@/types/invitation";

export async function getInvitationPreview(
  token: string
): Promise<InvitationPreviewResult> {
  const trimmed = token.trim();
  if (!trimmed) {
    return { status: "invalid" };
  }
  return callGetInvitationPreviewFunction(trimmed);
}
