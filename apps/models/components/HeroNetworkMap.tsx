import { ProviderLogo } from "./ProviderLogo";
import { VerificationBadge } from "./VerificationBadge";
import { models, getModelBySlug } from "@/data/models";
import { getProviderBySlug } from "@/data/providers";
import { isVerified } from "@/lib/verified";

const HERO_SLUGS = [
  "claude-opus-4-7",
  "gemini-2-5-pro",
  "deepseek-v4-pro",
  "claude-sonnet-4-6",
] as const;

function formatContextTokens(value: number | null): string {
  if (value === null) return "—";
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `${m % 1 === 0 ? m : m.toFixed(1)}M ctx`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}k ctx`;
  }
  return `${value} ctx`;
}

export function HeroNetworkMap() {
  const featured = HERO_SLUGS.map((slug) => getModelBySlug(slug)).filter(
    (m): m is NonNullable<ReturnType<typeof getModelBySlug>> => Boolean(m)
  );
  // Fall back to whatever models exist if any slug went missing.
  const cards = (
    featured.length === HERO_SLUGS.length ? featured : models.slice(0, 4)
  ).slice(0, 4);

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl border border-border bg-card shadow-card"
      aria-label="Snapshot of verified models tracked by WebmasterID Models"
      role="img"
    >
      {/* Backdrop: subtle radial gradient + sparse grid. No floating overlap. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-subtle-grid data-grid opacity-40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 0%, hsl(222 89% 56% / 0.12), transparent 70%), radial-gradient(60% 50% at 100% 100%, hsl(262 83% 58% / 0.10), transparent 70%)",
        }}
      />

      {/* Connection web — pure SVG, drawn behind the card grid. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 400 400"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="heroLine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(222 89% 56% / 0.5)" />
            <stop offset="100%" stopColor="hsl(262 83% 58% / 0.35)" />
          </linearGradient>
        </defs>
        {/* Latitude rings */}
        {[110, 160, 200].map((r, i) => (
          <ellipse
            key={r}
            cx="200"
            cy="200"
            rx={r}
            ry={r * 0.55}
            fill="none"
            stroke="hsl(220 14% 80%)"
            strokeOpacity={0.32 - i * 0.05}
            strokeWidth="1"
          />
        ))}
        {/* Light connection lines */}
        {[
          [80, 110, 320, 140],
          [320, 140, 280, 290],
          [80, 110, 200, 220],
          [200, 220, 280, 290],
          [200, 220, 110, 290],
        ].map(([x1, y1, x2, y2], i) => (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="url(#heroLine)"
            strokeWidth="1.25"
          />
        ))}
        {/* Hotspot nodes */}
        {[
          [80, 110],
          [320, 140],
          [200, 220],
          [280, 290],
          [110, 290],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <circle
              cx={cx}
              cy={cy}
              r="7"
              fill="hsl(222 89% 56% / 0.16)"
            />
            <circle
              cx={cx}
              cy={cy}
              r="3"
              fill="hsl(222 89% 56%)"
            />
          </g>
        ))}
      </svg>

      {/* Card grid foreground — structured 2x2 layout, NEVER overlaps. */}
      <div className="relative grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 sm:gap-4 sm:p-6">
        {cards.map((m) => {
          const p = getProviderBySlug(m.providerSlug);
          const ctxLabel = isVerified(m.contextWindow)
            ? formatContextTokens(m.contextWindow.value)
            : "ctx —";
          return (
            <article
              key={m.slug}
              className="rounded-2xl border border-border bg-card/95 p-3 shadow-elevated backdrop-blur"
            >
              <header className="flex items-center gap-2.5">
                <ProviderLogo
                  slug={m.providerSlug}
                  name={p?.name ?? "Unknown"}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold leading-tight text-foreground">
                    {m.name}
                  </p>
                  <p className="truncate text-[11px] leading-tight text-muted-foreground">
                    {p?.name ?? "Unknown"}
                  </p>
                </div>
                <VerificationBadge status={m.verificationStatus} />
              </header>
              <div className="mt-2.5 flex items-center justify-between border-t border-border/70 pt-2 text-[11px] tabular-nums">
                <span className="text-muted-foreground">
                  {ctxLabel}
                </span>
                <span className="font-medium text-foreground">
                  {m.pricing.find((t) => t.unit === "1M input tokens" && isVerified(t.amount))
                    ? `$${
                        (() => {
                          const t = m.pricing.find(
                            (x) =>
                              x.unit === "1M input tokens" && isVerified(x.amount)
                          );
                          return t && isVerified(t.amount)
                            ? t.amount.value
                            : "—";
                        })()
                      }/MTok in`
                    : ""}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
