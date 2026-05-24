import Link from "next/link";

/**
 * LabWorkflowStrip — the four-step "define task → build test set →
 * run trials → record evidence" strip used at the top of the lab
 * hub. Server component, no client JS, no completion state.
 *
 * Each tile links to the lab surface or workspace that step relies
 * on so the reader can jump straight to the surface they need.
 */
const STEPS = [
  {
    label: "Define task",
    detail: "Name the workload, the acceptance rubric, and the data gaps.",
    href: "/learn/testing-ai-models",
  },
  {
    label: "Build test set",
    detail:
      "Pick representative prompts (or assets) from real traffic and pin a fixed schema.",
    href: "/lab/prompt-testing-basics",
  },
  {
    label: "Run model trials",
    detail:
      "Execute the playbook against each candidate model with parameters held constant.",
    href: "/lab/templates/prompt-test-matrix",
  },
  {
    label: "Record evidence",
    detail:
      "Roll observations into an evidence brief and store the canary suite for regression checks.",
    href: "/briefs/build",
  },
];

export function LabWorkflowStrip() {
  return (
    <section
      aria-label="Lab workflow"
      className="card-surface space-y-3 p-5"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        Lab workflow
      </p>
      <ol className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
        {STEPS.map((step, i) => (
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
              {step.detail}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
