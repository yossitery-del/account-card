"use client";

import { FirebaseError } from "firebase/app";
import type { User } from "firebase/auth";
import { withPerf } from "@/lib/dev/perfLog";
import {
  callRejectEntryFunction,
  type EntryMutationCallableResult,
} from "@/lib/firebase/functions";

function mapRejectEntryError(err: unknown): string {
  if (err instanceof FirebaseError) {
    if (err.code === "functions/unauthenticated") {
      return "נדרשת התחברות";
    }
    if (err.code === "functions/permission-denied") {
      return "אין לך הרשאה לפעולה זו";
    }
    if (err.code === "functions/not-found") {
      return "הרשומה לא נמצאה";
    }
    if (err.code === "functions/failed-precondition") {
      return "הרשומה כבר לא ממתינה לאישור";
    }
    if (err.code === "functions/invalid-argument") {
      return "הפרטים שהוזנו לא תקינים";
    }
  }
  return "לא הצלחנו לדחות את הרשומה. נסה שוב.";
}

export async function rejectEntry(
  user: User,
  cardId: string,
  entryId: string
): Promise<EntryMutationCallableResult> {
  if (!user.uid) {
    throw new Error("נדרשת התחברות");
  }

  try {
    return await withPerf("rejectEntry", () =>
      callRejectEntryFunction({ cardId, entryId })
    );
  } catch (err) {
    throw new Error(mapRejectEntryError(err));
  }
}
