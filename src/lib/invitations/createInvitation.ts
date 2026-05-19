"use client";

import { FirebaseError } from "firebase/app";
import { callCreateInvitationFunction } from "@/lib/firebase/functions";
import type { CreateInvitationResult } from "@/types/invitation";

const LABEL_MAX = 100;

export function validateInvitedName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > LABEL_MAX) {
    return `שם להצגה עד ${LABEL_MAX} תווים`;
  }
  return null;
}

function mapInvitationError(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "functions/unauthenticated":
        return "נדרשת התחברות";
      case "functions/permission-denied":
        return "אין לך הרשאה להזמין לכרטיס זה";
      case "functions/not-found":
        return "הכרטיס לא נמצא";
      case "functions/invalid-argument":
        return "פרטי ההזמנה לא תקינים";
      case "functions/failed-precondition":
        return "הכרטיס אינו פעיל";
      default:
        break;
    }
  }
  return "לא הצלחנו ליצור את ההזמנה. נסה שוב.";
}

export type CreateInvitationOptions = {
  invitedName?: string;
};

export async function createInvitation(
  cardId: string,
  options: CreateInvitationOptions = {}
): Promise<CreateInvitationResult> {
  const nameError = validateInvitedName(options.invitedName ?? "");
  if (nameError) {
    throw new Error(nameError);
  }

  const trimmedName = options.invitedName?.trim();

  try {
    return await callCreateInvitationFunction({
      cardId,
      ...(trimmedName ? { invitedName: trimmedName } : {}),
    });
  } catch (err) {
    throw new Error(mapInvitationError(err));
  }
}
