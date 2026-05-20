import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";

export const alt = `${siteConfig.name} — ${siteConfig.positioning}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "linear-gradient(135deg, #F7F8FC 0%, #EEF1FB 60%, #E6EBFB 100%)",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
          color: "#0F1729",
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: -0.4,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background:
                "linear-gradient(135deg, #2F5BEA 0%, #7C3AED 100%)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 800,
              boxShadow: "0 8px 16px -6px rgba(15,23,42,0.18)",
            }}
          >
            W
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span>{siteConfig.ecosystem}</span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: 999,
                background: "rgba(47, 91, 234, 0.12)",
                color: "#2F5BEA",
                border: "1px solid rgba(47, 91, 234, 0.25)",
              }}
            >
              {siteConfig.shortName}
            </span>
          </div>
        </div>

        {/* Title + subtitle */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1.04,
              maxWidth: 1040,
              color: "#0F1729",
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            <span>AI Model Infrastructure&nbsp;</span>
            <span
              style={{
                background:
                  "linear-gradient(135deg, #2F5BEA 0%, #7C3AED 100%)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Intelligence.
            </span>
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#475569",
              maxWidth: 980,
              lineHeight: 1.35,
              display: "flex",
            }}
          >
            Track AI models, providers, pricing, benchmarks, and inference
            infrastructure — in real time.
          </div>
        </div>

        {/* Footer row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 24,
            color: "#475569",
          }}
        >
          <span style={{ fontWeight: 600, color: "#0F1729" }}>
            {siteConfig.domain}
          </span>
          <span>Verified · timestamped · cited</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
