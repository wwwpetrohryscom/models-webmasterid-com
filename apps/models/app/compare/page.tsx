import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { VerificationBadge } from "@/components/VerificationBadge";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SectionHeader } from "@/components/SectionHeader";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import {
  isFilteredRoute,
  robotsMetadata,
  shouldIndexComparison,
} from "@/lib/should-index";
import { comparisons } from "@/data/comparisons";
import { getModelBySlug } from "@/data/models";
import { providers } from "@/data/providers";
import { hostedPricingForModel } from "@/data/hosted-pricing";
import { getReverificationQueue } from "@/lib/reverification";
import {
  getComparisonClusters,
  getComparisonCoverageSummary,
} from "@/lib/comparison-clusters";
import type { ComparisonEntity, VerificationStatus } from "@/lib/types";

type SearchParams = Record<string, string | string[] | undefined>;

interface PageProps {
  searchParams: Promise<SearchParams>;
}

function readParam(
  searchParams: SearchParams,
  key: string
): string | undefined {
  const v = searchParams[key];
  if (typeof v === "string" && v.trim().length > 0) return v.trim();
  return undefined;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const filtered = isFilteredRoute(params);
  return {
    ...buildMetadata({
      title: "Compare AI Models",
      description:
        "Side-by-side AI model comparisons across pricing, infrastructure, and use cases. No winner is declared. Filter by provider, verification, or indexability.",
      path: "/compare",
    }),
    robots: robotsMetadata(!filtered),
  };
}

type Bucket = "two-sided" | "one-sided" | "pending";

function classifyComparison(c: ComparisonEntity): Bucket {
  const a = getModelBySlug(c.modelA);
  const b = getModelBySlug(c.modelB);
  const aVerified = a?.verificationStatus === "verified";
  const bVerified = b?.verificationStatus === "verified";
  if (aVerified && bVerified) return "two-sided";
  if (aVerified || bVerified) return "one-sided";
  return "pending";
}

function involvesProvider(c: ComparisonEntity, providerSlug: string): boolean {
  const a = getModelBySlug(c.modelA);
  const b = getModelBySlug(c.modelB);
  return a?.providerSlug === providerSlug || b?.providerSlug === providerSlug;
}

function ComparisonCard({ c }: { c: ComparisonEntity }) {
  const indexable = shouldIndexComparison(
    c,
    getModelBySlug(c.modelA),
    getModelBySlug(c.modelB)
  );
  return (
    <Link
      href={`/compare/${c.slug}`}
      className="card-surface flex h-full flex-col p-5 transition hover:border-primary/30 hover:shadow-elevated"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">{c.name}</h3>
        <VerificationBadge status={c.verificationStatus} />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs">
        <span
          className={
            indexable
              ? "rounded-full border border-success/30 bg-success/10 px-2 py-0.5 font-medium text-success"
              : "rounded-full border border-muted-foreground/30 bg-muted px-2 py-0.5 font-medium text-muted-foreground"
          }
        >
          {indexable ? "Indexed" : "Noindex"}
        </span>
        <span className="text-primary">View comparison →</span>
      </div>
    </Link>
  );
}

