import {defineString} from "firebase-functions/params";

/**
 * בסיס URL לאפליקציה — רק בשרת (Functions).
 * פיתוח: http://localhost:3000
 * פרודקשן: להגדיר ב-Firebase (פרמטר APP_BASE_URL).
 */
export const appBaseUrlParam = defineString("APP_BASE_URL", {
  default: "http://localhost:3000",
});

export function getAppBaseUrl(): string {
  return appBaseUrlParam.value().replace(/\/+$/, "");
}
