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
              width: 64,
              height: 64,
              borderRadius: 14,
              background:
                "linear-gradient(135deg, #1E5BC7 0%, #2BA6C6 55%, #3DD68A 100%)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 800,
              boxShadow: "0 8px 16px -6px rgba(15,23,42,0.18)",
            }}
          >
            W
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
            <span style={{ color: "#1E5BC7", letterSpacing: 2 }}>
              AiModels
            </span>
            <span style={{ fontWeight: 800, color: "#0B1E3A" }}>
              Webmaster
              <span style={{ color: "#2BA6C6" }}>ID</span>
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
                  "linear-gradient(135deg, #1E5BC7 0%, #2BA6C6 55%, #3DD68A 100%)",
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
