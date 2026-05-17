/**
 * Firebase configuration from env vars.
 * Initialization: src/lib/firebase/client.ts (Stage 1+).
 *
 * IMPORTANT: Next.js inlines only STATIC access, e.g. process.env.NEXT_PUBLIC_FIREBASE_API_KEY.
 * Dynamic access like process.env[name] is undefined in the browser bundle.
 *
 * @see src/lib/firebase/README.md
 */

export const firebaseEnvKeys = {
  apiKey: "NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  storageBucket: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "NEXT_PUBLIC_FIREBASE_APP_ID",
} as const;

export type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

export type FirebaseEnvDiagnostics = {
  hasApiKey: boolean;
  hasAuthDomain: boolean;
  hasProjectId: boolean;
  hasStorageBucket: boolean;
  hasMessagingSenderId: boolean;
  hasAppId: boolean;
  projectId?: string;
  authDomain?: string;
  storageBucket?: string;
  apiKeyPrefix?: string;
  missing: string[];
};

/** Trim whitespace and optional surrounding quotes. */
function sanitizeEnvValue(raw: string | undefined): string | undefined {
  if (raw == null || raw === "") {
    return undefined;
  }

  let value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }

  return value === "" ? undefined : value;
}

/**
 * Read Firebase env with STATIC property access (required for Next.js client bundle).
 */
function readFirebaseEnvRaw(): {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
} {
  return {
    apiKey: sanitizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
    authDomain: sanitizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
    projectId: sanitizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    storageBucket: sanitizeEnvValue(
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    ),
    messagingSenderId: sanitizeEnvValue(
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    ),
    appId: sanitizeEnvValue(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  };
}

export function apiKeyPrefix(apiKey: string): string {
  return apiKey.slice(0, 8);
}

export function getFirebaseEnvDiagnostics(): FirebaseEnvDiagnostics {
  const raw = readFirebaseEnvRaw();
  const missing: string[] = [];

  if (!raw.apiKey) missing.push(firebaseEnvKeys.apiKey);
  if (!raw.authDomain) missing.push(firebaseEnvKeys.authDomain);
  if (!raw.projectId) missing.push(firebaseEnvKeys.projectId);
  if (!raw.storageBucket) missing.push(firebaseEnvKeys.storageBucket);
  if (!raw.messagingSenderId) missing.push(firebaseEnvKeys.messagingSenderId);
  if (!raw.appId) missing.push(firebaseEnvKeys.appId);

  return {
    hasApiKey: Boolean(raw.apiKey),
    hasAuthDomain: Boolean(raw.authDomain),
    hasProjectId: Boolean(raw.projectId),
    hasStorageBucket: Boolean(raw.storageBucket),
    hasMessagingSenderId: Boolean(raw.messagingSenderId),
    hasAppId: Boolean(raw.appId),
    projectId: raw.projectId,
    authDomain: raw.authDomain,
    storageBucket: raw.storageBucket,
    apiKeyPrefix: raw.apiKey ? apiKeyPrefix(raw.apiKey) : undefined,
    missing,
  };
}

/**
 * Development-only diagnostics. Never logs full API key.
 */
export function logFirebaseEnvDiagnostics(): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const d = getFirebaseEnvDiagnostics();

  console.info("Firebase env diagnostics:", {
    hasApiKey: d.hasApiKey,
    hasAuthDomain: d.hasAuthDomain,
    hasProjectId: d.hasProjectId,
    hasStorageBucket: d.hasStorageBucket,
    hasMessagingSenderId: d.hasMessagingSenderId,
    hasAppId: d.hasAppId,
    projectId: d.projectId,
    authDomain: d.authDomain,
    storageBucket: d.storageBucket,
    apiKeyPrefix: d.apiKeyPrefix,
  });

  for (const name of d.missing) {
    console.error(`Missing Firebase env: ${name}`);
  }
}

/** Returns config only when all env vars are set; otherwise null. */
export function getFirebaseClientConfig(): FirebaseClientConfig | null {
  const raw = readFirebaseEnvRaw();

  if (
    !raw.apiKey ||
    !raw.authDomain ||
    !raw.projectId ||
    !raw.storageBucket ||
    !raw.messagingSenderId ||
    !raw.appId
  ) {
    return null;
  }

  return {
    apiKey: raw.apiKey,
    authDomain: raw.authDomain,
    projectId: raw.projectId,
    storageBucket: raw.storageBucket,
    messagingSenderId: raw.messagingSenderId,
    appId: raw.appId,
  };
}
