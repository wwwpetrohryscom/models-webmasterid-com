import Link from "next/link";

/**
 * Compact stat card for the homepage "Current verified coverage" strip.
 * Renders a single number derived from local data + a one-line caption,
 * optionally linking to the relevant hub.
 *
 * Used only with counts that come from the typed local data layer.
 * Never use this to display unverified per-model metrics.
 */
export function ContentStatCard({
  label,
  value,
  caption,
  href,
}: {
  label: string;
  value: number | string;
  caption?: string;
  href?: string;
}) {
  const inner = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
      {caption ? (
        <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
      ) : null}
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="card-surface block h-full p-4 transition hover:border-primary/30 hover:shadow-elevated"
      >
        {inner}
      </Link>
    );
  }
  return <div className="card-surface h-full p-4">{inner}</div>;
}
