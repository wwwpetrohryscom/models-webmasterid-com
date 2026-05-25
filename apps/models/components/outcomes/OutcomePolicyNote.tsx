/**
 * OutcomePolicyNote — shared "what outcome pages do not promise"
 * callout. Server component.
 */
export function OutcomePolicyNote() {
  return (
    <section
      aria-label="What outcome pages do not promise"
      className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        What outcome pages do not promise
      </p>
      <ul className="ml-5 list-disc space-y-1">
        <li>
          No model recommendations, no winner claims, no rankings.
          Outcome pages route the reader through evidence; the
          reader's team decides.
        </li>
        <li>
          No live pricing, no live status, no fabricated benchmark
          scores or latency numbers.
        </li>
        <li>
          No production-readiness guarantee, no compliance
          certification, no automation reliability guarantee.
        </li>
        <li>
          No SEO ranking guarantees. The outcome label exists so the
          right team can find the workflow, not as a search promise.
        </li>
        <li>
          No accounts, no progress tracking, no course-completion
          certificates. The artifact list above is the completion
          signal.
        </li>
      </ul>
    </section>
  );
}
