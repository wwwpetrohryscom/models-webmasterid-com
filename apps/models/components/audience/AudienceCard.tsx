import Link from "next/link";
import type { AudiencePage } from "@/lib/audiences";

/**
 * AudienceCard — summary card for an audience entry point.
 * Used on the homepage audience grid and on the /for hub.
 * Server component, no client JS.
 */
export function AudienceCard({
  audience,
}: {
  audience: AudiencePage;
}) {
  return (
    <Link
      href={`/for/${audience.slug}`}
      className="card-surface block h-full space-y-2 p-4 transition hover:border-primary/30 hover:shadow-elevated"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {audience.title}
      </p>
      <p className="text-base font-semibold text-foreground">
        {audience.headline}
      </p>
      <p className="text-sm text-muted-foreground">{audience.summary}</p>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {audience.artifactsYouCanProduce.slice(0, 3).map((a) => (
          <span
            key={a}
            className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-foreground"
          >
            {a}
          </span>
        ))}
        {audience.artifactsYouCanProduce.length > 3 ? (
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            +{audience.artifactsYouCanProduce.length - 3} more
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs font-medium text-primary">
        Open audience page →
      </p>
    </Link>
  );
}
