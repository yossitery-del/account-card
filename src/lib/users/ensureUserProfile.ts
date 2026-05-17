"use client";

import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase/client";
import type { UserSettings } from "@/types/user";

const defaultSettings: UserSettings = { locale: "he" };

/**
 * יוצר או מעדכן users/{uid} אחרי התחברות מוצלחת.
 * create: כל השדות. update: displayName, photoURL, updatedAt בלבד.
 */
export async function ensureUserProfile(firebaseUser: User): Promise<void> {
  const db = getFirestoreDb();
  const userRef = doc(db, "users", firebaseUser.uid);
  const snapshot = await getDoc(userRef);

  const displayName =
    firebaseUser.displayName?.trim() || "משתמש";
  const email = firebaseUser.email ?? "";
  const photoURL = firebaseUser.photoURL ?? null;

  if (!snapshot.exists()) {
    await setDoc(userRef, {
      displayName,
      email,
      photoURL,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      settings: defaultSettings,
    });
    return;
  }

  await updateDoc(userRef, {
    displayName,
    photoURL,
    updatedAt: serverTimestamp(),
  });
}
