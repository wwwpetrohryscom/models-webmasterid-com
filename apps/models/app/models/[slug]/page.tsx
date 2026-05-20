import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { ProviderLogo } from "@/components/ProviderLogo";
import { VerificationBadge } from "@/components/VerificationBadge";
import { LifecycleBadge } from "@/components/LifecycleBadge";
import { DataFreshness } from "@/components/DataFreshness";
import { PricingTable } from "@/components/PricingTable";
import { BenchmarkTable } from "@/components/BenchmarkTable";
import { InternalLinkGrid } from "@/components/InternalLinkGrid";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { VerifiedField } from "@/components/VerifiedField";
import { VerificationSummary } from "@/components/VerificationSummary";
import { SourceCitationList } from "@/components/SourceCitation";
import { DataNotVerified } from "@/components/DataNotVerified";
import { ApiExample } from "@/components/ApiExample";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { models, getModelBySlug } from "@/data/models";
import { getProviderBySlug } from "@/data/providers";
import { comparisons } from "@/data/comparisons";
import { isVerified } from "@/lib/verified";
import { buildModelJsonLd } from "@/lib/model-jsonld";
import { anthropicModelsOverview } from "@/data/citations";

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
    description: `${model.name} from ${provider?.name ?? "Unknown provider"} — verified pricing, benchmarks, infrastructure, and comparisons. Unverified fields are explicitly marked.`,
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
          buildModelJsonLd(model, provider),
        ]}
      />

      <section aria-label="Model overview" className="card-surface p-5">
        <div className="flex flex-wrap items-center gap-3">
          <ProviderLogo
            slug={model.providerSlug}
            name={provider?.name ?? "Unknown"}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">Provider</p>
            {provider ? (
              <Link
                href={`/providers#${model.providerSlug}`}
                className="text-base font-semibold text-foreground hover:underline"
              >
                {provider.name}
              </Link>
            ) : (
              <DataNotVerified />
            )}
          </div>
          <div className="flex items-center gap-2">
            <VerificationBadge status={model.verificationStatus} />
            <LifecycleBadge field={model.lifecycle} />
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              Snapshot date
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              <VerifiedField field={model.snapshotDate} label="snapshot date" />
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              Context window
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              <VerifiedField
                field={model.contextWindow}
                format={(v) => `${v.toLocaleString("en-US")} tokens`}
                label="context window"
              />
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              Max output
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              <VerifiedField
                field={model.maxOutputTokens}
                format={(v) => `${v.toLocaleString("en-US")} tokens`}
                label="max output"
              />
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              Modality
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              <VerifiedField
                field={model.modality}
                format={(v) => v.join(", ")}
                label="modality"
              />
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

      <VerificationSummary model={model} />

      {isVerified(model.apiIdentifiers) ? (
        <section
          aria-label="API identifiers"
          className="card-surface p-5"
        >
          <SectionHeader
            eyebrow="Reference"
            title="API identifiers"
            as="h2"
            description="Pinned snapshot IDs as listed by the provider."
          />
          <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Canonical
              </dt>
              <dd className="mt-1 font-mono text-foreground">
                {model.apiIdentifiers.value.canonical}
              </dd>
            </div>
            {model.apiIdentifiers.value.alias ? (
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  Alias
                </dt>
                <dd className="mt-1 font-mono text-foreground">
                  {model.apiIdentifiers.value.alias}
                </dd>
              </div>
            ) : null}
            {model.apiIdentifiers.value.bedrock ? (
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  AWS Bedrock
                </dt>
                <dd className="mt-1 break-all font-mono text-foreground">
                  {model.apiIdentifiers.value.bedrock}
                </dd>
              </div>
            ) : null}
            {model.apiIdentifiers.value.vertex ? (
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  Vertex AI
                </dt>
                <dd className="mt-1 break-all font-mono text-foreground">
                  {model.apiIdentifiers.value.vertex}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      <section aria-label="Pricing" className="space-y-3">
        <SectionHeader
          eyebrow="API pricing"
          title="Pricing"
          description="Per-unit rates pulled from official provider documentation. Each row links back to its primary source."
          as="h2"
        />
        <PricingTable
          tiers={model.pricing}
          caption={`${model.name} pricing`}
        />
      </section>

      <section aria-label="Benchmarks" className="space-y-3">
        <SectionHeader
          eyebrow="Capability"
          title="Benchmarks"
          description="Benchmark scores are only published once verified against a primary source. WebmasterID Models does not republish provider-reported scores without an independent reference."
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
          description="Regions, latency, and uptime where independently verified."
          as="h2"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="card-surface p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Regions
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              <VerifiedField
                field={model.infrastructure.regions}
                format={(v) => v.join(", ")}
                label="regions"
              />
            </p>
          </div>
          <div className="card-surface p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Avg latency (ms)
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              <VerifiedField
                field={model.infrastructure.avgLatencyMs}
                label="avg latency"
              />
            </p>
          </div>
          <div className="card-surface p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Uptime (%)
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              <VerifiedField
                field={model.infrastructure.uptimePercent}
                label="uptime"
              />
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

      {model.providerSlug === "anthropic" && isVerified(model.apiIdentifiers) ? (
        <ApiExample
          title={`Calling ${model.name} via the Anthropic Messages API`}
          intro="Shape of a minimal Messages API request using the verified canonical model ID. See the source for the full request schema, headers, streaming, and tool-use details."
          citation={anthropicModelsOverview}
          blocks={[
            {
              label: "curl",
              language: "bash",
              code: `curl https://api.anthropic.com/v1/messages \\
  -H "x-api-key: $ANTHROPIC_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "${model.apiIdentifiers.value.canonical}",
    "max_tokens": 1024,
    "messages": [
      { "role": "user", "content": "Hello, ${model.name}." }
    ]
  }'`,
            },
            {
              label: "TypeScript (@anthropic-ai/sdk)",
              language: "typescript",
              code: `import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const response = await client.messages.create({
  model: "${model.apiIdentifiers.value.canonical}",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello, ${model.name}." }],
});`,
            },
          ]}
        />
      ) : null}

      {model.citations.length ? (
        <SourceCitationList citations={model.citations} />
      ) : (
        <section aria-label="Sources" className="card-surface p-5">
          <h2 className="text-base font-semibold text-foreground">Sources</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No primary-source citations have been recorded for this entity
            yet. See VERIFICATION.md for how entries are verified.
          </p>
        </section>
      )}

      <section
        aria-label="Verification queue"
        className="card-surface p-5"
      >
        <h2 className="text-base font-semibold text-foreground">
          Verification queue
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Next review for this entity targets re-checking pricing against
          official provider documentation and confirming lifecycle state.
          Cadence per field type lives in{" "}
          <Link
            href="/docs"
            className="text-primary hover:underline"
          >
            /docs
          </Link>
          .
        </p>
      </section>
    </PageShell>
  );
}
