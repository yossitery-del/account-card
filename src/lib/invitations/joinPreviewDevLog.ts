import { FirebaseError } from "firebase/app";
import type { GetInvitationPreviewCallableResult } from "@/lib/firebase/functions";

function tokenPrefix(token: string): string {
  const t = token.trim();
  if (t.length < 4) return "(short)";
  return `${t.slice(0, 4)}…`;
}

/** לוגים בטוחים — development בלבד, ללא token מלא. */
export function logJoinPreviewDev(
  phase: "request" | "success" | "error",
  token: string,
  extra?: {
    status?: GetInvitationPreviewCallableResult["status"];
    error?: unknown;
  }
): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const base = { tokenPrefix: tokenPrefix(token) };

  if (phase === "request") {
    console.info("[join-preview]", base);
    return;
  }

  if (phase === "success" && extra?.status) {
    console.info("[join-preview]", {...base, status: extra.status});
    return;
  }

  if (phase === "error" && extra?.error) {
    const err = extra.error;
    if (err instanceof FirebaseError) {
      console.error("[join-preview]", {
        ...base,
        code: err.code,
        message: err.message,
      });
    } else if (err instanceof Error) {
      console.error("[join-preview]", {
        ...base,
        message: err.message,
      });
    } else {
      console.error("[join-preview]", base, err);
    }
  }
}
