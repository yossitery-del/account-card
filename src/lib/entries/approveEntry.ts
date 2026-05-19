"use client";

import { FirebaseError } from "firebase/app";
import type { User } from "firebase/auth";
import {
  callApproveEntryFunction,
  type DashboardQuickActionCallableResult,
} from "@/lib/firebase/functions";

function mapApproveEntryError(err: unknown): string {
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
  return "לא הצלחנו לאשר את הרשומה. נסה שוב.";
}

export async function approveEntry(
  user: User,
  cardId: string,
  entryId: string
): Promise<DashboardQuickActionCallableResult> {
  if (!user.uid) {
    throw new Error("נדרשת התחברות");
  }

  try {
    return await callApproveEntryFunction({ cardId, entryId });
  } catch (err) {
    throw new Error(mapApproveEntryError(err));
  }
}
