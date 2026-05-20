import { ImageResponse } from "next/og";
import {
  JOIN_OG_IMAGE_ALT,
  JOIN_OG_IMAGE_HEADLINE,
  JOIN_OG_IMAGE_TAGLINE,
} from "@/lib/invitations/joinOpenGraph";

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

async function loadAssistantSemiBold(): Promise<ArrayBuffer> {
  const css = await fetch(
    "https://fonts.googleapis.com/css2?family=Assistant:wght@600&display=swap",
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    }
  ).then((res) => res.text());

  const woff2 = css.match(
    /src:\s*url\(([^)]+)\)\s*format\('woff2'\)/
  )?.[1];
  const woff = css.match(/src:\s*url\(([^)]+)\)\s*format\('woff'\)/)?.[1];
  const fontUrl = woff2 ?? woff;
  if (!fontUrl) {
    throw new Error("Assistant font URL not found for OG image");
  }

  return fetch(fontUrl).then((res) => res.arrayBuffer());
}

/** תמונת OG סטטית — ללא token, ללא Firebase, ללא נתוני משתמש/כרטיס. */
export default async function JoinOpenGraphImage() {
  const fontData = await loadAssistantSemiBold();

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
          fontFamily: "Assistant",
          direction: "rtl",
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
            background: `radial-gradient(circle, rgba(194,176,146,0.14) 0%, transparent 70%)`,
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
              gap: 20,
              marginBottom: 40,
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
                border: `1px solid rgba(194,176,146,0.28)`,
                background: "rgba(201,184,150,0.075)",
              }}
            >
              <svg
                width="44"
                height="44"
                viewBox="0 0 32 32"
                fill="none"
              >
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
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 600,
              color: COLORS.pearl,
              textAlign: "center",
              lineHeight: 1.2,
              marginBottom: 20,
            }}
          >
            {JOIN_OG_IMAGE_HEADLINE}
          </div>
          <div
            style={{
              fontSize: 34,
              fontWeight: 600,
              color: COLORS.champagne,
              textAlign: "center",
              lineHeight: 1.35,
            }}
          >
            {JOIN_OG_IMAGE_TAGLINE}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Assistant",
          data: fontData,
          style: "normal",
          weight: 600,
        },
      ],
    }
  );
}
