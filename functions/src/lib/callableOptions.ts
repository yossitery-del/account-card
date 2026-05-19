import {FUNCTIONS_REGION} from "./admin";

/**
 * minInstances only on critical entry mutation callables.
 * Reduces cold-start latency without warming invite, preview, or account setup.
 */
export const WARMED_ENTRY_CALLABLE_OPTIONS = {
  region: FUNCTIONS_REGION,
  minInstances: 1,
} as const;
