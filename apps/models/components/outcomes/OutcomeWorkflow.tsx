import Link from "next/link";
import type { OutcomeUseCaseWorkflowStep } from "@/lib/outcome-use-cases";

/**
 * OutcomeWorkflow — numbered vertical workflow strip for the
 * outcome page. Each step opens a route that already exists; the
 * outcome page never owns a parallel UI. Server component.
 */
export function OutcomeWorkflow({
  steps,
  title = "Suggested workflow",
}: {
  steps: OutcomeUseCaseWorkflowStep[];
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
      <p className="text-xs text-muted-foreground">
        Open each step in order. Every route already exists — no
        parallel UI, no duplicated content.
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
                {step.label}
              </p>
            </div>
            <p className="mt-2">
              <Link
                href={step.href}
                className="inline-flex items-center text-xs font-medium text-primary hover:underline"
              >
                Open{" "}
                <code className="ml-1 rounded bg-muted px-1 py-0.5 text-[10px] text-foreground">
                  {step.href}
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
