"use client";

import type { User } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { callCreateAccountCardFunction } from "@/lib/firebase/functions";

export const CARD_TITLE_MIN = 1;
export const CARD_TITLE_MAX = 200;

export function validateCardTitle(title: string): string | null {
  const trimmed = title.trim();
  if (trimmed.length < CARD_TITLE_MIN) {
    return "נא למלא למי הכרטיס";
  }
  if (trimmed.length > CARD_TITLE_MAX) {
    return `עד ${CARD_TITLE_MAX} תווים`;
  }
  return null;
}

function mapCreateCardError(err: unknown): string {
  if (err instanceof FirebaseError) {
    if (err.code === "functions/unauthenticated") {
      return "נדרשת התחברות";
    }
    if (err.code === "functions/invalid-argument") {
      return "הערך לא תקין";
    }
  }
  return "לא הצלחנו ליצור את הכרטיס. נסה שוב.";
}

/**
 * יוצר כרטיס דרך Callable Function בשרת (Stage 2B-1).
 */
export async function createAccountCard(
  user: User,
  title: string
): Promise<string> {
  const validationError = validateCardTitle(title);
  if (validationError) {
    throw new Error(validationError);
  }

  if (!user.uid) {
    throw new Error("נדרשת התחברות");
  }

  try {
    return await callCreateAccountCardFunction(title);
  } catch (err) {
    throw new Error(mapCreateCardError(err));
  }
}
