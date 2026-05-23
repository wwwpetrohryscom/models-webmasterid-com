import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { ProviderLogo } from "@/components/ProviderLogo";
import { VerificationBadge } from "@/components/VerificationBadge";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { ModelBadge } from "@/components/ModelBadge";
import { DataNotVerified } from "@/components/DataNotVerified";
import { InternalLinkGrid } from "@/components/InternalLinkGrid";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EntityActionRail } from "@/components/entity/EntityActionRail";
import {
  EntityDataGaps,
  type DataGapItem,
} from "@/components/entity/EntityDataGaps";
import { EntityMethodologyLinks } from "@/components/entity/EntityMethodologyLinks";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { providers, getProviderBySlug } from "@/data/providers";
import { models, getModelBySlug } from "@/data/models";
import { getBrandAsset } from "@/data/brand-assets";
import { attemptsByProvider } from "@/data/verification-attempts";
import {
  hostedPricingForBillingProvider,
  hostedPricingForModel,
} from "@/data/hosted-pricing";
import {
  getHostedAvailabilityForBillingProvider,
  getHostedAvailabilityForCreator,
} from "@/lib/hosted-availability";
import {
  getPricingFreshness,
  pricingFreshnessClasses,
  pricingFreshnessLabel,
  PRICING_VOLATILITY_NOTE,
} from "@/lib/pricing-freshness";
import { isVerified } from "@/lib/verified";
import { formatUsd } from "@/lib/utils";
import { formatDateISO } from "@/lib/utils";
import {
  getComparisonsForProvider,
  getRelatedProviders,
} from "@/lib/entity-graph";
import { findObserversForProvider } from "@/lib/observers";

interface RouteParams {
  slug: string;
}

export function generateStaticParams(): RouteParams[] {
  return providers.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const provider = getProviderBySlug(slug);
  if (!provider)
    return buildMetadata({ title: "Provider", path: `/providers/${slug}` });
  return buildMetadata({
    title: provider.name,
    description: `${provider.name} provider entry — official docs, models tracked, and verification status on ${provider.name}.`,
    path: `/providers/${provider.slug}`,
  });
}

type LinkRow = { label: string; href: string | null | undefined };

