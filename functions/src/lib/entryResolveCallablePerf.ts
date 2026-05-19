/**
 * מדידות זמניות ל-entry mutations — ללא תוכן רגיש.
 * הסרה קלה: מחק קובץ זה והקריאות מ-entry handlers.
 */

export type EntryResolveFunctionName =
  | "createEntry"
  | "approveEntry"
  | "rejectEntry"
  | "editEntry"
  | "cancelEntry";

const LOG_TAG = "[perf-entry-resolve]";

export type EntryResolvePerfContext = {
  functionName: EntryResolveFunctionName;
  cardId: string;
  entryId: string;
};

export function createEntryResolvePerf(
  functionName: EntryResolveFunctionName,
  cardId: string,
  entryId: string
): {
  context: EntryResolvePerfContext;
  functionStartMs: number;
  logStage: (stage: string, durationMs: number) => void;
  logTotal: (success: boolean) => void;
} {
  const context: EntryResolvePerfContext = {functionName, cardId, entryId};
  const functionStartMs = Date.now();

  const logStage = (stage: string, durationMs: number): void => {
    console.info(
      JSON.stringify({
        tag: LOG_TAG,
        functionName: context.functionName,
        cardId: context.cardId,
        entryId: context.entryId,
        stage,
        durationMs: Math.round(durationMs),
      })
    );
  };

  const logTotal = (success: boolean): void => {
    console.info(
      JSON.stringify({
        tag: LOG_TAG,
        functionName: context.functionName,
        cardId: context.cardId,
        entryId: context.entryId,
        stage: "total",
        durationMs: Math.round(Date.now() - functionStartMs),
        success,
      })
    );
  };

  return {context, functionStartMs, logStage, logTotal};
}
