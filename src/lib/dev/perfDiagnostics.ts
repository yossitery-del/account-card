"use client";

/**
 * מדידות ביצועים זמניות — ללא תוכן רגיש.
 * פעיל ב-development או כש-NEXT_PUBLIC_PERF_LOG=true.
 */

export type PerfChannel = "dashboard" | "card" | "action";
export type PerfMetricGroup = "dashboard" | "card" | "action";

const CHANNEL_PREFIX: Record<PerfChannel, string> = {
  dashboard: "[perf-dashboard]",
  card: "[perf-card]",
  action: "[perf-action]",
};

const SAFE_DATA_KEYS = new Set([
  "ms",
  "totalMs",
  "callableMs",
  "refreshMs",
  "parallelMs",
  "listUserCardsMs",
  "cardCount",
  "entryCount",
  "participantCount",
  "action",
  "surface",
  "cardId",
  "entryId",
  "success",
]);

const MAX_SAMPLES_PER_METRIC = 50;

type PerfMetricSample = {
  value: number;
  at: number;
  action?: string;
};

type PerfMetricConfig = {
  group: PerfMetricGroup;
  label: string;
  category: "auth" | "firestore" | "callable" | "refresh" | "ui";
};

type PerfMetricStats = PerfMetricConfig & {
  count: number;
  averageMs: number;
  maxMs: number;
  latestMs: number;
};

const metricSamples = new Map<string, PerfMetricSample[]>();
const metricConfigs = new Map<string, PerfMetricConfig>();

export function isPerfLoggingEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_PERF_LOG === "true"
  );
}

function sanitizePerfData(
  data: Record<string, unknown>
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(data)) {
    if (!SAFE_DATA_KEYS.has(key)) {
      continue;
    }
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      out[key] = value;
    }
  }
  return out;
}

function numericValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function addMetricSample(
  key: string,
  config: PerfMetricConfig,
  value: number,
  action?: string
): void {
  const samples = metricSamples.get(key) ?? [];
  samples.push({ value, at: Date.now(), action });
  if (samples.length > MAX_SAMPLES_PER_METRIC) {
    samples.splice(0, samples.length - MAX_SAMPLES_PER_METRIC);
  }
  metricSamples.set(key, samples);
  metricConfigs.set(key, config);
}

function recordDashboardMetric(
  message: string,
  data: Record<string, string | number | boolean>
): void {
  if (message === "auth ready") {
    const ms = numericValue(data.ms);
    if (ms !== null) {
      addMetricSample("dashboard.authReady", {
        group: "dashboard",
        label: "auth ready",
        category: "auth",
      }, ms);
    }
    return;
  }

  if (message === "listUserCards") {
    const ms = numericValue(data.ms);
    if (ms !== null) {
      addMetricSample("dashboard.listUserCards", {
        group: "dashboard",
        label: "listUserCards",
        category: "firestore",
      }, ms);
    }
    return;
  }

  if (message === "dashboard ready") {
    const totalMs = numericValue(data.totalMs);
    if (totalMs !== null) {
      addMetricSample("dashboard.dashboardReady", {
        group: "dashboard",
        label: "dashboard ready",
        category: "ui",
      }, totalMs);
    }
  }
}

function recordCardMetric(
  message: string,
  data: Record<string, string | number | boolean>
): void {
  if (message === "auth ready") {
    const ms = numericValue(data.ms);
    if (ms !== null) {
      addMetricSample("card.authReady", {
        group: "card",
        label: "auth ready",
        category: "auth",
      }, ms);
    }
    return;
  }

  if (message === "getCardPageContext") {
    const ms = numericValue(data.ms);
    if (ms !== null) {
      addMetricSample("card.getCardPageContext", {
        group: "card",
        label: "getCardPageContext",
        category: "firestore",
      }, ms);
    }
    return;
  }

  if (message === "listEntries") {
    const ms = numericValue(data.ms);
    if (ms !== null) {
      addMetricSample("card.listEntries", {
        group: "card",
        label: "listEntries",
        category: "firestore",
      }, ms);
    }
    return;
  }

  if (message === "page ready") {
    const totalMs = numericValue(data.totalMs);
    if (totalMs !== null) {
      addMetricSample("card.pageReady", {
        group: "card",
        label: "page ready",
        category: "ui",
      }, totalMs);
    }
  }
}

