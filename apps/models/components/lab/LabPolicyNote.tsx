/**
 * LabPolicyNote — the explicit "what the lab does not promise"
 * callout shared across lab surfaces. Server component.
 *
 * The lab teaches testing — it does not certify any model, validate
 * safety, replace benchmarks, or guarantee production readiness.
 */
export function LabPolicyNote() {
  return (
    <section
      aria-label="What the lab does not promise"
      className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        What the lab does not promise
      </p>
      <ul className="ml-5 list-disc space-y-1">
        <li>
          No production readiness guarantee. A passing playbook is
          evidence, not approval.
        </li>
        <li>
          No compliance or regulatory certification. Verification is
          not certification.
        </li>
        <li>
          No safety validation. Templates and playbooks are planning
          tools, not safety reviews.
        </li>
        <li>
          No model ranking. The lab does not score candidates against
          each other.
        </li>
        <li>
          No benchmark replacement. The lab teaches your own testing
          discipline; it does not publish synthesized benchmark
          numbers.
        </li>
      </ul>
    </section>
  );
}
