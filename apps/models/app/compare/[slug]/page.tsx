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
import { SourceCitationList } from "@/components/SourceCitation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EntityActionRail } from "@/components/entity/EntityActionRail";
import { EntityMethodologyLinks } from "@/components/entity/EntityMethodologyLinks";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { robotsMetadata, shouldIndexComparison } from "@/lib/should-index";
import { comparisons, getComparisonBySlug } from "@/data/comparisons";
import { getModelBySlug } from "@/data/models";
import { getProviderBySlug } from "@/data/providers";
import { hostedPricingForModel } from "@/data/hosted-pricing";
import { mergeCitations, isVerified } from "@/lib/verified";

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
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Compare", href: "/compare" },
          { name: comparison.name, href: `/compare/${comparison.slug}` },
        ]}
      />

      <EntityActionRail
        label="Actions"
        actions={[
          {
            label: modelA.name,
            href: `/models/${modelA.slug}`,
            hint: "Model A",
          },
          {
            label: modelB.name,
            href: `/models/${modelB.slug}`,
            hint: "Model B",
          },
          ...(providerA
            ? [
                {
                  label: `Provider — ${providerA.name}`,
                  href: `/providers/${providerA.slug}`,
                },
              ]
            : []),
          ...(providerB && providerB.slug !== providerA?.slug
            ? [
                {
                  label: `Provider — ${providerB.name}`,
                  href: `/providers/${providerB.slug}`,
                },
              ]
            : []),
          {
            label: "View pricing rows",
            href: `/pricing?provider=${modelA.providerSlug}`,
          },
          { label: "Review sources", href: "/sources" },
          {
            label: "Read comparison methodology",
            href: "/docs/comparison-methodology",
          },
        ]}
      />

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
        <SectionHeader
          eyebrow="Cost"
          title="First-party pricing"
          description="Per-unit rates published by each model's creator on their own first-party API. Hosted-provider pricing (Groq, Together) is rendered separately below where available."
          as="h2"
        />
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

      {(() => {
        const hostedA = hostedPricingForModel(modelA.slug);
        const hostedB = hostedPricingForModel(modelB.slug);
        if (!hostedA.length && !hostedB.length) return null;
        return (
          <section
            aria-label="Hosted-provider pricing"
            className="space-y-3"
          >
            <SectionHeader
              eyebrow="Hosted pricing context"
              title="Hosted-provider pricing"
              description="Where a third-party platform hosts the model and bills at its own rate. These rows do NOT reflect the model creator's pricing. Hosted pricing is informational only — it is not used to declare a winner."
              as="h2"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">
                  {modelA.name}
                </p>
                {hostedA.length ? (
                  <ul className="space-y-3">
                    {hostedA.map((r) => {
                      const billing = getProviderBySlug(r.billingProviderSlug);
                      return (
                        <li key={r.id} className="card-surface space-y-2 p-3">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            Hosted by{" "}
                            {billing ? (
                              <Link
                                href={`/providers/${billing.slug}`}
                                className="text-primary hover:underline"
                              >
                                {billing.name}
                              </Link>
                            ) : (
                              r.billingProviderSlug
                            )}
                            {r.hostedModelId ? (
                              <>
                                {" · "}
                                <code className="rounded bg-muted px-1 text-[10px]">
                                  {r.hostedModelId}
                                </code>
                              </>
                            ) : null}
                          </p>
                          <PricingTable tiers={r.tiers} />
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No hosted-provider pricing recorded.
                  </p>
                )}
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">
                  {modelB.name}
                </p>
                {hostedB.length ? (
                  <ul className="space-y-3">
                    {hostedB.map((r) => {
                      const billing = getProviderBySlug(r.billingProviderSlug);
                      return (
                        <li key={r.id} className="card-surface space-y-2 p-3">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            Hosted by{" "}
                            {billing ? (
                              <Link
                                href={`/providers/${billing.slug}`}
                                className="text-primary hover:underline"
                              >
                                {billing.name}
                              </Link>
                            ) : (
                              r.billingProviderSlug
                            )}
                            {r.hostedModelId ? (
                              <>
                                {" · "}
                                <code className="rounded bg-muted px-1 text-[10px]">
                                  {r.hostedModelId}
                                </code>
                              </>
                            ) : null}
                          </p>
                          <PricingTable tiers={r.tiers} />
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No hosted-provider pricing recorded.
                  </p>
                )}
              </div>
            </div>
          </section>
        );
      })()}

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

      <section aria-label="API usage differences" className="space-y-3">
        <SectionHeader
          eyebrow="API surface"
          title="API usage differences"
          description="Endpoint shape, model parameter position, and request body conventions for each provider. Shown for reference, not as a recommendation."
          as="h2"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {[modelA, modelB].map((m) => {
            const p = m === modelA ? providerA : providerB;
            const canonical = isVerified(m.apiIdentifiers)
              ? m.apiIdentifiers.value.canonical
              : null;
            const endpoint =
              m.providerSlug === "anthropic"
                ? "POST https://api.anthropic.com/v1/messages"
                : m.providerSlug === "google"
                  ? `POST https://generativelanguage.googleapis.com/v1beta/models/${canonical ?? "<model>"}:generateContent`
                  : null;
            const modelParamPosition =
              m.providerSlug === "anthropic"
                ? "JSON body `model` field"
                : m.providerSlug === "google"
                  ? "URL path segment"
                  : "—";
            return (
              <article
                key={m.slug}
                className="card-surface p-4 text-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {m.name}
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {p?.name ?? "Unknown provider"}
                </p>
                <dl className="mt-3 space-y-1.5 text-xs">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-muted-foreground">Endpoint</dt>
                    <dd className="break-all text-right font-mono text-foreground">
                      {endpoint ?? "—"}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-muted-foreground">
                      Model parameter
                    </dt>
                    <dd className="text-right text-foreground">
                      {modelParamPosition}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-muted-foreground">Canonical ID</dt>
                    <dd className="text-right font-mono text-foreground">
                      {canonical ?? "—"}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  See the model page for a full documentation-style
                  example request and the citation it derives from.
                </p>
              </article>
            );
          })}
        </div>
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

      <SourceCitationList
        citations={mergeCitations(modelA.citations, modelB.citations)}
        title="Source trail"
      />

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
            ...(providerA
              ? [
                  {
                    label: providerA.name,
                    href: `/providers/${providerA.slug}`,
                    description: `Provider page for ${providerA.name}`,
                  },
                ]
              : []),
            ...(providerB && providerB.slug !== providerA?.slug
              ? [
                  {
                    label: providerB.name,
                    href: `/providers/${providerB.slug}`,
                    description: `Provider page for ${providerB.name}`,
                  },
                ]
              : []),
            {
              label: "Pricing for both providers",
              href: `/pricing?provider=${modelA.providerSlug}`,
              description: `Filtered to ${providerA?.name ?? modelA.providerSlug}`,
            },
            {
              label: "All comparisons",
              href: "/compare",
              description: "Other side-by-side breakdowns",
            },
          ]}
        />
      </section>

      <EntityMethodologyLinks
        links={[
          {
            href: "/docs/comparison-methodology",
            label: "Comparison methodology reference",
            family: "docs",
          },
          {
            href: "/research/model-selection",
            label: "Model selection with verified data",
            family: "research",
          },
          {
            href: "/research/api-pricing-methodology",
            label: "API pricing methodology",
            family: "research",
          },
          {
            href: "/docs/data-verification",
            label: "Data verification rules",
            family: "docs",
          },
        ]}
      />

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
