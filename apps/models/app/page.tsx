import Link from "next/link";
import type { Metadata } from "next";
import { Hero } from "@/components/Hero";
import { StatCard } from "@/components/StatCard";
import { DashboardCard } from "@/components/DashboardCard";
import { ModelBadge } from "@/components/ModelBadge";
import { ProviderLogo } from "@/components/ProviderLogo";
import { SectionHeader } from "@/components/SectionHeader";
import { JsonLd } from "@/components/JsonLd";
import { VerificationBadge } from "@/components/VerificationBadge";
import { VerifiedField } from "@/components/VerifiedField";
import { siteConfig } from "@/lib/site-config";
import {
  buildMetadata,
  organizationJsonLd,
  softwareAppJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import { models, featuredModels, getModelBySlug } from "@/data/models";
import { providers, getProviderBySlug } from "@/data/providers";
import { benchmarks } from "@/data/benchmarks";
import { topComparisons } from "@/data/comparisons";
import { regions } from "@/data/regions";
import { pricing } from "@/data/pricing";
import { unknownLabel } from "@/lib/utils";
import { isVerified } from "@/lib/verified";

export const metadata: Metadata = buildMetadata({
  title: siteConfig.name,
  description: siteConfig.description,
  path: "/",
});

const trustItems = [
  {
    title: "Verified & Transparent",
    body: "Every metric is sourced and timestamped. When a value cannot be confirmed, we say so explicitly.",
  },
  {
    title: "Real-time Intelligence",
    body: "Model launches, pricing changes, and infrastructure shifts are tracked continuously rather than annually.",
  },
  {
    title: "Comprehensive Coverage",
    body: "From frontier providers to open-weights labs and inference platforms — one structured graph.",
  },
  {
    title: "Built for Builders",
    body: "Structured data for engineers shipping AI products, not headlines for newsletters.",
  },
  {
    title: "Actionable Insights",
    body: "Compare pricing, latency, regions, and benchmarks side-by-side without leaving the page.",
  },
];

export default function HomePage() {
  return (
    <>
      <JsonLd
        data={[websiteJsonLd(), organizationJsonLd(), softwareAppJsonLd()]}
      />

      <Hero />

      {/* Stats strip */}
      <section
        aria-label="Coverage statistics"
        className="container-page mt-10"
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            label="Models tracked"
            value={String(models.length)}
            hint="seed dataset"
          />
          <StatCard
            label="Providers"
            value={String(providers.length)}
            hint="seed dataset"
          />
          <StatCard
            label="Benchmarks"
            value={String(benchmarks.length)}
            hint="seed dataset"
          />
          <StatCard
            label="Pricing entries"
            value={String(pricing.length)}
            hint="seed dataset"
          />
          <StatCard
            label="Regions monitored"
            value={String(regions.length)}
            hint="seed dataset"
          />
          <StatCard
            label="Avg API uptime"
            value={unknownLabel()}
            hint="not yet measured"
          />
        </div>
      </section>

      {/* Tracked providers strip */}
      <section
        aria-label="Tracked providers"
        className="container-page mt-12"
      >
        <SectionHeader
          eyebrow="Tracked providers"
          title="Providers covered"
          description="Frontier labs and inference platforms in the catalogue. Logos are in-repo lettermarks pending review of each provider's official brand resources. WebmasterID Models is independent and not affiliated with any listed provider."
          cta={{ label: "All providers", href: "/providers" }}
        />
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {providers.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/providers/${p.slug}`}
                className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/30 hover:shadow-elevated"
              >
                <ProviderLogo slug={p.slug} name={p.name} size="lg" />
                <span className="text-xs font-medium text-foreground">
                  {p.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Source-backed intelligence + verified preview */}
      <section
        aria-label="How verification works"
        className="container-page mt-16 grid gap-4 lg:grid-cols-3"
      >
        <article className="card-surface p-6 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Source-backed intelligence
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            Primary sources only. Verification before rendering.
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Primary sources only:</strong>{" "}
              official vendor documentation, official pricing pages,
              regulatory filings, peer-reviewed papers, public datasets.
              Blogs, social posts, and AI-generated summaries are not
              primary sources.
            </li>
            <li>
              <strong className="text-foreground">Timestamped citations:</strong>{" "}
              every verified field carries a <code className="rounded bg-muted px-1 py-0.5 text-xs">sourceUrl</code>,{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">sourceName</code>,{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">sourceType</code>,
              and <code className="rounded bg-muted px-1 py-0.5 text-xs">retrievedAt</code>.
            </li>
            <li>
              <strong className="text-foreground">No fabricated metrics:</strong>{" "}
              unverified pricing, benchmark scores, latency, and uptime
              are surfaced through a single canonical unverified-data
              label — never substituted with estimates.
            </li>
            <li>
              <strong className="text-foreground">JSON-LD discipline:</strong>{" "}
              schema.org markup only emits fields backed by a citation.
              Search engines and AI surfaces never see unverified claims
              from this site.
            </li>
            <li>
              <strong className="text-foreground">Type-system guard:</strong>{" "}
              metric fields are typed{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">MaybeVerified&lt;T&gt;</code>{" "}
              — the build refuses to ship if a non-null metric lacks a
              citation.
            </li>
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            See{" "}
            <Link href="/docs" className="text-primary hover:underline">
              /docs
            </Link>{" "}
            for the verification workflow,{" "}
            <Link href="/coverage" className="text-primary hover:underline">
              /coverage
            </Link>{" "}
            for the per-provider audit log, and{" "}
            <Link href="/sources" className="text-primary hover:underline">
              /sources
            </Link>{" "}
            for the full citation index.
          </p>
        </article>

        {(() => {
          const opus4 = getModelBySlug("claude-opus-4");
          if (!opus4) return null;
          const verifiedFieldCount =
            (isVerified(opus4.apiIdentifiers) ? 1 : 0) +
            (isVerified(opus4.contextWindow) ? 1 : 0) +
            (isVerified(opus4.maxOutputTokens) ? 1 : 0) +
            (isVerified(opus4.modality) ? 1 : 0) +
            (isVerified(opus4.knowledgeCutoff) ? 1 : 0) +
            (isVerified(opus4.features) ? 1 : 0) +
            (isVerified(opus4.lifecycle) ? 1 : 0) +
            opus4.pricing.filter((t) => isVerified(t.amount)).length;
          return (
            <article className="card-surface p-6" aria-label="Verified preview: Claude Opus 4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Verified preview
              </p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">
                {opus4.name}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Gold-standard worked example for the verification workflow.
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Verified fields</dt>
                  <dd className="font-medium tabular-nums text-foreground">
                    {verifiedFieldCount}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Sources</dt>
                  <dd className="font-medium tabular-nums text-foreground">
                    {opus4.citations.length}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Context window</dt>
                  <dd className="font-medium text-foreground">
                    <VerifiedField
                      field={opus4.contextWindow}
                      format={(v) => `${v.toLocaleString("en-US")} tokens`}
                      label="context window"
                      inlineCitation={false}
                    />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Lifecycle</dt>
                  <dd className="font-medium text-foreground">
                    <VerifiedField
                      field={opus4.lifecycle}
                      format={(v) =>
                        v.retirementDate
                          ? `${v.status} (retires ${v.retirementDate})`
                          : v.status
                      }
                      label="lifecycle"
                      inlineCitation={false}
                    />
                  </dd>
                </div>
              </dl>
              <Link
                href={`/models/${opus4.slug}`}
                className="mt-4 inline-flex text-xs font-medium text-primary hover:underline"
              >
                View full record →
              </Link>
            </article>
          );
        })()}
      </section>

      {/* Recently verified */}
      <section
        aria-label="Recently verified"
        className="container-page mt-12"
      >
        <SectionHeader
          eyebrow="Verification queue"
          title="Recently verified"
          description="Latest models with primary-source citations on record. Each entry links to its full record where every metric is anchored to the documentation page it came from."
          cta={{ label: "All models", href: "/models" }}
        />
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {([
            "claude-opus-4-7",
            "gemini-2-5-pro",
            "deepseek-v4-pro",
          ] as const)
            .map((slug) => getModelBySlug(slug))
            .filter(
              (m): m is NonNullable<ReturnType<typeof getModelBySlug>> =>
                Boolean(m)
            )
            .map((m) => {
              const p = getProviderBySlug(m.providerSlug);
              const verifiedFieldCount =
                (isVerified(m.apiIdentifiers) ? 1 : 0) +
                (isVerified(m.contextWindow) ? 1 : 0) +
                (isVerified(m.maxOutputTokens) ? 1 : 0) +
                (isVerified(m.modality) ? 1 : 0) +
                (isVerified(m.knowledgeCutoff) ? 1 : 0) +
                (isVerified(m.features) ? 1 : 0) +
                (isVerified(m.lifecycle) ? 1 : 0) +
                m.pricing.filter((t) => isVerified(t.amount)).length;
              return (
                <li key={m.slug}>
                  <Link
                    href={`/models/${m.slug}`}
                    className="card-surface block p-5 transition hover:border-primary/30 hover:shadow-elevated"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {p?.name ?? "Unknown"}
                    </p>
                    <p className="mt-1 text-base font-semibold text-foreground">
                      {m.name}
                    </p>
                    <dl className="mt-3 space-y-1 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">
                          Verified fields
                        </dt>
                        <dd className="font-medium tabular-nums text-foreground">
                          {verifiedFieldCount}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">Sources</dt>
                        <dd className="font-medium tabular-nums text-foreground">
                          {m.citations.length}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">Last checked</dt>
                        <dd className="font-medium text-foreground">
                          {m.lastCheckedAt
                            ? m.lastCheckedAt.slice(0, 10)
                            : "—"}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-3 text-xs font-medium text-primary">
                      View record →
                    </p>
                  </Link>
                </li>
              );
            })}
        </ul>
      </section>

      {/* Dashboard cards */}
      <section
        aria-label="Latest intelligence"
        className="container-page mt-12 space-y-6"
      >
        <SectionHeader
          eyebrow="Live dashboards"
          title="Latest intelligence"
          description="Curated views of the AI model ecosystem. All values are tagged with verification status and last-checked timestamps."
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <DashboardCard
            title="Latest Models"
            description="Recently catalogued AI models"
            href="/models"
            cta="All models"
          >
            <ul className="space-y-2">
              {featuredModels.slice(0, 4).map((m) => {
                const p = getProviderBySlug(m.providerSlug);
                return (
                  <li key={m.slug}>
                    <ModelBadge
                      model={m}
                      providerName={p?.name ?? "Unknown"}
                    />
                  </li>
                );
              })}
            </ul>
          </DashboardCard>

          <DashboardCard
            title="Featured Comparisons"
            description="Side-by-side model breakdowns"
            href="/compare"
            cta="All comparisons"
          >
            <ul className="space-y-2">
              {topComparisons.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/compare/${c.slug}`}
                    className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-3 transition hover:border-primary/30 hover:shadow-elevated"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {c.name}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {c.description}
                      </p>
                    </div>
                    <VerificationBadge status={c.verificationStatus} />
                  </Link>
                </li>
              ))}
            </ul>
          </DashboardCard>

          <DashboardCard
            title="Benchmarks"
            description="Reasoning, coding, knowledge, math"
            href="/benchmarks"
            cta="All benchmarks"
          >
            <ul className="space-y-2">
              {benchmarks.slice(0, 4).map((b) => (
                <li
                  key={b.slug}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {b.name}
                    </p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {b.category}
                    </p>
                  </div>
                  <VerificationBadge status={b.verificationStatus} />
                </li>
              ))}
            </ul>
          </DashboardCard>

          <DashboardCard
            title="Providers"
            description="Frontier labs and inference platforms"
            href="/providers"
            cta="All providers"
          >
            <ul className="grid grid-cols-2 gap-2">
              {providers.slice(0, 6).map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/providers/${p.slug}`}
                    className="flex items-center gap-2 rounded-xl border border-border bg-card p-2.5 transition hover:border-primary/30"
                  >
                    <ProviderLogo slug={p.slug} name={p.name} size="sm" />
                    <span className="truncate text-sm font-medium text-foreground">
                      {p.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </DashboardCard>

          <DashboardCard
            title="API Pricing"
            description="Per-million-token rates"
            href="/pricing"
            cta="All pricing"
          >
            <ul className="space-y-2">
              {pricing.slice(0, 4).map((p) => (
                <li
                  key={p.slug}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {p.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      USD · per 1M tokens
                    </p>
                  </div>
                  <VerificationBadge status={p.verificationStatus} />
                </li>
              ))}
            </ul>
          </DashboardCard>

          <DashboardCard
            title="Regions"
            description="Inference availability map"
            href="/infrastructure"
            cta="View infrastructure"
          >
            <ul className="space-y-2">
              {regions.map((r) => (
                <li
                  key={r.slug}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {r.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.providersAvailable.length} providers tracked
                    </p>
                  </div>
                  <VerificationBadge status={r.verificationStatus} />
                </li>
              ))}
            </ul>
          </DashboardCard>
        </div>
      </section>

      {/* Trust / value strip */}
      <section
        aria-label="Why WebmasterID Models"
        className="container-page mt-16"
      >
        <SectionHeader
          eyebrow="Operating principles"
          title="Why WebmasterID Models"
        />
        <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {trustItems.map((t) => (
            <li key={t.title} className="card-surface p-5">
              <p className="text-sm font-semibold text-foreground">{t.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{t.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Explanatory crawlable section */}
      <section
        aria-labelledby="what-is-section"
        className="container-page mt-16"
      >
        <article className="card-surface p-6 md:p-10">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              About the platform
            </p>
            <h2
              id="what-is-section"
              className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
            >
              What is WebmasterID Models?
            </h2>
          </header>

          <div className="prose-content mt-5 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-foreground">WebmasterID Models</strong>{" "}
              is the AI model infrastructure intelligence layer of the{" "}
              <strong className="text-foreground">WebmasterID</strong>{" "}
              ecosystem. It is a structured intelligence platform focused on
              AI models, the providers behind them, the benchmarks that measure
              them, the pricing that constrains them, and the inference
              infrastructure that runs them. The goal is not to publish
              headlines about AI — the goal is to maintain a verified,
              timestamped, comparable view of the entire AI model stack so that
              engineers, operators, and decision-makers can reason about it
              like any other piece of critical infrastructure.
            </p>
            <p>
              The platform is built for{" "}
              <strong className="text-foreground">
                builders shipping production AI systems
              </strong>
              : engineering teams choosing between frontier APIs, platform
              teams evaluating self-hosted open-weights models, infra teams
              monitoring uptime and regional availability, and product leaders
              comparing total cost of ownership across providers. It is also
              useful for researchers and analysts who need a clean, structured
              entity graph of models, providers, and benchmarks rather than a
              scrape of yesterday's blog posts.
            </p>
            <p>
              Model infrastructure intelligence matters because the AI model
              ecosystem is now operating at the same cadence as cloud
              infrastructure. Prices change weekly, new models launch monthly,
              context windows shift, regions come online, and benchmark
              leadership flips between vendors. Treating that landscape as
              an ad-hoc collection of marketing pages is no longer viable for
              teams whose products depend on choosing the right model and
              provider. WebmasterID Models exists to give that landscape a
              spine: stable identifiers, semantic linking between models,
              providers, pricing, and benchmarks, and a clear separation
              between verified data and unverified claims.
            </p>
            <p>
              This is deliberately not an{" "}
              <strong className="text-foreground">AI news site</strong> and not
              an <strong className="text-foreground">AI tools directory</strong>.
              News sites optimise for novelty; directories optimise for
              affiliate traffic. Neither produces a structured graph you can
              build on. WebmasterID Models is closer to an observability and
              intelligence layer: comparable rows of models, providers,
              benchmarks, prices, regions, and statuses, each with verification
              metadata. The output is data, not opinion.
            </p>
            <p>
              The platform's focus areas are deliberately narrow:{" "}
              <strong className="text-foreground">verified models</strong>{" "}
              with stable slugs and provider attribution, the{" "}
              <strong className="text-foreground">providers</strong> who train
              and serve them,{" "}
              <strong className="text-foreground">API pricing</strong> per unit
              of work, <strong className="text-foreground">benchmarks</strong>{" "}
              spanning reasoning, coding, math, knowledge, and multimodality,{" "}
              <strong className="text-foreground">
                inference infrastructure
              </strong>{" "}
              including regions and latency, real{" "}
              <strong className="text-foreground">status and uptime</strong>{" "}
              signals, and{" "}
              <strong className="text-foreground">side-by-side comparisons</strong>{" "}
              that make tradeoffs explicit rather than hidden.
            </p>
            <p>
              Because the underlying data changes so quickly, citations,
              timestamps, and data freshness are first-class concerns.
              Every entity records when it was last checked and when it was
              last updated; values that are unknown or not yet verified are
              surfaced through a single canonical unverified-data label
              rather than invented. That discipline is what turns a content
              site into a reliable intelligence layer, and it is what
              WebmasterID Models is ultimately optimising for.
            </p>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Canonical URL:{" "}
            <Link
              href={siteConfig.url}
              className="underline-offset-2 hover:underline"
            >
              {siteConfig.url}
            </Link>
          </p>
        </article>
      </section>
    </>
  );
}
