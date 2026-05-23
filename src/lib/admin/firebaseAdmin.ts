import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function parseServiceAccountJson(raw: string): Record<string, unknown> {
  return JSON.parse(raw) as Record<string, unknown>;
}

function resolveAdminCredential() {
  const jsonKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  if (jsonKey) {
    return cert(parseServiceAccountJson(jsonKey));
  }

  const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64?.trim();
  if (base64Key) {
    const decoded = Buffer.from(base64Key, "base64").toString("utf8");
    return cert(parseServiceAccountJson(decoded));
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) {
    return applicationDefault();
  }

  return applicationDefault();
}

function ensureAdminApp() {
  if (getApps().length > 0) {
    return;
  }

  initializeApp({
    credential: resolveAdminCredential(),
  });
}

export function getAdminAuth() {
  ensureAdminApp();
  return getAuth();
}

export function getAdminFirestore() {
  ensureAdminApp();
  return getFirestore();
}
