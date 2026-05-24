import Link from "next/link";
import type { GuidedDemo } from "@/lib/guided-demos";
import { getUseCaseBySlug } from "@/lib/use-cases";
import { getUseCaseShortlist } from "@/lib/model-shortlists";

/**
 * WorkflowPreviewPanel — visual representation of how the five-step
 * decision workflow plays out for a specific demo. Renders the use
 * case, the shortlist size, the comparison column count, the brief
 * field count, and the source freshness state as connected cards
 * (server-rendered, no charting dependency, no fabricated
 * screenshots).
 */
export function WorkflowPreviewPanel({
  demo,
}: {
  demo: GuidedDemo;
}) {
  const useCase = getUseCaseBySlug(demo.useCaseSlug);
  const shortlist = getUseCaseShortlist(demo.useCaseSlug);
  const shortlistTop = shortlist.slice(0, demo.modelSlugs.length || 4);
  const inShortlist = shortlist.length;
  const briefFieldCount = demo.evidenceFields.length;

  return (
    <section
      aria-label={`Workflow preview — ${demo.title}`}
      className="card-surface space-y-3 p-5 text-sm"
    >
      <header className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.18em] text-primary">
          Workflow preview
        </p>
        <h3 className="text-base font-semibold text-foreground">
          {demo.title}
        </h3>
        <p className="text-[11px] text-muted-foreground">
          Server-rendered from current catalogue data. Each tile
          links to the live surface the demo walks through.
        </p>
      </header>

      <ol className="grid gap-2 md:grid-cols-5">
        <li className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Step 1 · use case
          </p>
          {useCase ? (
            <Link
              href={useCase.route ?? `/use-cases/${demo.useCaseSlug}`}
              className="mt-1 block text-sm font-semibold text-foreground hover:underline"
            >
              {useCase.title}
            </Link>
          ) : (
            <p className="mt-1 text-sm font-semibold text-foreground">
              {demo.useCaseSlug}
            </p>
          )}
          <p className="mt-1 text-[11px] text-muted-foreground">
            Names the verified fields this workflow weights.
          </p>
        </li>
        <li className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Step 2 · shortlist
          </p>
          <Link
            href={`/select?useCase=${demo.useCaseSlug}`}
            className="mt-1 block text-sm font-semibold text-foreground hover:underline"
          >
            {inShortlist} candidate{inShortlist === 1 ? "" : "s"}
          </Link>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Deterministic order — no scoring.
          </p>
        </li>
        <li className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Step 3 · comparison
          </p>
          <Link
            href={`/compare/build?useCase=${demo.useCaseSlug}${demo.modelSlugs.length ? `&models=${encodeURIComponent(demo.modelSlugs.join(","))}` : ""}`}
            className="mt-1 block text-sm font-semibold text-foreground hover:underline"
          >
            {Math.min(demo.modelSlugs.length, 4) || shortlistTop.length} model
            {Math.min(demo.modelSlugs.length, 4) === 1 ? "" : "s"} side by
            side
          </Link>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Verified fields only — no derived metrics.
          </p>
        </li>
        <li className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Step 4 · brief
          </p>
          <Link
            href={`/briefs/build?useCase=${demo.useCaseSlug}${demo.modelSlugs.length ? `&models=${encodeURIComponent(demo.modelSlugs.join(","))}` : ""}`}
            className="mt-1 block text-sm font-semibold text-foreground hover:underline"
          >
            {briefFieldCount} evidence field{briefFieldCount === 1 ? "" : "s"}
          </Link>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Markdown or JSON. Evidence, not recommendation.
          </p>
        </li>
        <li className="rounded-xl border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Step 5 · sources
          </p>
          <Link
            href="/sources"
            className="mt-1 block text-sm font-semibold text-foreground hover:underline"
          >
            Citation registry
          </Link>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Every value linked back to a primary source.
          </p>
        </li>
      </ol>

      <p className="text-[11px] text-muted-foreground">
        {demo.policyNote}
      </p>
    </section>
  );
}
