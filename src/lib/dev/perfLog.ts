"use client";

/** מדידות ביצועים — development בלבד, ללא מזהים רגישים */

const isDev = process.env.NODE_ENV === "development";

const callCounts = new Map<string, number>();
const lastTimingsMs = new Map<string, number>();

/** Callable — cold start אפשרי בקריאה ראשונה איטית */
const CALLABLE_LABELS = new Set([
  "createEntry",
  "createInvitation",
  "acceptInvitation",
  "getInvitationPreview",
]);

const COLD_START_HINT_MS = 2500;

export async function withPerf<T>(
  label: string,
  run: () => Promise<T>
): Promise<T> {
  if (!isDev) {
    return run();
  }

  const callNum = (callCounts.get(label) ?? 0) + 1;
  callCounts.set(label, callNum);

  const start = performance.now();
  console.info(`[perf] ${label} started (call #${callNum})`);

  try {
    return await run();
  } finally {
    const ms = Math.round(performance.now() - start);
    lastTimingsMs.set(label, ms);
    console.info(`[perf] ${label} finished in ${ms}ms (call #${callNum})`);

    if (callNum > 1) {
      console.warn(
        `[perf] duplicate: ${label} called ${callNum} times — check StrictMode, useEffect deps, or refetch`
      );
    }

    if (CALLABLE_LABELS.has(label) && callNum === 1 && ms >= COLD_START_HINT_MS) {
      console.info(
        `[perf] ${label} slow on first call — possible Functions cold start (later calls often faster)`
      );
    }
  }
}

/** שלב משנה בתוך פעולה (למשל שאילתת Firestore) */
export async function withPerfStep<T>(
  parentLabel: string,
  step: string,
  run: () => Promise<T>
): Promise<T> {
  return withPerf(`${parentLabel}.${step}`, run);
}

/** זמני הרצה אחרונים לפי תווית — לדיבוג: `__perfReport()` בקונסול */
export function getPerfLastTimings(): Record<string, number> {
  return Object.fromEntries(lastTimingsMs.entries());
}

export function logPerfReport(): void {
  if (!isDev) return;
  const rows = [...lastTimingsMs.entries()].sort((a, b) => b[1] - a[1]);
  if (rows.length === 0) {
    console.info("[perf] report: no timings yet");
    return;
  }
  console.info("[perf] report (last run per label, ms):");
  for (const [label, ms] of rows) {
    console.info(`  ${label}: ${ms}ms (calls: ${callCounts.get(label) ?? 0})`);
  }
}

/** איפוס מונים — אופציונלי לדיבוג ידני מהקונסול */
export function resetPerfCounts(): void {
  if (!isDev) return;
  callCounts.clear();
  lastTimingsMs.clear();
  console.info("[perf] call counts reset");
}

if (isDev && typeof window !== "undefined") {
  (
    window as unknown as {
      __perfReport?: () => void;
      __perfReset?: () => void;
    }
  ).__perfReport = logPerfReport;
  (
    window as unknown as {
      __perfReport?: () => void;
      __perfReset?: () => void;
    }
  ).__perfReset = resetPerfCounts;
}
