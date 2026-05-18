import {FUNCTIONS_REGION} from "./admin";

/**
 * minInstances only on createEntry / approveEntry / rejectEntry — the critical
 * entry mutation path (create + dashboard/card approve/reject). Reduces cold-start
 * latency without warming invite, preview, account setup, or edit/cancel callables.
 */
export const WARMED_ENTRY_CALLABLE_OPTIONS = {
  region: FUNCTIONS_REGION,
  minInstances: 1,
} as const;
