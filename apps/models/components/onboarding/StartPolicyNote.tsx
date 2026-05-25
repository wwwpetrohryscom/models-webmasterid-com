/**
 * StartPolicyNote — shared "How the Start Here pages work" callout
 * that names what /start does and does not do. Server component.
 */
export function StartPolicyNote() {
  return (
    <section
      aria-label="How Start Here works"
      className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        How Start Here works
      </p>
      <ul className="ml-5 list-disc space-y-1">
        <li>
          No accounts, no sign-in, no quiz scoring. Picking a role
          opens links — it does not save state about the reader.
        </li>
        <li>
          No progress tracking. There is no completion bar, no
          certificate, no badge. Completion is the artifacts the
          path puts in your hands.
        </li>
        <li>
          No personalization. Two readers who click the same card see
          the same content; no recommendation engine runs against
          the reader.
        </li>
        <li>
          No model recommendations. The role pages route into
          learning workflows; which model fits the workload is the
          reader's decision after the testing step.
        </li>
        <li>
          No SEO ranking guarantees, no production-readiness
          guarantees, no compliance certification. Start Here is a
          navigation aid, not a promise about outcomes.
        </li>
      </ul>
    </section>
  );
}
