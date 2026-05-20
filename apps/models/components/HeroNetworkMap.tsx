import { ProviderLogoBadge } from "./ProviderLogoBadge";
import { VerificationBadge } from "./VerificationBadge";

type FloatingModel = {
  slug: string;
  name: string;
  providerSlug: string;
  providerName: string;
  position: { top: string; left: string };
};

const floating: FloatingModel[] = [
  {
    slug: "gpt-5",
    name: "OpenAI GPT-5",
    providerSlug: "openai",
    providerName: "OpenAI",
    position: { top: "8%", left: "6%" },
  },
  {
    slug: "claude-opus-4",
    name: "Claude Opus 4",
    providerSlug: "anthropic",
    providerName: "Anthropic",
    position: { top: "22%", left: "70%" },
  },
  {
    slug: "gemini-2-5-pro",
    name: "Gemini 2.5 Pro",
    providerSlug: "google",
    providerName: "Google",
    position: { top: "60%", left: "4%" },
  },
  {
    slug: "deepseek-r1",
    name: "DeepSeek R1-0520",
    providerSlug: "deepseek",
    providerName: "DeepSeek",
    position: { top: "76%", left: "62%" },
  },
  {
    slug: "llama-4-scout",
    name: "Llama 4 Scout",
    providerSlug: "meta",
    providerName: "Meta",
    position: { top: "44%", left: "78%" },
  },
  {
    slug: "mistral-large-2",
    name: "Mistral Large 2",
    providerSlug: "mistral",
    providerName: "Mistral",
    position: { top: "50%", left: "30%" },
  },
];

export function HeroNetworkMap() {
  return (
    <div
      className="relative aspect-square w-full overflow-hidden rounded-3xl border border-border bg-card shadow-card"
      aria-label="Visualization of tracked AI model providers across global inference infrastructure"
      role="img"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-subtle-grid data-grid opacity-50"
      />

      <svg
        aria-hidden="true"
        viewBox="0 0 400 400"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <radialGradient id="globeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(222 89% 56% / 0.18)" />
            <stop offset="60%" stopColor="hsl(262 83% 58% / 0.06)" />
            <stop offset="100%" stopColor="hsl(222 89% 56% / 0)" />
          </radialGradient>
          <linearGradient id="netLine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(222 89% 56% / 0.45)" />
            <stop offset="100%" stopColor="hsl(262 83% 58% / 0.35)" />
          </linearGradient>
        </defs>

        <circle cx="200" cy="200" r="180" fill="url(#globeGlow)" />

        {/* Latitude rings */}
        {[60, 110, 160, 200, 240, 290, 340].map((r, i) => (
          <ellipse
            key={r}
            cx="200"
            cy="200"
            rx="160"
            ry={r - 60 + 30}
            fill="none"
            stroke="hsl(220 14% 80%)"
            strokeOpacity={0.4 - i * 0.04}
            strokeWidth="1"
          />
        ))}
        {/* Longitudes */}
        {[40, 80, 120, 160, 200, 240, 280, 320, 360].map((cx) => (
          <ellipse
            key={cx}
            cx="200"
            cy="200"
            rx={(cx - 200) / 1.2}
            ry="160"
            fill="none"
            stroke="hsl(220 14% 82%)"
            strokeOpacity="0.35"
            strokeWidth="1"
          />
        ))}

        {/* Outer ring */}
        <circle
          cx="200"
          cy="200"
          r="160"
          fill="none"
          stroke="hsl(222 89% 56% / 0.45)"
          strokeWidth="1.25"
        />

        {/* Connection lines between hotspot nodes */}
        {[
          [80, 110, 320, 140],
          [320, 140, 300, 280],
          [80, 110, 200, 220],
          [200, 220, 300, 280],
          [200, 220, 90, 290],
        ].map(([x1, y1, x2, y2], i) => (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="url(#netLine)"
            strokeWidth="1.25"
          />
        ))}

        {/* Hotspot nodes */}
        {[
          [80, 110],
          [320, 140],
          [200, 220],
          [300, 280],
          [90, 290],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="8" fill="hsl(222 89% 56% / 0.15)" />
            <circle cx={cx} cy={cy} r="3.5" fill="hsl(222 89% 56%)" />
          </g>
        ))}
      </svg>

      {/* Floating model cards */}
      {floating.map((m) => (
        <div
          key={m.slug}
          className="absolute w-44 rounded-xl border border-border bg-card/95 p-2.5 shadow-elevated backdrop-blur"
          style={{ top: m.position.top, left: m.position.left }}
        >
          <div className="flex items-center gap-2">
            <ProviderLogoBadge
              slug={m.providerSlug}
              name={m.providerName}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-foreground">
                {m.name}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">
                {m.providerName}
              </p>
            </div>
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Metrics</span>
            <VerificationBadge status="partial" />
          </div>
        </div>
      ))}
    </div>
  );
}