function recordActionMetric(
  message: string,
  data: Record<string, string | number | boolean>
): void {
  const action = typeof data.action === "string" ? data.action : "unknown";

  if (message === "callable finished") {
    const ms = numericValue(data.ms);
    if (ms !== null) {
      addMetricSample(`action.${action}.callable`, {
        group: "action",
        label: `${action} callable`,
        category: "callable",
      }, ms, action);
    }
    return;
  }

  if (message === "refresh finished") {
    const ms = numericValue(data.ms);
    if (ms !== null) {
      addMetricSample(`action.${action}.refresh`, {
        group: "action",
        label: `${action} refresh`,
        category: "refresh",
      }, ms, action);
    }
    return;
  }

  if (message === "ui settled") {
    const totalMs = numericValue(data.totalMs);
    if (totalMs !== null) {
      addMetricSample(`action.${action}.uiSettled`, {
        group: "action",
        label: `${action} ui settled`,
        category: "ui",
      }, totalMs, action);
    }
  }
}

export function recordPerfMetric(
  channel: PerfChannel,
  message: string,
  data: Record<string, string | number | boolean>
): void {
  if (channel === "dashboard") {
    recordDashboardMetric(message, data);
    return;
  }
  if (channel === "card") {
    recordCardMetric(message, data);
    return;
  }
  recordActionMetric(message, data);
}

function statsForMetric(key: string): PerfMetricStats | null {
  const samples = metricSamples.get(key);
  const config = metricConfigs.get(key);
  if (!samples || samples.length === 0 || !config) {
    return null;
  }

  const values = samples.map((sample) => sample.value);
  const total = values.reduce((sum, value) => sum + value, 0);
  return {
    ...config,
    count: values.length,
    averageMs: Math.round(total / values.length),
    maxMs: Math.max(...values),
    latestMs: values[values.length - 1] ?? 0,
  };
}

function metricRows(group: PerfMetricGroup): Array<Record<string, string | number>> {
  return [...metricSamples.keys()]
    .map(statsForMetric)
    .filter((stats): stats is PerfMetricStats => stats !== null)
    .filter((stats) => stats.group === group)
    .map((stats) => ({
      metric: stats.label,
      samples: stats.count,
      avgMs: stats.averageMs,
      maxMs: stats.maxMs,
      latestMs: stats.latestMs,
    }));
}

function actionRows(): Array<Record<string, string | number>> {
  return [...metricSamples.keys()]
    .map(statsForMetric)
    .filter((stats): stats is PerfMetricStats => stats !== null)
    .filter((stats) => stats.group === "action")
    .map((stats) => {
      const [action = "unknown", phase = "unknown"] = stats.label.split(" ");
      return {
        action,
        phase,
        samples: stats.count,
        avgMs: stats.averageMs,
        maxMs: stats.maxMs,
        latestMs: stats.latestMs,
      };
    });
}

function bottleneckRows(): Array<Record<string, string | number>> {
  const byCategory = new Map<
    PerfMetricStats["category"],
    { total: number; max: number; count: number; labels: Set<string> }
  >();

  for (const key of metricSamples.keys()) {
    const stats = statsForMetric(key);
    if (!stats) continue;
    const current = byCategory.get(stats.category) ?? {
      total: 0,
      max: 0,
      count: 0,
      labels: new Set<string>(),
    };
    current.total += stats.averageMs * stats.count;
    current.max = Math.max(current.max, stats.maxMs);
    current.count += stats.count;
    current.labels.add(stats.label);
    byCategory.set(stats.category, current);
  }

  return [...byCategory.entries()]
    .map(([category, stats]) => ({
      bottleneck: category,
      samples: stats.count,
      avgMs: Math.round(stats.total / Math.max(stats.count, 1)),
      maxMs: stats.max,
      metrics: [...stats.labels].join(", "),
    }))
    .sort((a, b) => Number(b.avgMs) - Number(a.avgMs));
}

