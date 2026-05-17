import {CallableRequest, HttpsError} from "firebase-functions/v2/https";

/** דורש משתמש מחובר; זורק unauthenticated אחרת. */
export function requireAuthUid(request: CallableRequest): string {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "נדרשת התחברות");
  }
  return uid;
}
