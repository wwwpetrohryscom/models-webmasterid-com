/**
 * WorkflowKitPolicyNote — the explicit "what kits do not promise"
 * callout shared across kit surfaces. Server component, no client
 * JS.
 */
export function WorkflowKitPolicyNote() {
  return (
    <section
      aria-label="What workflow kits do not promise"
      className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        What workflow kits do not promise
      </p>
      <ul className="ml-5 list-disc space-y-1">
        <li>
          No model recommendations or rankings. Kits walk the
          evidence; the reader's team makes the decision.
        </li>
        <li>
          No live pricing quotes. Pricing rows referenced inside the
          kit are sourced references with retrievedAt dates.
        </li>
        <li>
          No production-readiness guarantee. The kit ends with an
          external test plan — running those tests is the team's
          responsibility.
        </li>
        <li>
          No compliance certification, legal advice, or vendor
          endorsement.
        </li>
        <li>
          No SEO ranking guarantees or automation reliability
          guarantees.
        </li>
        <li>
          No accounts, no progress tracking, no course-completion
          certificates. Completion is the Markdown artifacts the kit
          puts in your hands.
        </li>
      </ul>
    </section>
  );
}
