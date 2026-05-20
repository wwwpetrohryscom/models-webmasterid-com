import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { ProviderLogoBadge } from "@/components/ProviderLogoBadge";
import { VerificationBadge } from "@/components/VerificationBadge";
import { DataFreshness } from "@/components/DataFreshness";
import { PricingTable } from "@/components/PricingTable";
import { BenchmarkTable } from "@/components/BenchmarkTable";
import { InternalLinkGrid } from "@/components/InternalLinkGrid";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { models, getModelBySlug } from "@/data/models";
import { getProviderBySlug } from "@/data/providers";
import { comparisons } from "@/data/comparisons";
import { formatDateISO, unknownLabel } from "@/lib/utils";

interface RouteParams {
  slug: string;
}

export function generateStaticParams(): RouteParams[] {
  return models.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const model = getModelBySlug(slug);
  if (!model) return buildMetadata({ title: "Model", path: `/models/${slug}` });
  const provider = getProviderBySlug(model.providerSlug);
  return buildMetadata({
    title: model.name,
    description: `${model.name} from ${provider?.name ?? "Unknown provider"} — pricing, benchmarks, infrastructure, and comparisons.`,
    path: `/models/${model.slug}`,
  });
}

export default async function ModelPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const model = getModelBySlug(slug);
  if (!model) notFound();
  const provider = getProviderBySlug(model.providerSlug);
  const relatedComparisons = comparisons.filter(
    (c) => c.modelA === model.slug || c.modelB === model.slug
  );

  const modelJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: model.name,
    applicationCategory: "AIModel",
    operatingSystem: "API",
    description: model.description,
    url: `${siteConfig.url}/models/${model.slug}`,
    dateModified: model.updatedDate,
    creator: provider
      ? { "@type": "Organization", name: provider.name, url: provider.website ?? undefined }
      : undefined,
  };

  return (
    <PageShell
      eyebrow="Model intelligence"
      title={model.name}
      intro={model.description}
    >
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Models", href: "/models" },
            { name: model.name, href: `/models/${model.slug}` },
          ]),
          modelJsonLd,
        ]}
      />

      <section
        aria-label="Model overview"
        className="card-surface p-5"
      >
        <div className="flex flex-wrap items-center gap-3">
          <ProviderLogoBadge
            slug={model.providerSlug}
            name={provider?.name ?? "Unknown"}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">Provider</p>
            <Link
              href={`/providers#${model.providerSlug}`}
              className="text-base font-semibold text-foreground hover:underline"
            >
              {provider?.name ?? "Unknown"}
            </Link>
          </div>
          <VerificationBadge status={model.verificationStatus} />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              Release date
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              {model.releaseDate ?? unknownLabel()}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              Context window
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              {model.contextWindow ?? unknownLabel()}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              Modality
            </dt>
            <dd className="mt-1 font-medium capitalize text-foreground">
              {model.modality.join(", ")}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              Updated
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              {formatDateISO(model.updatedDate)}
            </dd>
          </div>
        </dl>

        <div className="mt-4">
          <DataFreshness
            lastCheckedAt={model.lastCheckedAt}
            updatedDate={model.updatedDate}
          />
        </div>
      </section>

      <section aria-label="Pricing" className="space-y-3">
        <SectionHeader
          eyebrow="API pricing"
          title="Pricing"
          description="Per-million-token rates as published by the provider. Values shown as 'Data not yet verified.' have not been confirmed by WebmasterID."
          as="h2"
        />
        <PricingTable
          tiers={model.pricing}
          caption={`${model.name} pricing`}
        />
      </section>

      <section aria-label="Benchmarks" className="space-y-3">
        <SectionHeader
          eyebrow="Benchmarks"
          title="Benchmarks"
          description="Independent and provider-reported benchmark scores. Unverified entries are explicitly labelled."
          as="h2"
        />
        <BenchmarkTable
          scores={model.benchmarks}
          caption={`${model.name} benchmarks`}
        />
      </section>

      <section aria-label="Infrastructure" className="space-y-3">
        <SectionHeader
          eyebrow="Infrastructure"
          title="Inference infrastructure"
          description="Regions, latency, and uptime where available."
          as="h2"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="card-surface p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Regions
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {model.infrastructure.regions?.join(", ") ?? unknownLabel()}
            </p>
          </div>
          <div className="card-surface p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Avg latency (ms)
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {model.infrastructure.avgLatencyMs ?? unknownLabel()}
            </p>
          </div>
          <div className="card-surface p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Uptime (%)
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {model.infrastructure.uptimePercent ?? unknownLabel()}
            </p>
          </div>
        </div>
      </section>

      {relatedComparisons.length ? (
        <section aria-label="Related comparisons" className="space-y-3">
          <SectionHeader
            eyebrow="Compare"
            title="Related comparisons"
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

      <section aria-label="Citations" className="card-surface p-5">
        <h2 className="text-base font-semibold text-foreground">Citations</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {(model.citations ?? []).map((c) => (
            <li key={c.href}>
              <Link
                href={c.href}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                {c.label}
              </Link>
            </li>
          ))}
          {!(model.citations ?? []).length ? (
            <li className="text-muted-foreground">{unknownLabel()}</li>
          ) : null}
        </ul>
      </section>
    </PageShell>
  );
}
