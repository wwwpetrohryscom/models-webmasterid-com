import Link from "next/link";
import type { ResourceFinderSummary } from "@/lib/resource-graph";
import { RESOURCE_LABELS, RESOURCE_STAGES } from "@/lib/resource-graph";

const STAGE_DESCRIPTIONS: Record<string, string> = {
  learn:
    "Plain-language concept lessons + audience entry points + role-based learning paths.",
  apply:
    "Exercises + selection / comparison workspaces + guided demos that produce a working URL.",
  verify:
    "Source freshness + lifecycle inspection + reverification queue + coverage audit.",
  test:
    "Lab playbooks + evaluation prompt sets the reader runs in their own harness.",
  package:
    "Decision brief + Markdown templates + workflow kits + outcome flows that ship a paste-ready artifact.",
};

/**
 * ResourceStageMap — renders the product loop
 * Learn → Apply → Verify → Test → Package with per-stage counts and
 * a link into the filtered /resources view. Server component.
 */
export function ResourceStageMap({
  summary,
  title = "Learn → Apply → Verify → Test → Package",
}: {
  summary: ResourceFinderSummary;
  title?: string;
}) {
  return (
    <section
      aria-label={title}
      className="card-surface space-y-4 p-5 text-sm not-prose"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Stage map
        </p>
        <p className="mt-1 text-base font-semibold text-foreground">
          {title}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Every product surface lives at exactly one stage. The graph
          counts the resources at each stage so the reader can scan
          where the next step lives.
        </p>
      </div>
      <ol className="grid gap-3 md:grid-cols-5">
        {RESOURCE_STAGES.map((stage, idx) => (
          <li
            key={stage}
            className="rounded-xl border border-border bg-card p-3"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Step {idx + 1}
            </p>
            <p className="mt-1 text-base font-semibold text-foreground">
              {RESOURCE_LABELS.stages[stage]}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {STAGE_DESCRIPTIONS[stage]}
            </p>
            <p className="mt-2 text-xs">
              <Link
                href={`/resources?stage=${stage}`}
                className="text-primary hover:underline"
              >
                {summary.byStage[stage]} resources →
              </Link>
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
