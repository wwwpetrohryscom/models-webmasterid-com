import Link from "next/link";
import {
  buildDecisionBrief,
  decisionBriefUrl,
} from "@/lib/decision-briefs";
import type { ModelUseCaseSlug } from "@/lib/use-cases";

/**
 * DecisionBriefPreview — server-renders a summary of the decision
 * brief that would be generated for a given model set + use case.
 * Uses the same buildDecisionBrief() helper as /briefs/build and
 * /api/briefs/decision so the preview cannot drift from the
 * real export. Includes Markdown + JSON export links.
 */
export function DecisionBriefPreview({
  modelSlugs,
  useCase,
  caption,
}: {
  modelSlugs: string[];
  useCase?: ModelUseCaseSlug;
  caption?: string;
}) {
  const brief = buildDecisionBrief({ modelSlugs, useCase });
  const hasModels = brief.selectedModels.length > 0;
  const pageUrl = decisionBriefUrl({ modelSlugs, useCase });
  const exportParams = new URLSearchParams({
    models: modelSlugs.join(","),
    ...(useCase ? { useCase } : {}),
  });
  const exportMd = `/api/briefs/decision?${exportParams.toString()}&format=markdown`;
  const exportJson = `/api/briefs/decision?${exportParams.toString()}&format=json`;

  return (
    <article className="card-surface space-y-3 p-5 text-sm">
      <header className="space-y-1">
        {caption ? (
          <p className="text-[10px] uppercase tracking-[0.18em] text-primary">
            {caption}
          </p>
        ) : null}
        <h3 className="text-base font-semibold text-foreground">
          {brief.title}
        </h3>
        <p className="text-[11px] text-muted-foreground">
          Generated at:{" "}
          <code className="rounded bg-muted px-1">
            {brief.generatedAt.slice(0, 10)}
          </code>
          {brief.useCase ? <> · Use case: {brief.useCase}</> : null}
        </p>
      </header>

      {hasModels ? (
        <ul className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground sm:grid-cols-4">
          <li className="card-surface p-2">
            <p className="text-[10px] uppercase tracking-wider">
              Models
            </p>
            <p className="text-sm font-semibold text-foreground tabular-nums">
              {brief.selectedModels.length}
            </p>
          </li>
          <li className="card-surface p-2">
            <p className="text-[10px] uppercase tracking-wider">
              Evidence rows
            </p>
            <p className="text-sm font-semibold text-foreground tabular-nums">
              {brief.verifiedEvidence.length}
            </p>
          </li>
          <li className="card-surface p-2">
            <p className="text-[10px] uppercase tracking-wider">
              Data gaps
            </p>
            <p className="text-sm font-semibold text-foreground tabular-nums">
              {brief.dataGaps.length}
            </p>
          </li>
          <li className="card-surface p-2">
            <p className="text-[10px] uppercase tracking-wider">
              Sources
            </p>
            <p className="text-sm font-semibold text-foreground tabular-nums">
              {brief.sourceTrail.length}
            </p>
          </li>
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">
          No models selected — preview empty. Open the builder to
          pick candidates.
        </p>
      )}

      {hasModels ? (
        <details className="rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
          <summary className="cursor-pointer text-foreground">
            Show selected models
          </summary>
          <ul className="mt-2 space-y-1">
            {brief.selectedModels.map((m) => (
              <li key={m.slug}>
                <Link
                  href={`/models/${m.slug}`}
                  className="text-primary hover:underline"
                >
                  {m.name}
                </Link>{" "}
                — {m.providerName} · lifecycle: {m.lifecycle}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className="flex flex-wrap gap-2 text-xs">
        <Link
          href={pageUrl}
          className="inline-flex items-center rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 font-medium text-primary hover:bg-primary/15"
        >
          Open builder →
        </Link>
        <Link
          href={exportMd}
          className="inline-flex items-center rounded-lg border border-border bg-card px-2.5 py-1 text-muted-foreground hover:text-foreground"
        >
          Export Markdown
        </Link>
        <Link
          href={exportJson}
          className="inline-flex items-center rounded-lg border border-border bg-card px-2.5 py-1 text-muted-foreground hover:text-foreground"
        >
          Export JSON
        </Link>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Preview generated from current catalogue data. Briefs are
        evidence, not recommendations.
      </p>
    </article>
  );
}
