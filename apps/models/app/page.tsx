import Link from "next/link";
import type { Metadata } from "next";
import { Hero } from "@/components/Hero";
import { StatCard } from "@/components/StatCard";
import { DashboardCard } from "@/components/DashboardCard";
import { ModelBadge } from "@/components/ModelBadge";
import { ProviderLogoBadge } from "@/components/ProviderLogoBadge";
import { SectionHeader } from "@/components/SectionHeader";
import { JsonLd } from "@/components/JsonLd";
import { VerificationBadge } from "@/components/VerificationBadge";
import { siteConfig } from "@/lib/site-config";
import {
  buildMetadata,
  organizationJsonLd,
  softwareAppJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import { models, featuredModels } from "@/data/models";
import { providers, getProviderBySlug } from "@/data/providers";
import { benchmarks } from "@/data/benchmarks";
import { topComparisons } from "@/data/comparisons";
import { regions } from "@/data/regions";
import { pricing } from "@/data/pricing";
import { unknownLabel } from "@/lib/utils";

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
                    href={`/providers#${p.slug}`}
                    className="flex items-center gap-2 rounded-xl border border-border bg-card p-2.5 transition hover:border-primary/30"
                  >
                    <ProviderLogoBadge
                      slug={p.slug}
                      name={p.name}
                      size="sm"
                    />
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
              displayed as “Data not yet verified.” rather than invented.
              That discipline is what turns a content site into a reliable
              intelligence layer, and it is what WebmasterID Models is
              ultimately optimising for.
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
