import {defineString} from "firebase-functions/params";
import * as logger from "firebase-functions/logger";

/**
 * Canonical production UI URL (Vercel). Documented in docs/DEPLOY_HOSTING.md.
 * Used only when deployed Functions would otherwise use a non-public base
 * (missing / localhost). Override by setting the APP_BASE_URL parameter.
 */
export const PRODUCTION_APP_BASE_URL_FALLBACK =
  "https://account-card-prod.vercel.app" as const;

/**
 * בסיס URL לאפליקציה — רק בשרת (Functions).
 * Emulator: ערך הפרמטר APP_BASE_URL (ברירת מחדל localhost).
 * Deployed: אם APP_BASE_URL חסר או localhost — אזהרה בלוג + fallback לפרודקשן.
 */
export const appBaseUrlParam = defineString("APP_BASE_URL", {
  default: "http://localhost:3000",
});

function trimTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, "");
}

/** True when running under the Firebase Functions emulator. */
export function isFunctionsEmulator(): boolean {
  return process.env.FUNCTIONS_EMULATOR === "true";
}

function looksLikeNonPublicBaseUrl(base: string): boolean {
  const trimmed = base.trim();
  if (!trimmed) {
    return true;
  }
  try {
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ?
      trimmed :
      `https://${trimmed}`;
    const u = new URL(withScheme);
    const h = u.hostname.toLowerCase();
    return (
      h === "localhost" ||
      h === "127.0.0.1" ||
      h === "::1" ||
      h === "0.0.0.0"
    );
  } catch {
    return true;
  }
}

export function getAppBaseUrl(): string {
  const resolved = trimTrailingSlashes(appBaseUrlParam.value());

  if (isFunctionsEmulator()) {
    return resolved;
  }

  if (looksLikeNonPublicBaseUrl(resolved)) {
    logger.warn(
      "[appBaseUrl] APP_BASE_URL is missing or non-public in deployed Functions; " +
        `using fallback ${PRODUCTION_APP_BASE_URL_FALLBACK}. ` +
        "Set APP_BASE_URL for this project (e.g. functions/.env.<PROJECT_ID> or deploy prompt) " +
        "to your public app URL."
    );
    return PRODUCTION_APP_BASE_URL_FALLBACK;
  }

  return resolved;
}
