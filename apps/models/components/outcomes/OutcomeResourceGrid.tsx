import Link from "next/link";
import type {
  OutcomeUseCase,
  OutcomeUseCaseResource,
} from "@/lib/outcome-use-cases";

function ResourceColumn({
  title,
  resources,
}: {
  title: string;
  resources: OutcomeUseCaseResource[];
}) {
  if (!resources.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <ul className="mt-2 space-y-2">
        {resources.map((r) => (
          <li key={r.href}>
            <Link
              href={r.href}
              className="block rounded-lg border border-border bg-card p-2.5 transition hover:border-primary/30"
            >
              <p className="text-sm font-semibold text-foreground">
                {r.label} →
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {r.purpose}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * OutcomeResourceGrid — renders the five resource columns the
 * outcome page routes the reader through (learn, exercises, lab
 * playbooks, prompt sets, workflow kits). Server component.
 */
export function OutcomeResourceGrid({
  outcome,
  title = "Routes into the product",
}: {
  outcome: OutcomeUseCase;
  title?: string;
}) {
  return (
    <section
      aria-label={title}
      className="card-surface space-y-4 p-5 text-sm not-prose"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {title}
      </p>
      <p className="text-xs text-muted-foreground">
        Each entry opens an existing route. The outcome page is a
        product entry point, not a parallel surface.
      </p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ResourceColumn title="What to learn" resources={outcome.whatToLearn} />
        <ResourceColumn title="Exercises" resources={outcome.exercises} />
        <ResourceColumn title="Lab playbooks" resources={outcome.labPlaybooks} />
        <ResourceColumn title="Evaluation prompt sets" resources={outcome.promptSets} />
        <ResourceColumn title="Workflow kits" resources={outcome.workflowKits} />
      </div>
    </section>
  );
}
