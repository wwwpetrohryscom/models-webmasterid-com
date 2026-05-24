import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { DecisionBriefPreview } from "@/components/demo/DecisionBriefPreview";
import { EvidencePreviewTable } from "@/components/demo/EvidencePreviewTable";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { formatDateISO } from "@/lib/utils";
import { buildDecisionBrief } from "@/lib/decision-briefs";
import { getGuidedDemo } from "@/lib/guided-demos";

/**
 * Example decision brief — long-context-analysis flavour.
 *
 * Renders an evidence pack for the long-context-analysis demo
 * without forcing the visitor to build one. Uses the same
 * buildDecisionBrief() helper as /briefs/build and the export
 * endpoint, so the example cannot drift from the real surface.
 */
const EXAMPLE_DEMO_SLUG = "long-context-analysis" as const;

export const metadata: Metadata = buildMetadata({
  title: "Example decision brief",
  description:
    "A worked example of a WebmasterID Models decision brief — verified evidence rows, explicit data gaps, source trail, freshness notes, hosted availability, and next-external-tests checklist for a long-context analysis workflow. Evidence, not a recommendation.",
  path: "/examples/decision-brief",
});

export default function ExampleDecisionBriefPage() {
  const demo = getGuidedDemo(EXAMPLE_DEMO_SLUG);
  const modelSlugs = (demo?.modelSlugs ?? []).slice(0, 2);
  const brief = buildDecisionBrief({
    modelSlugs,
    useCase: demo?.useCaseSlug,
  });
  const exportParams = new URLSearchParams({
    models: modelSlugs.join(","),
    useCase: EXAMPLE_DEMO_SLUG,
  });

  return (
    <PageShell
      eyebrow="Example"
      title="Example decision brief"
      intro="A worked example of the evidence pack the /briefs/build workspace produces. Two verified models from the long-context-analysis demo, rendered with the same helper that powers the live builder and the export endpoint. Evidence, not a recommendation."
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Examples", href: "/examples/decision-brief" },
          {
            name: "Decision brief",
            href: "/examples/decision-brief",
          },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            {
              name: "Example decision brief",
              href: "/examples/decision-brief",
            },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "TechArticle",
            name: "Example decision brief",
            url: `${siteConfig.url}/examples/decision-brief`,
            description:
              "Worked example of a WebmasterID Models decision brief.",
            dateModified: siteConfig.buildDate,
            isPartOf: { "@type": "WebSite", url: siteConfig.url },
          },
        ]}
      />

      <aside
        role="note"
        aria-label="Example policy"
        className="card-surface space-y-2 p-4 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          This is an example, not a recommendation.
        </p>
        <p>
          The brief below was built from the typed local data layer
          for two verified models in the long-context-analysis demo.
          It does not declare a winner, does not rank by price, and
          does not validate performance for any specific workload.
          Build your own brief at{" "}
          <Link
            href="/briefs/build"
            className="text-primary hover:underline"
          >
            /briefs/build
          </Link>
          .
        </p>
        <p className="text-[11px]">
          Generated at:{" "}
          <code className="rounded bg-muted px-1">
            {formatDateISO(siteConfig.buildDate)}
          </code>
          . Briefs use the deterministic build date as{" "}
          <code className="rounded bg-muted px-1">generatedAt</code> so
          the same build produces the same brief.
        </p>
      </aside>

      <section aria-label="Brief preview" className="space-y-3">
        <SectionHeader
          eyebrow="Preview"
          title="What the brief contains"
          description="Server-rendered from buildDecisionBrief(). Open the export links below to see the full Markdown or JSON payload."
          as="h2"
        />
        <DecisionBriefPreview
          modelSlugs={modelSlugs}
          useCase={demo?.useCaseSlug}
          caption="Example brief — long-context analysis"
        />
      </section>

      <section aria-label="Evidence" className="space-y-3">
        <SectionHeader
          eyebrow="Evidence"
          title="Verified fields, side by side"
          description="The same verified-data layer the comparison builder reads. Unknown values render an em-dash."
          as="h2"
        />
        <EvidencePreviewTable
          modelSlugs={modelSlugs}
          caption="Example evidence — long-context candidates"
        />
      </section>

      {brief.dataGaps.length ? (
        <section aria-label="Data gaps" className="space-y-3">
          <SectionHeader
            eyebrow="Honest gaps"
            title={`Data gaps in this brief (${brief.dataGaps.length})`}
            description="Fields the catalogue records as unverified. The brief surfaces them explicitly rather than inventing values."
            as="h2"
          />
          <ul className="card-surface space-y-1 p-4 text-xs text-muted-foreground">
            {brief.dataGaps.map((g, idx) => (
              <li key={`${g.modelSlug}-${g.field}-${idx}`}>
                <strong className="text-foreground">{g.modelSlug}</strong>{" "}
                · {g.field} — {g.reason}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {brief.sourceTrail.length ? (
        <section aria-label="Source trail" className="space-y-3">
          <SectionHeader
            eyebrow="Sources"
            title={`Source trail (${brief.sourceTrail.length})`}
            description="Every primary-source citation referenced by the brief. Open each link to confirm the value on the vendor page."
            as="h2"
          />
          <ul className="grid gap-2 sm:grid-cols-2">
            {brief.sourceTrail.map((s) => (
              <li
                key={s.sourceId}
                className="card-surface p-3 text-xs text-muted-foreground"
              >
                <p className="text-[10px] uppercase tracking-wider text-primary">
                  {s.sourceId}
                </p>
                <Link
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block break-all text-primary hover:underline"
                >
                  {s.name}
                </Link>
                <p className="mt-1">
                  {s.sourceType} · retrieved{" "}
                  {formatDateISO(s.retrievedAt)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section
        aria-label="Next external tests"
        className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Next external tests (still your job)
        </p>
        <ul className="ml-5 list-disc space-y-1">
          {brief.nextExternalTests.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Build your own"
        className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Build your own brief
        </p>
        <p>
          The example above is one pre-built path. Start from any use
          case or pick your own model set:
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <Link
              href="/briefs/build"
              className="text-primary hover:underline"
            >
              /briefs/build
            </Link>{" "}
            — open the builder, pick up to four models, optionally
            choose a use case + field set, and click Build.
          </li>
          <li>
            <code className="rounded bg-muted px-1">
              /api/briefs/decision?{exportParams.toString()}
              &amp;format=markdown
            </code>{" "}
            — Markdown export endpoint with the same query shape.
          </li>
          <li>
            <code className="rounded bg-muted px-1">
              /api/briefs/decision?{exportParams.toString()}
              &amp;format=json
            </code>{" "}
            — JSON export endpoint.
          </li>
          <li>
            <Link
              href="/demos"
              className="text-primary hover:underline"
            >
              /demos
            </Link>{" "}
            — three guided demos that walk the full five-step
            workflow.
          </li>
          <li>
            <Link
              href="/docs/decision-briefs"
              className="text-primary hover:underline"
            >
              /docs/decision-briefs
            </Link>{" "}
            — what a brief is and what it deliberately does not
            assert.
          </li>
        </ul>
      </section>
    </PageShell>
  );
}
