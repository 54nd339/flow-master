import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const alt = "FlowMaster — Numberlink Puzzle Game";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
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
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          fontFamily: "system-ui, sans-serif",
          gap: 32,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            borderRadius: 28,
            background: "linear-gradient(135deg, #1e293b, #334155)",
          }}
        >
          <svg
            width="72"
            height="72"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 40 40 Q 100 0, 160 40 T 220 40"
              stroke="#38bdf8"
              strokeWidth="18"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 40 100 Q 100 60, 160 100 T 200 100"
              stroke="#818cf8"
              strokeWidth="18"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="160" cy="40" r="14" fill="#38bdf8" />
            <circle cx="160" cy="100" r="14" fill="#818cf8" />
            <circle cx="40" cy="140" r="14" fill="#f8fafc" />
          </svg>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "#f8fafc",
              letterSpacing: "-0.02em",
            }}
          >
            FlowMaster
          </span>
          <span
            style={{
              fontSize: 24,
              color: "#94a3b8",
              fontWeight: 400,
            }}
          >
            Numberlink puzzle generator &amp; player
          </span>
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 8,
          }}
        >
          {["Daily Challenge", "Campaign", "Free Play", "Time Attack"].map((mode) => (
            <span
              key={mode}
              style={{
                fontSize: 16,
                color: "#64748b",
                background: "rgba(255,255,255,0.05)",
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {mode}
            </span>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
