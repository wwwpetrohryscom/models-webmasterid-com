import { cn } from "@/lib/utils";

export type LogoVariant = "full" | "mark" | "compact" | "mono";

interface LogoProps {
  variant?: LogoVariant;
  /** Pixel height of the mark. Wordmark and descriptor scale relative. */
  size?: number;
  /**
   * Render the "AI Model Infrastructure Intelligence" descriptor under
   * the wordmark. Only honoured by the `full` variant and ignored when
   * height is below the readable threshold.
   */
  showDescriptor?: boolean;
  className?: string;
  /**
   * Optional explicit accessible label. When omitted, the component
   * picks an appropriate one based on the variant. The wordmark text
   * remains real <span>s so screen readers + indexers see "WebmasterID
   * Models" regardless.
   */
  ariaLabel?: string;
}

/**
 * The WebmasterID Models brand mark.
 *
 * Visual direction (Concept 1 — approved):
 *   - W/M monogram constructed from a single stroked path so it reads
 *     as W upright and as M when flipped vertically.
 *   - Blue (#2563EB) → violet (#7C3AED) gradient applied to the stroke
 *     and node fills. No glow, no shadow, no neon.
 *   - Five filled circles sit at the joints of the W path; one smaller
 *     accent node above hints at the network/intelligence layer.
 *   - The `mono` variant uses `currentColor` so the icon can be tinted
 *     by its containing element (footer, dark backgrounds, print).
 *
 * The component renders inline SVG (no <img> request, no FOUC). All
 * variants share a single gradient definition that is safe to repeat
 * across instances on the same page.
 */
export function Logo({
  variant = "full",
  size = 28,
  showDescriptor,
  className,
  ariaLabel,
}: LogoProps) {
  const markOnly = variant === "mark" || variant === "mono";
  const mono = variant === "mono";

  const wordmarkSize = variant === "compact" ? size * 0.55 : size * 0.6;
  const showDesc =
    Boolean(showDescriptor) && variant === "full" && size >= 28;

  const accessibleLabel =
    ariaLabel ??
    (markOnly
      ? "WebmasterID Models"
      : `WebmasterID Models — AI Model Infrastructure Intelligence`);

  return (
    <span
      role="img"
      aria-label={accessibleLabel}
      className={cn(
        "inline-flex items-center gap-2 leading-none",
        className
      )}
    >
      <WMidMark size={size} mono={mono} />
      {markOnly ? null : (
        <span className="flex flex-col">
          <span
            className="font-semibold tracking-tight text-foreground"
            style={{ fontSize: `${wordmarkSize}px`, lineHeight: 1.05 }}
          >
            <span>WebmasterID</span>{" "}
            <span className="gradient-text">Models</span>
          </span>
          {showDesc ? (
            <span
              className="mt-0.5 font-medium text-muted-foreground"
              style={{ fontSize: `${Math.max(10, size * 0.32)}px` }}
            >
              AI Model Infrastructure Intelligence
            </span>
          ) : null}
        </span>
      )}
    </span>
  );
}

function WMidMark({ size, mono }: { size: number; mono: boolean }) {
  // 64x64 viewBox; gradient ID is global per page — duplicate definitions
  // across instances resolve to the same gradient at render time.
  const stroke = mono ? "currentColor" : "url(#wmidGrad)";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      style={mono ? { color: "currentColor" } : undefined}
    >
      {!mono ? (
        <defs>
          <linearGradient id="wmidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
      ) : null}
      <line
        x1="32"
        y1="10"
        x2="32"
        y2="22"
        stroke={stroke}
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path
        d="M 10 18 L 20 46 L 32 24 L 44 46 L 54 18"
        stroke={stroke}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="10" cy="18" r="3" fill={stroke} />
      <circle cx="20" cy="46" r="3" fill={stroke} />
      <circle cx="32" cy="24" r="3" fill={stroke} />
      <circle cx="44" cy="46" r="3" fill={stroke} />
      <circle cx="54" cy="18" r="3" fill={stroke} />
      <circle cx="32" cy="8" r="2.5" fill={stroke} opacity="0.7" />
    </svg>
  );
}
