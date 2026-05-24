import Link from "next/link";

export interface WorkflowBridgeStep {
  label: string;
  href: string;
  purpose: string;
}

/**
 * WorkflowBridge — connects a concept lesson directly to the
 * workspace surfaces that apply, verify, and test it. Pure server
 * component, no client JS.
 */
export function WorkflowBridge({
  steps,
  title = "Concept → workflow bridge",
}: {
  steps: WorkflowBridgeStep[];
  title?: string;
}) {
  if (!steps.length) return null;
  return (
    <section
      aria-label={title}
      className="card-surface space-y-3 p-5 text-sm not-prose"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {title}
      </p>
      <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, i) => (
          <li
            key={step.href}
            className="rounded-xl border border-border bg-card p-3"
          >
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Step {i + 1}
            </p>
            <Link
              href={step.href}
              className="mt-1 block text-sm font-semibold text-foreground hover:underline"
            >
              {step.label} →
            </Link>
            <p className="mt-1 text-xs text-muted-foreground">
              {step.purpose}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