export default async function CompareIndexPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = readParam(params, "q")?.toLowerCase();
  const providerFilter = readParam(params, "provider");
  const verificationFilter = readParam(params, "verification") as
    | VerificationStatus
    | undefined;
  const indexableFilter = readParam(params, "indexable") as
    | "yes"
    | "no"
    | undefined;

  const filtered = isFilteredRoute(params);

  const filteredComparisons = comparisons.filter((c) => {
    if (q) {
      const haystack = `${c.name} ${c.description ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (providerFilter && !involvesProvider(c, providerFilter)) return false;
    if (verificationFilter && c.verificationStatus !== verificationFilter) {
      return false;
    }
    if (indexableFilter) {
      const indexable = shouldIndexComparison(
        c,
        getModelBySlug(c.modelA),
        getModelBySlug(c.modelB)
      );
      if (indexableFilter === "yes" && !indexable) return false;
      if (indexableFilter === "no" && indexable) return false;
    }
    return true;
  });

  const twoSided = filteredComparisons.filter(
    (c) => classifyComparison(c) === "two-sided"
  );
  const oneSided = filteredComparisons.filter(
    (c) => classifyComparison(c) === "one-sided"
  );
  const pending = filteredComparisons.filter(
    (c) => classifyComparison(c) === "pending"
  );

  return (
    <PageShell
      eyebrow="Side-by-side"
      title="Compare AI Models"
      intro="Each comparison is a structured entity backed by the same model and provider records used across WebmasterID Models. Where values are unverified, they are explicitly marked. No winner is declared."
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Compare", href: "/compare" },
        ]}
      />

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Compare", href: "/compare" },
        ])}
      />

      <aside
        role="note"
        aria-label="Start from a use case"
        className="card-surface space-y-2 p-4 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          Start from a use case
        </p>
        <p>
          Comparisons are most useful after a use case narrows which
          verified fields matter. Pick a workflow first, then return
          with a focused candidate pair.
        </p>
        <p className="text-xs">
          <Link
            href="/use-cases/long-context-analysis"
            className="text-primary hover:underline"
          >
            long-context analysis
          </Link>
          {" · "}
          <Link
            href="/use-cases/multimodal-input"
            className="text-primary hover:underline"
          >
            multimodal input
          </Link>
          {" · "}
          <Link
            href="/use-cases/hosted-inference"
            className="text-primary hover:underline"
          >
            hosted inference
          </Link>
          {" · "}
          <Link
            href="/use-cases/governance-review"
            className="text-primary hover:underline"
          >
            governance review
          </Link>
          {" · "}
          <Link href="/use-cases" className="text-primary hover:underline">
            all use cases
          </Link>
          {" · "}
          <Link href="/select" className="text-primary hover:underline">
            /select
          </Link>
        </p>
      </aside>

      <aside
        aria-label="Build a custom comparison"
        className="card-surface space-y-2 p-4 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          Build a custom comparison
        </p>
        <p>
          The static comparison pages below cover curated, two-sided
          verified pairs. The builder at{" "}
          <Link
            href="/compare/build"
            className="text-primary hover:underline"
          >
            /compare/build
          </Link>{" "}
          lets you inspect any supported 2–4 models side by side
          without creating a permanent indexable page. Generated query
          URLs are noindex; the unfiltered base page is indexable.
        </p>
        <p className="text-xs">
          <Link
            href="/compare/build"
            className="text-primary hover:underline"
          >
            /compare/build
          </Link>
          {" · "}
          <Link
            href="/compare/build?useCase=long-context-analysis"
            className="text-primary hover:underline"
          >
            seed from long-context shortlist
          </Link>
          {" · "}
          <Link
            href="/compare/build?useCase=hosted-inference"
            className="text-primary hover:underline"
          >
            seed from hosted-inference shortlist
          </Link>
          {" · "}
          <Link
            href="/compare/build?useCase=governance-review"
            className="text-primary hover:underline"
          >
            seed from governance-review shortlist
          </Link>
        </p>
      </aside>

      {(() => {
        const coverage = getComparisonCoverageSummary();
        const hostedSet = new Set(
          comparisons
            .filter(
              (c) =>
                hostedPricingForModel(c.modelA).length > 0 ||
                hostedPricingForModel(c.modelB).length > 0
            )
            .map((c) => c.slug)
        );
        const reviewQueue = getReverificationQueue();
        const reviewModels = new Set(
          reviewQueue
            .map((q) => q.entitySlug)
            .filter((s): s is string => Boolean(s))
        );
        const affectedByReview = comparisons.filter(
          (c) =>
            reviewModels.has(c.modelA) || reviewModels.has(c.modelB)
        ).length;
        const cards: { label: string; value: number; href: string }[] = [
          {
            label: "Two-sided verified",
            value: coverage.twoSidedVerified,
            href: "/compare?verification=verified",
          },
          {
            label: "One-sided verified",
            value: coverage.oneSidedVerified,
            href: "/compare?verification=partial",
          },
          {
            label: "Pending",
            value: coverage.pending,
            href: "/compare?verification=unverified",
          },
          {
            label: "With hosted pricing references",
            value: hostedSet.size,
            href: "/pricing",
          },
          {
            label: "Affected by review queue",
            value: affectedByReview,
            href: "/reverification",
          },
        ];
        return (
          <section
            aria-label="Comparison cluster summary"
            className="space-y-3"
          >
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {cards.map((card) => (
                <li key={card.label}>
                  <Link
                    href={card.href}
                    className="card-surface block p-3 transition hover:border-primary/30 hover:shadow-elevated"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {card.label}
                    </p>
                    <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                      {card.value}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })()}

      {(() => {
        const clusters = getComparisonClusters();
        if (!clusters.length) return null;
        return (
          <section
            aria-label="Comparison clusters"
            className="space-y-3"
          >
            <SectionHeader
              eyebrow="Clusters"
              title="Comparisons by provider"
              description="Each comparison appears in every cluster it touches — Mistral × Anthropic shows under both sides. Verified counts on the right tell you how complete each cluster is. Comparisons are reference views, not winner rankings."
              as="h2"
            />
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {clusters.map((cluster) => (
                <li
                  key={cluster.providerSlug}
                  className="card-surface space-y-2 p-4 text-sm"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Link
                      href={`/providers/${cluster.providerSlug}`}
                      className="text-base font-semibold text-foreground hover:underline"
                    >
                      {cluster.providerName}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {cluster.comparisons.length} comparison
                      {cluster.comparisons.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <ul className="text-xs text-muted-foreground">
                    <li>
                      Two-sided verified:{" "}
                      <strong className="text-foreground">
                        {cluster.twoSidedVerified}
                      </strong>
                    </li>
                    <li>
                      One-sided verified:{" "}
                      <strong className="text-foreground">
                        {cluster.oneSidedVerified}
                      </strong>
                    </li>
                    <li>
                      Pending:{" "}
                      <strong className="text-foreground">
                        {cluster.pending}
                      </strong>
                    </li>
                  </ul>
                  <ul className="space-y-1 pt-1 text-xs">
                    {cluster.comparisons.slice(0, 6).map((c) => (
                      <li key={c.slug}>
                        <Link
                          href={`/compare/${c.slug}`}
                          className="text-primary hover:underline"
                        >
                          {c.name}
                        </Link>
                      </li>
                    ))}
                    {cluster.comparisons.length > 6 ? (
                      <li className="text-muted-foreground">
                        + {cluster.comparisons.length - 6} more
                      </li>
                    ) : null}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        );
      })()}

      <aside
        role="note"
        aria-label="Comparison policy"
        className="card-surface border-warning/20 bg-warning/5 p-4 text-sm text-foreground"
      >
        <p>
          <strong>No winner declared.</strong> Every comparison sets
          verified attributes side-by-side. Readers compare against their
          own workload; the platform does not rank, score, or recommend a
          model over another. See{" "}
          <Link
            href="/docs/comparison-methodology"
            className="text-primary hover:underline"
          >
            /docs/comparison-methodology
          </Link>{" "}
          for the rules behind the two-sided / one-sided / pending
          buckets.
        </p>
      </aside>

      <form
        method="get"
        action="/compare"
        aria-label="Filter comparisons"
        className="card-surface p-4"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">Search</span>
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Filter by name…"
              aria-label="Search comparisons"
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">Provider</span>
            <select
              name="provider"
              defaultValue={providerFilter ?? ""}
              aria-label="Filter by provider"
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">Any provider</option>
              {providers.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">
              Verification
            </span>
            <select
              name="verification"
              defaultValue={verificationFilter ?? ""}
              aria-label="Filter by verification status"
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">Any status</option>
              <option value="verified">Verified</option>
              <option value="partial">Partially verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">
              Indexable
            </span>
            <select
              name="indexable"
              defaultValue={indexableFilter ?? ""}
              aria-label="Filter by indexability"
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">Either</option>
              <option value="yes">Indexed only</option>
              <option value="no">Noindex only</option>
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <button
            type="submit"
            className="inline-flex h-8 items-center rounded-lg border border-primary/30 bg-primary/10 px-3 font-medium text-primary hover:bg-primary/15"
          >
            Apply filters
          </button>
          {filtered ? (
            <Link href="/compare" className="text-primary hover:underline">
              Reset
            </Link>
          ) : null}
          <span>
            {filteredComparisons.length} comparison
            {filteredComparisons.length === 1 ? "" : "s"} match.
          </span>
        </div>
      </form>

      <section aria-label="Two-sided verified" className="space-y-3">
        <SectionHeader
          eyebrow="Strongest signal"
          title={`Two-sided verified (${twoSided.length})`}
          description="Both compared models are verified end-to-end against primary sources. Indexable."
          as="h2"
        />
        {twoSided.length ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {twoSided.map((c) => (
              <li key={c.slug}>
                <ComparisonCard c={c} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="card-surface p-4 text-sm text-muted-foreground">
            No two-sided verified comparisons match the current filters.
          </p>
        )}
      </section>

      <section aria-label="One-sided verified" className="space-y-3">
        <SectionHeader
          eyebrow="Mixed signal"
          title={`One-sided verified (${oneSided.length})`}
          description="Only one of the two compared models is verified end-to-end. Useful as a reference but limited; indexed only if our policy still considers the page substantial."
          as="h2"
        />
        {oneSided.length ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {oneSided.map((c) => (
              <li key={c.slug}>
                <ComparisonCard c={c} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="card-surface p-4 text-sm text-muted-foreground">
            No one-sided verified comparisons match the current filters.
          </p>
        )}
      </section>

      <section aria-label="Pending data" className="space-y-3">
        <SectionHeader
          eyebrow="Thin"
          title={`Pending data (${pending.length})`}
          description="Neither side is verified yet. Kept structural until verification lands; noindex."
          as="h2"
        />
        {pending.length ? (
          <ul className="grid gap-4 sm:grid-cols-2">
            {pending.map((c) => (
              <li key={c.slug}>
                <ComparisonCard c={c} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="card-surface p-4 text-sm text-muted-foreground">
            No pending comparisons match the current filters.
          </p>
        )}
      </section>

      <aside className="card-surface p-4 text-sm text-muted-foreground">
        <p>
          Filtered URLs on this hub are{" "}
          <code className="rounded bg-muted px-1">noindex, follow</code>;
          canonical{" "}
          <Link href="/compare" className="text-primary hover:underline">
            /compare
          </Link>{" "}
          remains the indexable entry point. See{" "}
          <Link href="/coverage" className="text-primary hover:underline">
            /coverage
          </Link>{" "}
          for per-provider verification state and{" "}
          <Link href="/sources" className="text-primary hover:underline">
            /sources
          </Link>{" "}
          for the citation index.
        </p>
      </aside>
    </PageShell>
  );
}
