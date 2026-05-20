import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { ComparisonTable } from "@/components/ComparisonTable";
import { PricingTable } from "@/components/PricingTable";
import { BenchmarkTable } from "@/components/BenchmarkTable";
import { SectionHeader } from "@/components/SectionHeader";
import { DataFreshness } from "@/components/DataFreshness";
import { InternalLinkGrid } from "@/components/InternalLinkGrid";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { robotsMetadata, shouldIndexComparison } from "@/lib/should-index";
import { comparisons, getComparisonBySlug } from "@/data/comparisons";
import { getModelBySlug } from "@/data/models";
import { getProviderBySlug } from "@/data/providers";

interface RouteParams {
  slug: string;
}

export function generateStaticParams(): RouteParams[] {
  return comparisons.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = getComparisonBySlug(slug);
  const indexable = c
    ? shouldIndexComparison(
        c,
        getModelBySlug(c.modelA),
        getModelBySlug(c.modelB)
      )
    : false;
  return {
    ...buildMetadata({
      title: c?.name ?? "Comparison",
      description: c?.description,
      path: `/compare/${slug}`,
    }),
    robots: robotsMetadata(indexable),
  };
}

export default async function ComparisonPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const comparison = getComparisonBySlug(slug);
  if (!comparison) notFound();

  const modelA = getModelBySlug(comparison.modelA);
  const modelB = getModelBySlug(comparison.modelB);
  if (!modelA || !modelB) notFound();

  const providerA = getProviderBySlug(modelA.providerSlug);
  const providerB = getProviderBySlug(modelB.providerSlug);

  return (
    <PageShell
      eyebrow="Side-by-side reference"
      title={comparison.name}
      intro={comparison.description}
    >
      <aside
        role="note"
        aria-label="Comparison policy"
        className="card-surface border-warning/20 bg-warning/5 p-4 text-sm text-foreground"
      >
        <p>
          <strong>No winner declared.</strong> This page sets verified
          attributes from each model side-by-side. It does not rank the
          models, score them, or recommend one over the other. Unverified
          fields display the canonical unverified-data label rendered by
          the DataNotVerified component.
        </p>
      </aside>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Compare", href: "/compare" },
          { name: comparison.name, href: `/compare/${comparison.slug}` },
        ])}
      />

      <DataFreshness
        lastCheckedAt={comparison.lastCheckedAt}
        updatedDate={comparison.updatedDate}
      />

      <section aria-label="Attribute comparison" className="space-y-3">
        <SectionHeader
          eyebrow="At a glance"
          title="Attributes"
          as="h2"
        />
        <ComparisonTable
          a={modelA}
          b={modelB}
          providerA={providerA?.name ?? "Unknown"}
          providerB={providerB?.name ?? "Unknown"}
        />
      </section>

      <section aria-label="Pricing" className="space-y-3">
        <SectionHeader eyebrow="Cost" title="Pricing" as="h2" />
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              {modelA.name}
            </p>
            <PricingTable tiers={modelA.pricing} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              {modelB.name}
            </p>
            <PricingTable tiers={modelB.pricing} />
          </div>
        </div>
      </section>

      <section aria-label="Benchmarks" className="space-y-3">
        <SectionHeader eyebrow="Capability" title="Benchmarks" as="h2" />
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              {modelA.name}
            </p>
            <BenchmarkTable scores={modelA.benchmarks} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              {modelB.name}
            </p>
            <BenchmarkTable scores={modelB.benchmarks} />
          </div>
        </div>
      </section>

      <section aria-label="Use cases" className="space-y-3">
        <SectionHeader eyebrow="Where to use" title="Use cases" as="h2" />
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {comparison.useCases.map((u) => (
            <li
              key={u}
              className="card-surface p-4 text-sm text-foreground"
            >
              {u}
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Limitations" className="space-y-3">
        <SectionHeader
          eyebrow="Caveats"
          title="Limitations of this comparison"
          as="h2"
        />
        <ul className="space-y-2">
          {comparison.limitations.map((l) => (
            <li
              key={l}
              className="card-surface p-4 text-sm text-muted-foreground"
            >
              {l}
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Related" className="space-y-3">
        <SectionHeader eyebrow="Continue" title="Related" as="h2" />
        <InternalLinkGrid
          items={[
            {
              label: modelA.name,
              href: `/models/${modelA.slug}`,
              description: `Full ${modelA.name} intelligence record`,
            },
            {
              label: modelB.name,
              href: `/models/${modelB.slug}`,
              description: `Full ${modelB.name} intelligence record`,
            },
            {
              label: "All comparisons",
              href: "/compare",
              description: "Other side-by-side breakdowns",
            },
          ]}
        />
      </section>

      <p className="text-xs text-muted-foreground">
        Want a new comparison? See{" "}
        <Link href="/docs" className="text-primary hover:underline">
          docs
        </Link>{" "}
        for how WebmasterID Models verifies entries.
      </p>
    </PageShell>
  );
}
