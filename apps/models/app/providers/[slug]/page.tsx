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
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { providers, getProviderBySlug } from "@/data/providers";
import { models } from "@/data/models";
import { getBrandAsset } from "@/data/brand-assets";
import { attemptsByProvider } from "@/data/verification-attempts";
import { formatDateISO } from "@/lib/utils";
import {
  getComparisonsForProvider,
  getRelatedProviders,
  getStatusObserverForProvider,
} from "@/lib/entity-graph";

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

  const relatedComparisons = getComparisonsForProvider(provider.slug);
  const relatedProviders = getRelatedProviders(provider.slug);
  const observer = getStatusObserverForProvider(provider.slug);

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
