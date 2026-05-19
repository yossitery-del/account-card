"use client";

import { callAcceptInvitationFunction } from "@/lib/firebase/functions";

export type AcceptInvitationResult = {
  cardId: string;
  alreadyParticipant?: boolean;
};

export async function acceptInvitation(
  token: string
): Promise<AcceptInvitationResult> {
  const trimmed = token.trim();
  if (!trimmed) {
    throw new Error("missing token");
  }
  return callAcceptInvitationFunction(trimmed);
}
