import Link from "next/link";
import type { OutcomeUseCase } from "@/lib/outcome-use-cases";

/**
 * OutcomeUseCaseCard — summary card for an outcome page used on
 * the /use-cases hub and any cross-link surface. Server component.
 */
export function OutcomeUseCaseCard({
  outcome,
}: {
  outcome: OutcomeUseCase;
}) {
  return (
    <Link
      href={`/use-cases/${outcome.slug}`}
      className="card-surface block h-full space-y-2 p-4 transition hover:border-primary/30 hover:shadow-elevated"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        Outcome
      </p>
      <p className="text-base font-semibold text-foreground">
        {outcome.title}
      </p>
      <p className="text-sm text-muted-foreground">{outcome.headline}</p>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {outcome.evidenceArtifacts.slice(0, 3).map((a) => (
          <span
            key={a}
            className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-foreground"
          >
            {a}
          </span>
        ))}
        {outcome.evidenceArtifacts.length > 3 ? (
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            +{outcome.evidenceArtifacts.length - 3} more
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs font-medium text-primary">
        Open outcome →
      </p>
    </Link>
  );
}
