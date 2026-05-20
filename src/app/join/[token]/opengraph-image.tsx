import { ImageResponse } from "next/og";
import {
  forOgHebrew,
  JOIN_OG_IMAGE_ALT,
  JOIN_OG_IMAGE_HEADLINE,
  JOIN_OG_IMAGE_SUBLINE,
  JOIN_OG_IMAGE_TAGLINE,
} from "@/lib/invitations/joinOpenGraph";
import {
  fallbackJoinOgFontConfig,
  resolveJoinOgFontConfig,
  type JoinOgFontConfig,
} from "@/lib/invitations/joinOgFont";

/** OG image uses fs for build-emitted fonts — Node.js only (not Edge). */
export const runtime = "nodejs";

const OG_HEADLINE = forOgHebrew(JOIN_OG_IMAGE_HEADLINE);
const OG_TAGLINE = forOgHebrew(JOIN_OG_IMAGE_TAGLINE);
const OG_SUBLINE = forOgHebrew(JOIN_OG_IMAGE_SUBLINE);

export const alt = JOIN_OG_IMAGE_ALT;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COLORS = {
  vaultBlack: "#0e0f0d",
  deepSurface: "#171815",
  vaultGraphite: "#1c1d19",
  pearl: "#f7f5f0",
  mist: "#ada9a0",
  champagne: "#c2b092",
  goldGreen: "#b0a882",
  glassBorder: "rgba(194, 176, 146, 0.22)",
  glassSurface: "rgba(201, 184, 150, 0.08)",
} as const;

const OG_TEXT = {
  headline: {
    fontSize: 50,
    fontWeight: 600,
    letterSpacing: "-0.03em",
    lineHeight: 1.15,
    marginBottom: 20,
  },
  tagline: {
    fontSize: 34,
    fontWeight: 500,
    letterSpacing: "-0.01em",
    lineHeight: 1.3,
    marginBottom: 18,
  },
  subline: {
    fontSize: 22,
    fontWeight: 500,
    letterSpacing: "0.04em",
    lineHeight: 1.35,
  },
} as const;

function safeJoinOgFontConfig(): JoinOgFontConfig {
  try {
    return resolveJoinOgFontConfig();
  } catch {
    return fallbackJoinOgFontConfig();
  }
}

/** תמונת OG סטטית — ללא token, ללא Firebase, ללא fetch חיצוני. */
export default function JoinOpenGraphImage() {
  const ogFont = safeJoinOgFontConfig();
  const imageOptions = ogFont.fonts ? { ...size, fonts: ogFont.fonts } : { ...size };

  try {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(165deg, ${COLORS.vaultBlack} 0%, ${COLORS.deepSurface} 42%, ${COLORS.vaultGraphite} 100%)`,
            fontFamily: ogFont.family,
            direction: "ltr",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -120,
              right: -80,
              width: 420,
              height: 420,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(194,176,146,0.14) 0%, transparent 70%)",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: 920,
              padding: "56px 64px",
              borderRadius: 32,
              border: `1px solid ${COLORS.glassBorder}`,
              background: COLORS.glassSurface,
              boxShadow:
                "0 24px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(194,176,146,0.12)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 72,
                height: 72,
                borderRadius: 18,
                border: "1px solid rgba(194,176,146,0.28)",
                background: "rgba(201,184,150,0.075)",
                marginBottom: 40,
              }}
            >
              <svg width="44" height="44" viewBox="0 0 32 32" fill="none">
                <rect
                  x="7"
                  y="6"
                  width="18"
                  height="20"
                  rx="4"
                  stroke={COLORS.champagne}
                  strokeWidth="1.7"
                />
                <path
                  d="M11 12.5h10M11 17h7"
                  stroke={COLORS.mist}
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
                <path
                  d="M21.5 20.5l2 2 3.5-4"
                  stroke={COLORS.goldGreen}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div
              style={{
                color: COLORS.pearl,
                textAlign: "center",
                ...OG_TEXT.headline,
              }}
            >
              {OG_HEADLINE}
            </div>
            <div
              style={{
                color: COLORS.champagne,
                textAlign: "center",
                ...OG_TEXT.tagline,
              }}
            >
              {OG_TAGLINE}
            </div>
            <div
              style={{
                color: COLORS.mist,
                textAlign: "center",
                ...OG_TEXT.subline,
              }}
            >
              {OG_SUBLINE}
            </div>
          </div>
        </div>
      ),
      imageOptions
    );
  } catch (err) {
    console.error("[join/opengraph-image] ImageResponse failed:", err);
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: COLORS.vaultBlack,
            color: COLORS.pearl,
            fontFamily: ogFont.family,
            fontSize: 48,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            direction: "ltr",
          }}
        >
          {OG_HEADLINE}
        </div>
      ),
      imageOptions
    );
  }
}
