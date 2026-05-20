import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { JOIN_OG_FONT_FAMILY_FALLBACK } from "@/lib/invitations/joinOpenGraph";

export type JoinOgFontConfig = {
  family: string;
  fonts?: Array<{
    name: string;
    data: ArrayBuffer;
    weight: 500 | 600;
    style: "normal";
  }>;
};

const ASSISTANT_FAMILY = "Assistant";

let joinOgFontWarned = false;

function warnJoinOgFontOnce(message: string): void {
  if (joinOgFontWarned) {
    return;
  }
  joinOgFontWarned = true;
  console.warn(`[joinOgFont] ${message}`);
}

/** Safe fallback — never throws. */
export function fallbackJoinOgFontConfig(): JoinOgFontConfig {
  return { family: JOIN_OG_FONT_FAMILY_FALLBACK };
}

/**
 * Loads Assistant .woff2 emitted by next/font during `next build` (local disk only).
 * Returns null on any failure — never throws.
 */
export function loadJoinOgAssistantFont(): ArrayBuffer | null {
  if (process.env.NEXT_RUNTIME === "edge") {
    warnJoinOgFontOnce("edge runtime — skipping fs; using fallback stack");
    return null;
  }

  try {
    const mediaDir = join(process.cwd(), ".next/static/media");
    if (!existsSync(mediaDir)) {
      return null;
    }

    const woff2Files = readdirSync(mediaDir).filter((name) =>
      name.endsWith(".woff2")
    );
    if (woff2Files.length === 0) {
      return null;
    }

    const candidates = woff2Files
      .map((name) => {
        const filePath = join(mediaDir, name);
        const size = statSync(filePath).size;
        return { filePath, size };
      })
      .filter((entry) => entry.size > 0);

    if (candidates.length === 0) {
      return null;
    }

    const largest = candidates.sort((a, b) => b.size - a.size)[0];
    const buf = readFileSync(largest.filePath);
    if (buf.length === 0) {
      return null;
    }

    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown error";
    warnJoinOgFontOnce(
      `Assistant load failed (${detail}); using fallback stack`
    );
    return null;
  }
}

/** Resolves OG font config — never throws. */
export function resolveJoinOgFontConfig(): JoinOgFontConfig {
  try {
    const data = loadJoinOgAssistantFont();
    if (!data || data.byteLength === 0) {
      warnJoinOgFontOnce(
        "no usable Assistant woff2 in .next/static/media; using fallback stack"
      );
      return fallbackJoinOgFontConfig();
    }

    return {
      family: ASSISTANT_FAMILY,
      fonts: [
        { name: ASSISTANT_FAMILY, data, weight: 600, style: "normal" },
        { name: ASSISTANT_FAMILY, data, weight: 500, style: "normal" },
      ],
    };
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown error";
    warnJoinOgFontOnce(
      `resolve failed (${detail}); using fallback stack`
    );
    return fallbackJoinOgFontConfig();
  }
}
