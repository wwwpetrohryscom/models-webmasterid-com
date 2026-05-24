import Link from "next/link";

/**
 * Sprint 24 decision workflow component.
 *
 * A small reusable strip that names the steps WebmasterID Models
 * supports — and the step it deliberately does not perform
 * ("recommend a winner"). Used on /select, /compare, /compare/build,
 * /use-cases pages, and /docs/decision-workflow.
 *
 * The component is server-rendered, ships no client JS, and contains
 * no recommendation language by design.
 */
export function DecisionWorkflow({
  variant = "card",
  highlightStep,
}: {
  /** "card" renders inside a card-surface; "section" renders bare. */
  variant?: "card" | "section";
  /** Optional 1-indexed step to visually highlight as the reader's
   *  current position in the workflow. */
  highlightStep?: 1 | 2 | 3 | 4 | 5 | 6;
}) {
  const steps: { title: string; detail: string; href: string }[] = [
    {
      title: "1. Start with a use case",
      detail: "Use cases name which verified fields matter.",
      href: "/use-cases",
    },
    {
      title: "2. Build a source-backed shortlist",
      detail:
        "Shortlist order is deterministic — verified field count, lifecycle, source count, name.",
      href: "/select",
    },
    {
      title: "3. Compare verified fields",
      detail:
        "The builder renders 2–4 models side by side with no derived metrics.",
      href: "/compare/build",
    },
    {
      title: "4. Inspect data gaps",
      detail:
        "Unverified fields stay explicit. Gaps surface in the comparison.",
      href: "/coverage",
    },
    {
      title: "5. Review sources and freshness",
      detail:
        "Every citation links back to the vendor page with a retrievedAt date.",
      href: "/sources",
    },
    {
      title: "6. Decide what to test externally",
      detail:
        "WebmasterID Models does not recommend; the reader runs the workload.",
      href: "/docs/decision-workflow",
    },
  ];
  const containerClass =
    variant === "card"
      ? "card-surface space-y-3 p-5 text-sm text-muted-foreground"
      : "space-y-3 text-sm text-muted-foreground";
  return (
    <aside aria-label="Decision workflow" className={containerClass}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        Decision workflow
      </p>
      <ol className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, idx) => {
          const stepNum = (idx + 1) as 1 | 2 | 3 | 4 | 5 | 6;
          const isHighlight = highlightStep === stepNum;
          return (
            <li key={step.title}>
              <Link
                href={step.href}
                className={`block rounded-xl border p-3 transition hover:border-primary/30 hover:shadow-elevated ${
                  isHighlight
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                <p className="text-xs font-semibold text-foreground">
                  {step.title}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {step.detail}
                </p>
              </Link>
            </li>
          );
        })}
      </ol>
      <p className="text-[11px] text-muted-foreground">
        Selection workflow, not a recommendation engine. Shortlist
        order is documented; no model is declared best. Decide what to
        test externally.
      </p>
    </aside>
  );
}
