"use client";

import { withPerf } from "@/lib/dev/perfLog";
import { callGetInvitationPreviewFunction } from "@/lib/firebase/functions";
import type { InvitationPreviewResult } from "@/types/invitation";

export async function getInvitationPreview(
  token: string
): Promise<InvitationPreviewResult> {
  const trimmed = token.trim();
  if (!trimmed) {
    return { status: "invalid" };
  }
  return withPerf("getInvitationPreview", () =>
    callGetInvitationPreviewFunction(trimmed)
  );
}
