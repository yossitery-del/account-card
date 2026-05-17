"use client";

import { FirebaseError } from "firebase/app";
import type { User } from "firebase/auth";
import { withPerf } from "@/lib/dev/perfLog";
import {
  callEditEntryFunction,
  type EntryMutationCallableResult,
} from "@/lib/firebase/functions";
import { entriesCopy } from "@/lib/entries/entriesCopy";
import type { EntryIntent } from "@/types/entry";
import { validateEntryTitle } from "./createEntry";

function mapEditEntryError(err: unknown): string {
  if (err instanceof FirebaseError) {
    if (err.code === "functions/unauthenticated") {
      return "נדרשת התחברות";
    }
    if (err.code === "functions/permission-denied") {
      return "אין לך הרשאה לערוך את הרשומה";
    }
    if (err.code === "functions/not-found") {
      return "הרשומה לא נמצאה";
    }
    if (err.code === "functions/failed-precondition") {
      const message = err.message;
      if (message.includes("לא בוצע שינוי")) {
        return entriesCopy.noChange;
      }
      return "הרשומה כבר לא ניתנת לעריכה";
    }
    if (err.code === "functions/invalid-argument") {
      return "הפרטים שהוזנו לא תקינים";
    }
  }
  return "לא הצלחנו לשמור את השינוי. נסה שוב.";
}

export async function editEntry(
  user: User,
  cardId: string,
  entryId: string,
  intent: EntryIntent,
  amount: number,
  title: string
): Promise<EntryMutationCallableResult> {
  const titleError = validateEntryTitle(title);
  if (titleError) {
    throw new Error(titleError);
  }

  if (!user.uid) {
    throw new Error("נדרשת התחברות");
  }

  try {
    return await withPerf("editEntry", () =>
      callEditEntryFunction({
        cardId,
        entryId,
        intent,
        amount,
        title: title.trim(),
      })
    );
  } catch (err) {
    throw new Error(mapEditEntryError(err));
  }
}
