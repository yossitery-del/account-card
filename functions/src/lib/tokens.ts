import {createHash, randomBytes} from "crypto";

/** Token גולמי — מוחזר רק בתשובת Function (בתוך inviteLink). */
export function generateInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

/** SHA-256 hex — היחיד שנשמר ב-Firestore. */
export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
