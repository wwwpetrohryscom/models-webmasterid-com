import Link from "next/link";
import type { GuidedDemo } from "@/lib/guided-demos";

/**
 * DemoRouteCard — single-card summary of a guided demo used on the
 * /demos hub and elsewhere as a navigation tile. Always renders the
 * "demos are navigation examples" caveat as a small footer line.
 */
export function DemoRouteCard({
  demo,
}: {
  demo: GuidedDemo;
}) {
  return (
    <article className="card-surface flex h-full flex-col gap-3 p-4 text-sm">
      <div>
        <p className="text-[10px] uppercase tracking-[0.18em] text-primary">
          Guided demo
        </p>
        <h3 className="mt-1 text-base font-semibold text-foreground">
          <Link
            href={`/demos/${demo.slug}`}
            className="hover:underline"
          >
            {demo.title}
          </Link>
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {demo.description}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
        <div>
          <dt className="font-medium text-foreground">Use case</dt>
          <dd>
            <Link
              href={`/use-cases/${demo.useCaseSlug}`}
              className="text-primary hover:underline"
            >
              {demo.useCaseSlug}
            </Link>
          </dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Models</dt>
          <dd>
            {demo.modelSlugs.length
              ? `${demo.modelSlugs.length} in walkthrough`
              : "no verified candidates yet"}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="font-medium text-foreground">Fields inspected</dt>
          <dd>{demo.evidenceFields.slice(0, 3).join(" · ")}…</dd>
        </div>
      </dl>
      <div className="mt-auto flex flex-wrap gap-2 pt-2 text-xs">
        <Link
          href={`/demos/${demo.slug}`}
          className="inline-flex items-center rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 font-medium text-primary hover:bg-primary/15"
        >
          Start walkthrough →
        </Link>
        {demo.modelSlugs.length ? (
          <Link
            href={`/briefs/build?useCase=${demo.useCaseSlug}&models=${encodeURIComponent(demo.modelSlugs.join(","))}`}
            className="inline-flex items-center rounded-lg border border-border bg-card px-2.5 py-1 text-muted-foreground hover:text-foreground"
          >
            Jump to evidence brief
          </Link>
        ) : null}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Navigation example, not a model recommendation.
      </p>
    </article>
  );
}
