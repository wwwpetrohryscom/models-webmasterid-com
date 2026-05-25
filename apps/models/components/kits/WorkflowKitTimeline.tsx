import Link from "next/link";
import type { WorkflowKitRouteStep } from "@/lib/workflow-kits";

/**
 * WorkflowKitTimeline — numbered, vertical timeline of the kit
 * steps. Each step renders title, instruction, route link, and
 * the output the step produces. Server component, no client JS.
 */
export function WorkflowKitTimeline({
  steps,
  title = "Step-by-step workflow",
}: {
  steps: WorkflowKitRouteStep[];
  title?: string;
}) {
  return (
    <section
      aria-label={title}
      className="card-surface space-y-3 p-5 text-sm not-prose"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {title}
      </p>
      <ol className="space-y-3">
        {steps.map((step) => (
          <li
            key={step.step}
            className="rounded-xl border border-border bg-card p-3"
          >
            <div className="flex flex-wrap items-baseline gap-2">
              <span
                aria-hidden="true"
                className="grid h-6 w-6 flex-none place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
              >
                {step.step}
              </span>
              <p className="text-base font-semibold text-foreground">
                {step.title}
              </p>
            </div>
            <p className="mt-2 text-muted-foreground">{step.instruction}</p>
            <p className="mt-2">
              <Link
                href={step.route}
                className="inline-flex items-center text-xs font-medium text-primary hover:underline"
              >
                Open{" "}
                <code className="ml-1 rounded bg-muted px-1 py-0.5 text-[10px] text-foreground">
                  {step.route}
                </code>{" "}
                →
              </Link>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Output:</span>{" "}
              {step.output}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
