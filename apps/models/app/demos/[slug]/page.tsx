import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { DemoStepStrip } from "@/components/demo/DemoStepStrip";
import { EvidencePreviewTable } from "@/components/demo/EvidencePreviewTable";
import { DecisionBriefPreview } from "@/components/demo/DecisionBriefPreview";
import { WorkflowPreviewPanel } from "@/components/demo/WorkflowPreviewPanel";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { getGuidedDemo, getGuidedDemos } from "@/lib/guided-demos";
import { getUseCaseBySlug } from "@/lib/use-cases";

interface RouteParams {
  slug: string;
}

export function generateStaticParams(): RouteParams[] {
  return getGuidedDemos().map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const demo = getGuidedDemo(slug);
  if (!demo) {
    return buildMetadata({ title: "Demo", path: `/demos/${slug}` });
  }
  return buildMetadata({
    title: `${demo.title} — guided demo`,
    description: demo.description,
    path: `/demos/${demo.slug}`,
  });
}

export default async function DemoDetailPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const demo = getGuidedDemo(slug);
  if (!demo) notFound();
  const useCase = getUseCaseBySlug(demo.useCaseSlug);

  return (
    <PageShell
      eyebrow="Guided demo"
      title={demo.title}
      intro={demo.description}
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Demos", href: "/demos" },
          { name: demo.title, href: `/demos/${demo.slug}` },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Demos", href: "/demos" },
            { name: demo.title, href: `/demos/${demo.slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "TechArticle",
            name: `${demo.title} — guided demo`,
            url: `${siteConfig.url}/demos/${demo.slug}`,
            description: demo.description,
            dateModified: siteConfig.buildDate,
            isPartOf: { "@type": "WebSite", url: siteConfig.url },
          },
        ]}
      />

      <aside
        role="note"
        aria-label="Demo policy"
        className="card-surface space-y-2 p-4 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          {demo.policyNote}
        </p>
      </aside>

      <WorkflowPreviewPanel demo={demo} />

      <section aria-label="Step-by-step workflow" className="space-y-3">
        <SectionHeader
          eyebrow="Steps"
          title="Step-by-step workflow"
          description="Follow the route plan below. Each step links to the live surface and explains what to inspect there."
          as="h2"
        />
        <DemoStepStrip
          routes={demo.primaryRoutes}
          caption={`${demo.title} demo steps`}
        />
      </section>

      <section aria-label="Evidence preview" className="space-y-3">
        <SectionHeader
          eyebrow="Evidence preview"
          title="What the verified fields look like"
          description={`Rendered for the ${demo.modelSlugs.length} model${demo.modelSlugs.length === 1 ? "" : "s"} included in this demo. Every value comes straight from the typed local data layer.`}
          as="h2"
        />
        <EvidencePreviewTable
          modelSlugs={demo.modelSlugs}
          caption={`${demo.title} — verified fields`}
        />
      </section>

      <section aria-label="Decision brief preview" className="space-y-3">
        <SectionHeader
          eyebrow="Decision brief preview"
          title="What the evidence brief produces"
          description="Server-rendered from the same helper that powers /briefs/build and /api/briefs/decision. Markdown + JSON export links are live."
          as="h2"
        />
        <DecisionBriefPreview
          modelSlugs={demo.modelSlugs}
          useCase={demo.useCaseSlug}
          caption={`${demo.title} — brief preview`}
        />
      </section>

      <section
        aria-label="What this demo does not decide"
        className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          What this demo does not decide
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>Does not choose a model for you.</li>
          <li>Does not rank models or providers.</li>
          <li>
            Does not validate performance for your specific workload —
            run task-specific tests in your own environment.
          </li>
          <li>
            Does not provide a live pricing quote. Pricing rows are
            source-backed references with freshness chips; re-verify
            against the vendor pricing page before commitment.
          </li>
          <li>
            Does not certify compliance. Verification status describes
            citations on a date, not regulatory posture.
          </li>
        </ul>
      </section>

      <aside
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="Related routes"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Related routes
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {useCase ? (
            <li>
              <Link
                href={
                  useCase.route ?? `/use-cases/${demo.useCaseSlug}`
                }
                className="text-primary hover:underline"
              >
                {useCase.title} — use-case guide
              </Link>
            </li>
          ) : null}
          {demo.primaryRoutes.map((r) => (
            <li key={r.href}>
              <Link
                href={r.href}
                className="text-primary hover:underline"
              >
                {r.label}
              </Link>{" "}
              — {r.purpose}
            </li>
          ))}
          <li>
            <Link
              href="/coverage"
              className="text-primary hover:underline"
            >
              /coverage
            </Link>{" "}
            — verified breadth across every entity domain.
          </li>
          <li>
            <Link
              href="/sources"
              className="text-primary hover:underline"
            >
              /sources
            </Link>{" "}
            — every primary-source citation.
          </li>
          <li>
            <Link
              href="/reverification"
              className="text-primary hover:underline"
            >
              /reverification
            </Link>{" "}
            — manual review queue for sources due for re-check.
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
