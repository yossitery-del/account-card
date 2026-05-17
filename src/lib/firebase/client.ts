"use client";

import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import {
  getFirebaseClientConfig,
  logFirebaseEnvDiagnostics,
} from "./config";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let devDiagnosticsLogged = false;

function runDevDiagnosticsOnce(): void {
  if (devDiagnosticsLogged || process.env.NODE_ENV !== "development") {
    return;
  }
  devDiagnosticsLogged = true;
  logFirebaseEnvDiagnostics();
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseClientConfig() !== null;
}

export function getFirebaseApp(): FirebaseApp {
  runDevDiagnosticsOnce();

  const config = getFirebaseClientConfig();
  if (!config) {
    throw new Error("Firebase לא מוגדר. השלם את משתני NEXT_PUBLIC_FIREBASE_* ב-.env.local");
  }

  if (!app) {
    app = getApps().length > 0 ? getApp() : initializeApp(config);
  }

  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export function getFirestoreDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  return db;
}
