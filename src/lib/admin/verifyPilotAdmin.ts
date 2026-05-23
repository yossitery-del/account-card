import { getAdminAuth } from "@/lib/admin/firebaseAdmin";

export type PilotAdminVerification =
  | { ok: true; email: string }
  | { ok: false; status: 401 | 403 | 503; message: string };

function parseAllowlistEmails(raw: string | undefined): Set<string> {
  if (!raw?.trim()) {
    return new Set();
  }

  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  );
}

function extractBearerToken(header: string | null): string | null {
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

/** מאמת Firebase ID token + allowlist PILOT_ADMIN_EMAILS — ללא לוג PII */
export async function verifyPilotAdmin(
  authorizationHeader: string | null
): Promise<PilotAdminVerification> {
  const allowlist = parseAllowlistEmails(process.env.PILOT_ADMIN_EMAILS);

  if (allowlist.size === 0) {
    return {
      ok: false,
      status: 503,
      message: "חדר הבקרה לא מוגדר. חסר PILOT_ADMIN_EMAILS.",
    };
  }

  const token = extractBearerToken(authorizationHeader);
  if (!token) {
    return { ok: false, status: 401, message: "נדרשת התחברות." };
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    const email = decoded.email?.trim().toLowerCase();

    if (!email || !allowlist.has(email)) {
      return { ok: false, status: 403, message: "אין הרשאה לחדר הבקרה." };
    }

    return { ok: true, email };
  } catch {
    return { ok: false, status: 401, message: "אימות נכשל. נסה להתחבר מחדש." };
  }
}