function PrimaryLinks({ provider }: { provider: ReturnType<typeof getProviderBySlug> }) {
  if (!provider) return null;
  const rows: LinkRow[] = [
    { label: "Website", href: provider.website },
    { label: "Documentation", href: provider.docsUrl },
    { label: "API reference", href: provider.apiDocsUrl },
    { label: "Pricing", href: provider.pricingUrl },
    { label: "Model catalogue", href: provider.modelCatalogueUrl },
    { label: "Status (vendor)", href: provider.statusPageUrl },
    { label: "Deprecations", href: provider.deprecationsUrl },
  ];
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {rows.map((row) => (
        <li
          key={row.label}
          className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-sm"
        >
          <span className="text-muted-foreground">{row.label}</span>
          {row.href ? (
            <Link
              href={row.href}
              target="_blank"
              rel="noreferrer"
              className="truncate font-medium text-primary hover:underline"
            >
              {row.href.replace(/^https?:\/\//, "")}
            </Link>
          ) : (
            <DataNotVerified />
          )}
        </li>
      ))}
    </ul>
  );
}

const COVERAGE_ROWS: { label: string; describe: (count: number, verified: number) => string }[] =
  [
    {
      label: "Pricing",
      describe: (_c, v) =>
        v > 0 ? `${v} model(s) with verified pricing` : "No verified pricing yet",
    },
    {
      label: "Models",
      describe: (c, v) => `${c} tracked, ${v} verified`,
    },
    {
      label: "Benchmarks",
      describe: () => "No verified third-party benchmark scores yet",
    },
    {
      label: "Infrastructure",
      describe: () => "No verified region/latency/uptime data yet",
    },
    {
      label: "Status",
      describe: () => "No independent monitor wired yet",
    },
  ];

export default async function ProviderPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const provider = getProviderBySlug(slug);
  if (!provider) notFound();

  const trackedModels = models.filter((m) => m.providerSlug === provider.slug);
  const verifiedCount = trackedModels.filter(
    (m) => m.verificationStatus === "verified"
  ).length;
  const verifiedPricingCount = trackedModels.filter((m) =>
    m.pricing.some((t) => t.amount !== null && t.amount.citation)
  ).length;
  const brandAsset = getBrandAsset(provider.slug);

  // Hosted-pricing relationships for this provider.
  //   - billedHostedRows: rows where this provider is the billing
  //     platform (Groq, Together AI). Shown as "models we host".
  //   - creatorHostedRows: rows where this provider created the model
  //     but a third party also hosts it (e.g. Meta → Groq for Llama 4
  //     Scout, DeepSeek → Together for DeepSeek V4 Pro). Shown as
  //     "third-party hosting of our models".
  const billedHostedRows = hostedPricingForBillingProvider(provider.slug);
  const creatorHostedRows = trackedModels.flatMap((m) =>
    hostedPricingForModel(m.slug)
  );
  const isHostedPlatform = billedHostedRows.length > 0;
  // Creator pricing is "unavailable" when this provider creates models
  // but has zero verified first-party pricing rows on any of them. Meta
  // (Llama 4) is the canonical example today.
  const creatorPricingUnavailable =
    trackedModels.length > 0 &&
    trackedModels.every(
      (m) => !m.pricing.some((t) => isVerified(t.amount))
    );
  const billedAvailability = getHostedAvailabilityForBillingProvider(
    provider.slug
  );
  const creatorAvailability = getHostedAvailabilityForCreator(provider.slug);

  const relatedComparisons = getComparisonsForProvider(provider.slug);
  const relatedProviders = getRelatedProviders(provider.slug);
  const observer = findObserversForProvider(provider.slug);

  const providerActions = [
    {
      label: "View tracked models",
      href: `/models?provider=${provider.slug}`,
    },
    {
      label: "View pricing rows",
      href: `/pricing?provider=${provider.slug}`,
    },
    {
      label: "Compare models",
      href: `/compare?provider=${provider.slug}`,
    },
    {
      label: "Review sources",
      href: `/sources?provider=${provider.slug}`,
    },
    { label: "Check coverage", href: "/coverage" },
    ...(observer.length > 0
      ? [
          {
            label: "Status observations",
            href: `/api/status/${provider.slug}`,
            hint: "JSON",
          },
        ]
      : []),
  ];

  // Per-provider data gaps. Compute from data so the list is honest.
  const providerDataGaps: DataGapItem[] = [];
  if (!provider.deprecationsUrl) {
    providerDataGaps.push({
      field: "Deprecations URL",
      reason:
        "Provider does not publish a stable deprecations page in their docs, or it has not yet been recorded.",
    });
  }
  if (!provider.statusPageUrl) {
    providerDataGaps.push({
      field: "Public status page",
      reason: "Provider has no public status page recorded.",
    });
  }
  if (observer.length === 0) {
    providerDataGaps.push({
      field: "Status observer",
      reason:
        "No vendor-status or independent-probe observer wired for this provider yet.",
    });
  }
  providerDataGaps.push({
    field: "Regional availability",
    reason:
      "Per-provider regions array is null across the catalogue. Wiring Bedrock / Vertex availability matrices is a planned data expansion.",
  });
  providerDataGaps.push({
    field: "Per-account rate-limit numbers",
    reason:
      "Rate-limit tiers live in account consoles and are not surfaced as verified fields on this site.",
  });

  return (
    <PageShell
      eyebrow="Provider"
      title={provider.name}
      intro={provider.description}
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Providers", href: "/providers" },
          { name: provider.name, href: `/providers/${provider.slug}` },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Providers", href: "/providers" },
            { name: provider.name, href: `/providers/${provider.slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: provider.name,
            url: provider.website ?? undefined,
            sameAs: [provider.website, provider.docsUrl].filter(Boolean),
            description: provider.description,
          },
        ]}
      />

      <EntityActionRail label="Actions" actions={providerActions} />

      <section
        aria-label="Provider overview"
        className="card-surface flex items-start gap-4 p-5"
      >
        <ProviderLogo slug={provider.slug} name={provider.name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">
              {provider.name}
            </h2>
            <VerificationBadge status={provider.verificationStatus} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {provider.headquarters ?? "Headquarters not yet recorded."}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Last checked:{" "}
            {provider.lastCheckedAt
              ? formatDateISO(provider.lastCheckedAt)
              : "not yet"}
            {brandAsset.type !== "none" ? (
              <>
                {" · "}brand mark: {brandAsset.type}
              </>
            ) : null}
          </p>
        </div>
      </section>

      <section aria-label="Primary links" className="space-y-3">
        <SectionHeader
          eyebrow="Official sources"
          title="Primary links"
          description="Vendor-published documentation roots. Linked content has not been individually verified as primary-source citations unless this provider's verification status is 'verified'."
          as="h2"
        />
        <PrimaryLinks provider={provider} />
      </section>

      <section aria-label="Tracked models" className="space-y-3">
        <SectionHeader
          eyebrow="Catalogue"
          title="Tracked models"
          description={`${trackedModels.length} model${trackedModels.length === 1 ? "" : "s"} in the catalogue, ${verifiedCount} verified end-to-end.`}
          cta={
            trackedModels.length
              ? { label: "All models", href: "/models" }
              : undefined
          }
          as="h2"
        />
        {trackedModels.length ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {trackedModels.map((m) => (
              <li key={m.slug}>
                <ModelBadge model={m} providerName={provider.name} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="card-surface p-4 text-sm text-muted-foreground">
            No {provider.name} models in the catalogue yet.
          </p>
        )}
      </section>

      {creatorPricingUnavailable && !isHostedPlatform ? (
        <aside
          role="note"
          aria-label="Creator pricing unavailable"
          className="card-surface p-4 text-sm text-muted-foreground"
        >
          <p className="font-medium text-foreground">
            Creator pricing unavailable
          </p>
          <p className="mt-1">
            {provider.name} does not publish a verified first-party
            API pricing surface for any of its tracked models. Where
            third-party platforms host {provider.name}-created models
            (see &quot;Third-party hosting&quot; below), those rates are
            set by the hosting platform — not by {provider.name}.
          </p>
        </aside>
      ) : null}

      {isHostedPlatform ? (
        <section
          aria-label="Hosted models pricing references"
          className="space-y-3"
        >
          <SectionHeader
            eyebrow="Hosted platform"
            title={`${provider.name} hosts third-party models`}
            description={`${provider.name} is a hosting/inference platform — it bills for models created by other organisations. The rows below are pricing references sourced from ${provider.name}'s own pricing page, not live quotes. ${PRICING_VOLATILITY_NOTE}`}
            as="h2"
          />
          {billedAvailability.length ? (
            <aside className="card-surface p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">
                Hosted model availability ({billedAvailability.length})
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {billedAvailability.map((a) => (
                  <li key={a.id}>
                    {a.modelName ?? a.modelSlug}
                    {a.hostedModelId ? (
                      <>
                        {" — "}
                        <code className="rounded bg-muted px-1 text-[10px]">
                          {a.hostedModelId}
                        </code>
                      </>
                    ) : null}{" "}
                    · pricing reference{" "}
                    {a.pricingAvailable ? "available" : "not verified"}{" "}
                    · {pricingFreshnessLabel(a.pricingFreshness).toLowerCase()}
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left">
                    Model
                  </th>
                  <th scope="col" className="px-4 py-2 text-left">
                    Model creator
                  </th>
                  <th scope="col" className="px-4 py-2 text-left">
                    Hosted model ID
                  </th>
                  <th scope="col" className="px-4 py-2 text-right">
                    Input / 1M
                  </th>
                  <th scope="col" className="px-4 py-2 text-right">
                    Output / 1M
                  </th>
                  <th scope="col" className="px-4 py-2 text-left">
                    Freshness
                  </th>
                  <th scope="col" className="px-4 py-2 text-left">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card">
                {billedHostedRows.map((r) => {
                  const m = getModelBySlug(r.modelSlug);
                  const creator = getProviderBySlug(
                    r.modelCreatorProviderSlug
                  );
                  const input = r.tiers.find(
                    (t) => t.unit === "1M input tokens"
                  );
                  const output = r.tiers.find(
                    (t) => t.unit === "1M output tokens"
                  );
                  return (
                    <tr key={r.id} className="border-t border-border">
                      <th
                        scope="row"
                        className="px-4 py-2 text-left font-medium text-foreground"
                      >
                        {m ? (
                          <Link
                            href={`/models/${m.slug}`}
                            className="hover:underline"
                          >
                            {m.name}
                          </Link>
                        ) : (
                          r.modelSlug
                        )}
                      </th>
                      <td className="px-4 py-2 text-muted-foreground">
                        {creator ? (
                          <Link
                            href={`/providers/${creator.slug}`}
                            className="hover:underline"
                          >
                            {creator.name}
                          </Link>
                        ) : (
                          r.modelCreatorProviderSlug
                        )}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {r.hostedModelId ? (
                          <code className="rounded bg-muted px-1">
                            {r.hostedModelId}
                          </code>
                        ) : (
                          <DataNotVerified />
                        )}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {input && isVerified(input.amount)
                          ? formatUsd(input.amount.value)
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {output && isVerified(output.amount)
                          ? formatUsd(output.amount.value)
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-left text-xs">
                        {(() => {
                          const state = getPricingFreshness(r.lastCheckedAt);
                          return (
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${pricingFreshnessClasses(state)}`}
                            >
                              {pricingFreshnessLabel(state)}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-2 text-left">
                        {r.citation ? (
                          <Link
                            href={r.citation.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            {r.citation.name.split(" — ")[0]}
                          </Link>
                        ) : (
                          <DataNotVerified />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Hosted pricing is set by {provider.name} — not by the
            model&apos;s creator. Rows are source-backed references,
            not live quotes; WebmasterID Models does not rank hosting
            platforms by price. See{" "}
            <Link
              href="/research/api-pricing-methodology#creator-vs-host"
              className="text-primary hover:underline"
            >
              methodology
            </Link>{" "}
            for the full distinction.
          </p>
        </section>
      ) : null}

      {creatorHostedRows.length ? (
        <section
          aria-label="Third-party hosting"
          className="space-y-3"
        >
          <SectionHeader
            eyebrow="Hosted elsewhere"
            title={`Third-party hosting of ${provider.name} models`}
            description={`Pricing references offered by other platforms that host ${provider.name}-created models. ${provider.name} does not set these rates; the hosting platform does. Rows are source-backed references, not live quotes.`}
            as="h2"
          />
          {creatorAvailability.length ? (
            <aside className="card-surface p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">
                Availability across hosting platforms (
                {creatorAvailability.length})
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {creatorAvailability.map((a) => (
                  <li key={a.id}>
                    {a.modelName ?? a.modelSlug} on {a.billingProviderSlug}
                    {a.hostedModelId ? (
                      <>
                        {" — "}
                        <code className="rounded bg-muted px-1 text-[10px]">
                          {a.hostedModelId}
                        </code>
                      </>
                    ) : null}{" "}
                    ·{" "}
                    {pricingFreshnessLabel(a.pricingFreshness).toLowerCase()}
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
          <ul className="space-y-2">
            {creatorHostedRows.map((r) => {
              const m = getModelBySlug(r.modelSlug);
              const billing = getProviderBySlug(r.billingProviderSlug);
              return (
                <li
                  key={r.id}
                  className="card-surface flex flex-col gap-1 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {m ? (
                        <Link
                          href={`/models/${m.slug}`}
                          className="hover:underline"
                        >
                          {m.name}
                        </Link>
                      ) : (
                        r.modelSlug
                      )}{" "}
                      hosted by{" "}
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
                    </p>
                    {r.hostedModelId ? (
                      <code className="text-xs text-muted-foreground">
                        {r.hostedModelId}
                      </code>
                    ) : null}
                  </div>
                  {r.citation ? (
                    <Link
                      href={r.citation.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      {r.citation.name.split(" — ")[0]}
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section aria-label="Data coverage" className="space-y-3">
        <SectionHeader
          eyebrow="What we cover"
          title="Data coverage"
          description="Which areas have verified data for this provider on the WebmasterID Models graph."
          as="h2"
        />
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2 text-left">
                  Area
                </th>
                <th scope="col" className="px-4 py-2 text-left">
                  Coverage
                </th>
              </tr>
            </thead>
            <tbody>
              {COVERAGE_ROWS.map((row) => (
                <tr key={row.label} className="border-t border-border">
                  <th
                    scope="row"
                    className="px-4 py-2 text-left font-medium text-foreground"
                  >
                    {row.label}
                  </th>
                  <td className="px-4 py-2 text-muted-foreground">
                    {row.describe(trackedModels.length, verifiedPricingCount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {provider.notes ? (
        <aside
          role="note"
          aria-label="Notes"
          className="card-surface text-sm text-muted-foreground p-4"
        >
          <p>
            <strong className="text-foreground">Notes:</strong> {provider.notes}
          </p>
        </aside>
      ) : null}

      <EntityDataGaps items={providerDataGaps} />

      <section
        aria-label="Provider entity graph"
        className="card-surface p-5 text-sm"
      >
        <SectionHeader
          eyebrow="Entity graph"
          title="Related coverage"
          as="h2"
        />
        <ul className="mt-3 space-y-2 text-muted-foreground">
          <li>
            Filtered models view:{" "}
            <Link
              href={`/models?provider=${provider.slug}`}
              className="text-primary hover:underline"
            >
              /models?provider={provider.slug}
            </Link>
          </li>
          <li>
            Pricing rows:{" "}
            <Link
              href={`/pricing?provider=${provider.slug}`}
              className="text-primary hover:underline"
            >
              /pricing?provider={provider.slug}
            </Link>
          </li>
          <li>
            Sources:{" "}
            <Link
              href={`/sources?provider=${provider.slug}`}
              className="text-primary hover:underline"
            >
              /sources?provider={provider.slug}
            </Link>
          </li>
          <li>
            Comparisons:{" "}
            <Link
              href={`/compare?provider=${provider.slug}`}
              className="text-primary hover:underline"
            >
              /compare?provider={provider.slug}
            </Link>
          </li>
          <li>
            Status observer:{" "}
            {observer ? (
              <Link
                href={`/api/status/${provider.slug}`}
                prefetch={false}
                className="text-primary hover:underline"
              >
                /api/status/{provider.slug}
              </Link>
            ) : (
              <span>not enabled</span>
            )}
          </li>
        </ul>
      </section>

      {relatedComparisons.length ? (
        <section aria-label="Related comparisons" className="space-y-3">
          <SectionHeader
            eyebrow="Compare"
            title="Comparisons involving this provider"
            as="h2"
          />
          <InternalLinkGrid
            items={relatedComparisons.map((c) => ({
              label: c.name,
              href: `/compare/${c.slug}`,
              description: c.description.slice(0, 120),
            }))}
          />
        </section>
      ) : null}

      {relatedProviders.length ? (
        <section aria-label="Related providers" className="space-y-3">
          <SectionHeader
            eyebrow="Continue"
            title="Related providers"
            description="Providers that appear alongside this one in comparisons, plus the rest of the catalogue."
            as="h2"
          />
          <InternalLinkGrid
            items={relatedProviders.map((p) => ({
              label: p.name,
              href: `/providers/${p.slug}`,
              description: p.headquarters ?? undefined,
            }))}
          />
        </section>
      ) : null}

      <EntityMethodologyLinks
        links={[
          {
            href: "/docs/provider-coverage",
            label: "Provider coverage reference",
            family: "docs",
          },
          {
            href: "/research/source-verification-methodology",
            label: "Source verification methodology",
            family: "research",
          },
          {
            href: "/research/ai-provider-status-monitoring",
            label: "AI provider status monitoring",
            family: "research",
          },
          {
            href: "/docs/data-verification",
            label: "Data verification rules",
            family: "docs",
          },
        ]}
      />

      {(() => {
        const attempts = attemptsByProvider(provider.slug);
        if (!attempts.length) return null;
        return (
          <section
            aria-label="Verification attempts"
            className="space-y-3"
          >
            <SectionHeader
              eyebrow="Audit log"
              title="Verification attempts"
              description="Every primary-source URL targeted for this provider and what came back. Blocked attempts are recorded honestly rather than substituted with second-hand data."
              cta={{ label: "All coverage", href: "/coverage" }}
              as="h2"
            />
            <ul className="space-y-2">
              {attempts.map((a) => (
                <li
                  key={`${a.url}-${a.attemptedAt}`}
                  className="card-surface flex flex-col gap-2 p-4 text-sm sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">
                      {a.target}
                    </p>
                    <Link
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block break-all text-xs text-primary hover:underline"
                    >
                      {a.url.replace(/^https?:\/\//, "")}
                    </Link>
                    {a.notes ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {a.notes}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{formatDateISO(a.attemptedAt)}</p>
                    <p className="mt-0.5 font-medium uppercase tracking-wider">
                      {a.result.replace(/-/g, " ")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })()}
    </PageShell>
  );
}
