const JOIN_INTENT_STORAGE_KEY = "account-card:join-intent";
const JOIN_INTENT_MAX_AGE_MS = 30 * 60 * 1000;

type JoinIntentPayload = {
  token: string;
  createdAt: number;
};

function readIntent(): JoinIntentPayload | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }
  const raw = sessionStorage.getItem(JOIN_INTENT_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as JoinIntentPayload;
    if (typeof parsed.token !== "string" || typeof parsed.createdAt !== "number") {
      return null;
    }
    if (Date.now() - parsed.createdAt > JOIN_INTENT_MAX_AGE_MS) {
      clearJoinIntent();
      return null;
    }
    return parsed;
  } catch {
    clearJoinIntent();
    return null;
  }
}

/** שומר כוונת join לאחר לחיצה על «כניסה לכרטיס» לפני Google login. */
export function setJoinIntent(token: string): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  const trimmed = token.trim();
  if (!trimmed) {
    return;
  }
  const payload: JoinIntentPayload = {
    token: trimmed,
    createdAt: Date.now(),
  };
  sessionStorage.setItem(JOIN_INTENT_STORAGE_KEY, JSON.stringify(payload));
}

export function clearJoinIntent(): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  sessionStorage.removeItem(JOIN_INTENT_STORAGE_KEY);
}

/** האם יש intent תקף ל-token הנוכחי (ללא מחיקה). */
export function hasJoinIntentForToken(token: string): boolean {
  const intent = readIntent();
  if (!intent) {
    return false;
  }
  return intent.token === token.trim();
}

/** מוחק intent רק אם הוא תואם ל-token — לפני accept אוטומטי. */
export function consumeJoinIntentForToken(token: string): boolean {
  const intent = readIntent();
  const trimmed = token.trim();
  if (!intent || intent.token !== trimmed) {
    return false;
  }
  clearJoinIntent();
  return true;
}
