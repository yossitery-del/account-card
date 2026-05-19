import {getApps, initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore} from "firebase-admin/firestore";

/** Region נעול לכל Functions — חייב להתאים ל-client. */
export const FUNCTIONS_REGION = "us-central1";

if (getApps().length === 0) {
  initializeApp();
}

/** Firestore Admin — לשימוש ב-2B-1 ואילך. לא כותבים ב-2B-0. */
export const db = getFirestore();

/** Auth Admin — לשימוש ב-2B-1 ואילך. */
export const auth = getAuth();
