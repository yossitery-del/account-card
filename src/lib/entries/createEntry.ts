"use client";

import { FirebaseError } from "firebase/app";
import type { User } from "firebase/auth";
import {
  callCreateEntryFunction,
  type CreateEntryCallableResult,
} from "@/lib/firebase/functions";
import type { EntryIntent } from "@/types/entry";

export const ENTRY_TITLE_MAX = 200;
export const ENTRY_AMOUNT_MAX = 999_999_999;

export function validateEntryTitle(title: string): string | null {
  const trimmed = title.trim();
  if (trimmed.length > ENTRY_TITLE_MAX) {
    return `הפירוט עד ${ENTRY_TITLE_MAX} תווים`;
  }
  return null;
}

export function validateEntryAmount(raw: string): { amount: number } | { error: string } {
  const trimmed = raw.trim().replace(/,/g, "");
  if (!trimmed) {
    return { error: "נא להזין סכום" };
  }
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "הסכום חייב להיות מספר חיובי" };
  }
  if (amount > ENTRY_AMOUNT_MAX) {
    return { error: "הסכום גדול מדי" };
  }
  return { amount };
}

function mapCreateEntryError(err: unknown): string {
  if (err instanceof FirebaseError) {
    if (err.code === "functions/unauthenticated") {
      return "נדרשת התחברות";
    }
    if (err.code === "functions/permission-denied") {
      return "אין לך הרשאה להוסיף פעולה";
    }
    if (err.code === "functions/not-found") {
      return "הכרטיס לא נמצא";
    }
    if (err.code === "functions/failed-precondition") {
      return "הכרטיס אינו זמין להוספת פעולה";
    }
    if (err.code === "functions/invalid-argument") {
      return "הפרטים שהוזנו לא תקינים";
    }
  }
  return "לא הצלחנו לשלוח את הפעולה. נסה שוב.";
}

export async function createEntry(
  user: User,
  cardId: string,
  intent: EntryIntent,
  amount: number,
  title: string
): Promise<CreateEntryCallableResult> {
  const titleError = validateEntryTitle(title);
  if (titleError) {
    throw new Error(titleError);
  }

  if (!user.uid) {
    throw new Error("נדרשת התחברות");
  }

  try {
    return await callCreateEntryFunction({
      cardId,
      intent,
      amount,
      title: title.trim(),
    });
  } catch (err) {
    throw new Error(mapCreateEntryError(err));
  }
}