function printRows(title: string, rows: Array<Record<string, string | number>>): void {
  console.info(title);
  if (rows.length === 0) {
    console.info("  no samples yet");
    return;
  }
  console.table(rows);
}

export function logStructuredPerfReport(): void {
  if (!isPerfLoggingEnabled()) return;

  const sampleCount = [...metricSamples.values()].reduce(
    (sum, samples) => sum + samples.length,
    0
  );

  if (sampleCount === 0) {
    console.info("[perf-report] no dashboard/card/action samples yet");
    return;
  }

  console.info("[perf-report] summary of recent dashboard/card/action samples");
  printRows("[perf-report] dashboard", metricRows("dashboard"));
  printRows("[perf-report] card detail", metricRows("card"));
  printRows("[perf-report] actions", actionRows());
  printRows("[perf-report] likely bottlenecks", bottleneckRows());
}

export function resetStructuredPerfReport(): void {
  metricSamples.clear();
  metricConfigs.clear();
}

export function perfLog(
  channel: PerfChannel,
  message: string,
  data?: Record<string, unknown>
): void {
  if (!isPerfLoggingEnabled()) {
    return;
  }
  const prefix = CHANNEL_PREFIX[channel];
  const safeData = data ? sanitizePerfData(data) : {};
  if (Object.keys(safeData).length > 0) {
    recordPerfMetric(channel, message, safeData);
    console.info(prefix, message, safeData);
  } else {
    console.info(prefix, message);
  }
}

export async function withPerfChannel<T>(
  channel: PerfChannel,
  label: string,
  run: () => Promise<T>,
  dataOnFinish?: (result: T) => Record<string, unknown>
): Promise<T> {
  if (!isPerfLoggingEnabled()) {
    return run();
  }

  const start = performance.now();
  perfLog(channel, `${label} started`);
  try {
    const result = await run();
    const extra = dataOnFinish ? dataOnFinish(result) : {};
    perfLog(channel, `${label} finished`, {
      ms: Math.round(performance.now() - start),
      ...extra,
    });
    return result;
  } catch (err) {
    perfLog(channel, `${label} failed`, {
      ms: Math.round(performance.now() - start),
    });
    throw err;
  }
}

export type PerfActionKind =
  | "approve"
  | "reject"
  | "cancel"
  | "create";

export type PerfActionSurface = "dashboard" | "card";

export type PerfActionMeta = {
  action: PerfActionKind;
  surface: PerfActionSurface;
  cardId: string;
  entryId?: string;
};

/**
 * מודד callable + refresh + זמן עד UI settled (finally).
 */
export async function measurePerfEntryAction<T>(
  meta: PerfActionMeta,
  run: {
    callable: () => Promise<T>;
    refresh?: (result: T) => Promise<void>;
  }
): Promise<T> {
  if (!isPerfLoggingEnabled()) {
    const result = await run.callable();
    if (run.refresh) {
      await run.refresh(result);
    }
    return result;
  }

  const sessionStart = performance.now();
  let callableMs = 0;
  let refreshMs = 0;
  let success = false;

  perfLog("action", `${meta.action} started`, {
    action: meta.action,
    surface: meta.surface,
    cardId: meta.cardId,
    entryId: meta.entryId,
  });

  try {
    const callableStart = performance.now();
    const result = await run.callable();
    callableMs = Math.round(performance.now() - callableStart);
    perfLog("action", "callable finished", {
      action: meta.action,
      ms: callableMs,
      cardId: meta.cardId,
      entryId: meta.entryId,
    });

    if (run.refresh) {
      const refreshStart = performance.now();
      await run.refresh(result);
      refreshMs = Math.round(performance.now() - refreshStart);
      perfLog("action", "refresh finished", {
        action: meta.action,
        ms: refreshMs,
        cardId: meta.cardId,
        entryId: meta.entryId,
      });
    }

    success = true;
    return result;
  } finally {
    perfLog("action", "ui settled", {
      action: meta.action,
      surface: meta.surface,
      cardId: meta.cardId,
      entryId: meta.entryId,
      success,
      callableMs,
      refreshMs,
      totalMs: Math.round(performance.now() - sessionStart),
    });
  }
}
