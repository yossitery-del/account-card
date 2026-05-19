"use client";

import { FirebaseError } from "firebase/app";
import type { User } from "firebase/auth";
import {
  callCancelEntryFunction,
  type EntryMutationCallableResult,
} from "@/lib/firebase/functions";

function mapCancelEntryError(err: unknown): string {
  if (err instanceof FirebaseError) {
    if (err.code === "functions/unauthenticated") {
      return "נדרשת התחברות";
    }
    if (err.code === "functions/permission-denied") {
      return "אין לך הרשאה לבטל את הרשומה";
    }
    if (err.code === "functions/not-found") {
      return "הרשומה לא נמצאה";
    }
    if (err.code === "functions/failed-precondition") {
      return "הרשומה כבר לא ניתנת לביטול";
    }
    if (err.code === "functions/invalid-argument") {
      return "הפרטים שהוזנו לא תקינים";
    }
  }
  return "לא הצלחנו לבטל את הרשומה. נסה שוב.";
}

export async function cancelEntry(
  user: User,
  cardId: string,
  entryId: string
): Promise<EntryMutationCallableResult> {
  if (!user.uid) {
    throw new Error("נדרשת התחברות");
  }

  try {
    return await callCancelEntryFunction({ cardId, entryId });
  } catch (err) {
    throw new Error(mapCancelEntryError(err));
  }
}
