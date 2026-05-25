import Link from "next/link";
import type { ResourceFinderSummary } from "@/lib/resource-graph";
import { RESOURCE_LABELS, RESOURCE_STAGES } from "@/lib/resource-graph";

/**
 * ResourceSummaryCards — total + per-stage counters at the top of
 * the resource finder. Each per-stage card links into the filtered
 * /resources view. Server component.
 */
export function ResourceSummaryCards({
  summary,
}: {
  summary: ResourceFinderSummary;
}) {
  return (
    <section
      aria-label="Resource counts"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6"
    >
      <div className="card-surface p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Total resources
        </p>
        <p className="mt-1 text-2xl font-semibold text-foreground">
          {summary.total}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Lessons, exercises, paths, lab tools, kits, outcomes,
          audiences, demos, workspaces, evidence examples.
        </p>
      </div>
      {RESOURCE_STAGES.map((stage) => (
        <Link
          key={stage}
          href={`/resources?stage=${stage}`}
          className="card-surface block p-4 transition hover:border-primary/30"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {RESOURCE_LABELS.stages[stage]} stage
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {summary.byStage[stage]}
          </p>
          <p className="mt-1 text-[11px] text-primary">
            Open filtered view →
          </p>
        </Link>
      ))}
    </section>
  );
}
