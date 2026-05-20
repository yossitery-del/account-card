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

/** Fake in-app UI — static placeholders only (forOgHebrew for Satori). */
const MOCK_APP_BRAND = forOgHebrew("כרטיס חשבון");
const MOCK_APP_STATUS = forOgHebrew("אין פעולות לביצוע");
const MOCK_APP_CTA = forOgHebrew("הוסף פעולה");

export const alt = JOIN_OG_IMAGE_ALT;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COLORS = {
  vaultBlack: "#0e0f0d",
  deepSurface: "#171815",
  vaultGraphite: "#1c1d19",
  vaultElevated: "#242520",
  pearl: "#f7f5f0",
  mist: "#ada9a0",
  champagne: "#c2b092",
  goldGreen: "#b0a882",
  glassBorder: "rgba(194, 176, 146, 0.22)",
  glassSurface: "rgba(201, 184, 150, 0.08)",
  skeleton: "rgba(173, 169, 160, 0.22)",
} as const;

function safeJoinOgFontConfig(): JoinOgFontConfig {
  try {
    return resolveJoinOgFontConfig();
  } catch {
    return fallbackJoinOgFontConfig();
  }
}

function BrandIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
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
  );
}

function PhoneMockup() {
  return (
    <div
      style={{
        display: "flex",
        transform: "rotate(-9deg)",
        marginTop: 24,
        marginRight: -8,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: 296,
          height: 568,
          borderRadius: 38,
          padding: 11,
          background: `linear-gradient(145deg, ${COLORS.vaultGraphite} 0%, ${COLORS.vaultBlack} 100%)`,
          border: `2px solid rgba(194, 176, 146, 0.32)`,
          boxShadow:
            "0 40px 90px rgba(0,0,0,0.55), 0 0 0 1px rgba(194,176,146,0.08), inset 0 1px 0 rgba(194,176,146,0.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            borderRadius: 28,
            overflow: "hidden",
            background: COLORS.deepSurface,
            border: `1px solid ${COLORS.glassBorder}`,
          }}
        >
          <div
            style={{
              display: "flex",
              height: 28,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 72,
                height: 6,
                borderRadius: 8,
                background: "rgba(194, 176, 146, 0.12)",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              padding: "14px 18px 10px",
            }}
          >
            <BrandIcon size={26} />
            <div
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: COLORS.pearl,
                letterSpacing: "-0.02em",
              }}
            >
              {MOCK_APP_BRAND}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              padding: "0 18px 14px",
              fontSize: 12,
              fontWeight: 500,
              color: COLORS.mist,
            }}
          >
            {MOCK_APP_STATUS}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              margin: "0 16px",
              padding: 18,
              borderRadius: 18,
              border: `1px solid ${COLORS.glassBorder}`,
              background: COLORS.glassSurface,
              boxShadow: "inset 0 1px 0 rgba(194,176,146,0.1)",
            }}
          >
            <div
              style={{
                width: 88,
                height: 10,
                borderRadius: 5,
                background: COLORS.skeleton,
                marginBottom: 14,
              }}
            />
            <div
              style={{
                width: "100%",
                height: 8,
                borderRadius: 4,
                background: COLORS.skeleton,
                marginBottom: 10,
              }}
            />
            <div
              style={{
                width: "78%",
                height: 8,
                borderRadius: 4,
                background: "rgba(173, 169, 160, 0.14)",
              }}
            />
          </div>
          <div style={{ display: "flex", flex: 1 }} />
          <div
            style={{
              display: "flex",
              margin: "0 16px 20px",
              padding: "13px 20px",
              borderRadius: 999,
              border: `1px solid rgba(194, 176, 146, 0.38)`,
              background: "rgba(201, 184, 150, 0.12)",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 14,
              fontWeight: 600,
              color: COLORS.pearl,
              boxShadow: "0 4px 20px rgba(201,184,150,0.08)",
            }}
          >
            {MOCK_APP_CTA}
          </div>
        </div>
      </div>
    </div>
  );
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
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "48px 56px 48px 64px",
            background: `linear-gradient(118deg, ${COLORS.vaultBlack} 0%, ${COLORS.deepSurface} 38%, ${COLORS.vaultGraphite} 72%, ${COLORS.vaultBlack} 100%)`,
            fontFamily: ogFont.family,
            direction: "ltr",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -100,
              left: -60,
              width: 380,
              height: 380,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(194,176,146,0.11) 0%, transparent 68%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -140,
              right: 120,
              width: 480,
              height: 480,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(176,168,130,0.08) 0%, transparent 70%)",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              maxWidth: 520,
              zIndex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  border: "1px solid rgba(194,176,146,0.28)",
                  background: "rgba(201,184,150,0.07)",
                }}
              >
                <BrandIcon size={26} />
              </div>
              <div
                style={{
                  width: 48,
                  height: 2,
                  background: `linear-gradient(90deg, ${COLORS.champagne}, transparent)`,
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                color: COLORS.pearl,
                fontSize: 46,
                fontWeight: 600,
                letterSpacing: "-0.03em",
                lineHeight: 1.12,
                marginBottom: 16,
              }}
            >
              {OG_HEADLINE}
            </div>
            <div
              style={{
                display: "flex",
                color: COLORS.champagne,
                fontSize: 30,
                fontWeight: 500,
                letterSpacing: "-0.01em",
                lineHeight: 1.28,
                marginBottom: 14,
              }}
            >
              {OG_TAGLINE}
            </div>
            <div
              style={{
                display: "flex",
                color: COLORS.mist,
                fontSize: 20,
                fontWeight: 500,
                letterSpacing: "0.03em",
                lineHeight: 1.35,
              }}
            >
              {OG_SUBLINE}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <PhoneMockup />
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
