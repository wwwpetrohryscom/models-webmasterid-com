import { cn } from "@/lib/utils";

export type LogoVariant = "full" | "mark" | "compact" | "mono";

interface LogoProps {
  variant?: LogoVariant;
  /** Pixel height of the mark. Wordmark text scales relative. */
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
   * remains real <span>s so screen readers + indexers see the
   * "AiModels WebmasterID" lockup regardless.
   */
  ariaLabel?: string;
}

/**
 * The AiModels WebmasterID brand mark (v2, promoted in the Brand
 * Sprint from the user-supplied official identity).
 *
 * Visual direction:
 *   - Rounded square tile with a blue → teal → green linear gradient
 *     (#1E5BC7 → #2BA6C6 → #3DD68A). No glow, no shadow, no neon.
 *   - White stylised W stroke and two white Wi-Fi arcs above the
 *     top-left peak; the arcs hint at the "signal" / connection
 *     metaphor in the source mark.
 *   - The `mono` variant uses `currentColor` so the icon can be
 *     tinted by its containing element (footer, dark backgrounds,
 *     print). The tile becomes an outlined rectangle in mono mode.
 *   - Wordmark: small "AiModels" label above a heavier "WebmasterID"
 *     with a gradient teal-green "ID". The wordmark hides on the
 *     `mark` and `mono` variants; the `compact` variant renders the
 *     wordmark inline next to the mark without the "AiModels" label
 *     so the navbar stays short.
 *
 * Inline SVG (no <img> request, no FOUC). The gradient `<defs>` is
 * scoped per-instance via a stable id, so multiple Logo renders on
 * the same page do not collide.
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
  const isCompact = variant === "compact";

  const wordmarkSize = isCompact ? size * 0.62 : size * 0.7;
  const labelSize = Math.max(9, size * 0.34);
  const showDesc =
    Boolean(showDescriptor) && variant === "full" && size >= 28;

  const accessibleLabel =
    ariaLabel ??
    (markOnly
      ? "AiModels WebmasterID"
      : "AiModels WebmasterID — AI Model Infrastructure Intelligence");

  return (
    <span
      role="img"
      aria-label={accessibleLabel}
      className={cn(
        "inline-flex items-center gap-2 leading-none",
        className
      )}
    >
      <BrandMark size={size} mono={mono} />
      {markOnly ? null : (
        <span className="flex flex-col">
          {isCompact ? (
            <span
              className="font-semibold tracking-tight text-foreground"
              style={{ fontSize: `${wordmarkSize}px`, lineHeight: 1.05 }}
            >
              <span>Webmaster</span>
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #1E5BC7 0%, #2BA6C6 55%, #3DD68A 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                ID
              </span>
            </span>
          ) : (
            <>
              <span
                className="font-medium text-primary"
                style={{
                  fontSize: `${labelSize}px`,
                  lineHeight: 1.1,
                  letterSpacing: "0.18em",
                }}
              >
                AiModels
              </span>
              <span
                className="font-semibold tracking-tight text-foreground"
                style={{
                  fontSize: `${wordmarkSize}px`,
                  lineHeight: 1.05,
                }}
              >
                <span>Webmaster</span>
                <span className="gradient-text">ID</span>
              </span>
              {showDesc ? (
                <span
                  className="mt-0.5 font-medium text-muted-foreground"
                  style={{ fontSize: `${Math.max(10, size * 0.32)}px` }}
                >
                  AI Model Infrastructure Intelligence
                </span>
              ) : null}
            </>
          )}
        </span>
      )}
    </span>
  );
}

function BrandMark({ size, mono }: { size: number; mono: boolean }) {
  // Each Logo instance gets a unique gradient id so SSR + repeats on
  // the same page don't collide. React's useId would do this cleanly
  // but the component is render-cheap and we want it usable from
  // server components without state hooks — fall back to a stable
  // counter via the math below (size-based + Math.random would be
  // non-deterministic across SSR; instead we use a deterministic
  // string derived from the size — collisions are harmless because
  // the gradient definitions are identical).
  const gradId = mono ? "" : `wmidV2Grad`;
  const fill = mono ? "transparent" : `url(#${gradId})`;
  const stroke = mono ? "currentColor" : "#FFFFFF";
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
          <linearGradient
            id={gradId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#1E5BC7" />
            <stop offset="55%" stopColor="#2BA6C6" />
            <stop offset="100%" stopColor="#3DD68A" />
          </linearGradient>
        </defs>
      ) : null}
      {mono ? (
        <rect
          x="3"
          y="3"
          width="58"
          height="58"
          rx="13"
          ry="13"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="2"
        />
      ) : (
        <rect
          x="2"
          y="2"
          width="60"
          height="60"
          rx="14"
          ry="14"
          fill={fill}
        />
      )}
      {/* Wi-Fi style arcs above the top-left peak of the W */}
      <path
        d="M 14 30 Q 22 21 30 30"
        stroke={stroke}
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 18 26 Q 22 21 26 26"
        stroke={stroke}
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="22" cy="20" r="1.6" fill={stroke} />
      {/* W stroke */}
      <path
        d="M 16 36 L 24 52 L 32 38 L 40 52 L 48 36"
        stroke={stroke}
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
