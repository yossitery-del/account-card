"use client";

import { useCallback, useState } from "react";
import { callHealthFunction, type HealthCallableResult } from "@/lib/firebase/functions";

/**
 * כלי בדיקה ל-development בלבד — לא מוצר.
 * מוצג רק כש-NODE_ENV === "development".
 */
export function FunctionsHealthDebug() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HealthCallableResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runHealthCheck = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await callHealthFunction();
      setResult(data);
      console.info("[Functions health]", data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "קריאת health נכשלה";
      setError(message);
      console.error("[Functions health] failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div
      className="mt-8 rounded-lg border border-dashed border-[var(--color-border-subtle)] p-3 text-xs text-[var(--color-muted)]"
      aria-label="בדיקת Functions — development בלבד"
    >
      <p className="mb-2 font-medium text-[var(--color-muted-rose)]">
        [dev] Firebase Functions
      </p>
      <button
        type="button"
        onClick={() => void runHealthCheck()}
        disabled={loading}
        className="rounded border border-[var(--color-border-subtle)] px-2 py-1 hover:bg-white/5 disabled:opacity-50"
      >
        {loading ? "בודק…" : "בדיקת health"}
      </button>
      {result ? (
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-[10px] text-[var(--color-champagne)]">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
      {error ? (
        <p className="mt-2 text-[var(--color-muted-rose)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
