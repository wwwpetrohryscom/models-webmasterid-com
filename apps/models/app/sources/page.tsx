import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { SourceCitationItem } from "@/components/SourceCitation";
import { DataNotVerified } from "@/components/DataNotVerified";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { isFilteredRoute, robotsMetadata } from "@/lib/should-index";
import { models } from "@/data/models";
import { providers } from "@/data/providers";
import { hostedPricing } from "@/data/hosted-pricing";
import {
  anthropicStatusPage,
  anthropicApiHostProbeTarget,
  googleCloudStatusIncidents,
} from "@/data/citations";
import { isVerified } from "@/lib/verified";
import type { SourceCitation, SourceType } from "@/lib/types";

type SearchParams = Record<string, string | string[] | undefined>;

interface PageProps {
  searchParams: Promise<SearchParams>;
}

/**
 * Sources that back observations rather than model facts. These are not
 * referenced by `model.citations` because they document monitoring
 * inputs (vendor status feeds and independent HTTP probe targets), not
 * verified model metrics.
 */
const STATUS_MONITORING_SOURCES: SourceCitation[] = [
  anthropicStatusPage,
  anthropicApiHostProbeTarget,
  googleCloudStatusIncidents,
];

const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  "official-vendor-docs": "Official vendor docs",
  "official-vendor-pricing": "Official vendor pricing",
  "official-vendor-site": "Official vendor site",
  "regulatory-filing": "Regulatory filing",
  "research-paper": "Research paper",
  "public-dataset": "Public dataset",
  unknown: "Unknown",
};

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
      title: "Sources",
      description:
        "Every primary-source citation backing a verified value on WebmasterID Models. Grouped by provider and source type; each entry links back to the live source page. Filter by provider or source type.",
      path: "/sources",
    }),
    robots: robotsMetadata(!filtered),
  };
}

/**
 * Build a deduplicated index of every citation referenced by any model
 * entity, plus the status-monitoring sources. The index records, for
 * each unique URL, which providers it appears under and what kind of
 * entity it backs (model / status).
 */
interface IndexedCitation {
  citation: SourceCitation;
  providerSlugs: Set<string>;
  usage: Set<"model" | "status" | "hosted-pricing">;
}

function buildCitationIndex(): IndexedCitation[] {
  const byUrl = new Map<string, IndexedCitation>();

  function ensure(c: SourceCitation): IndexedCitation {
    let entry = byUrl.get(c.url);
    if (!entry) {
      entry = { citation: c, providerSlugs: new Set(), usage: new Set() };
      byUrl.set(c.url, entry);
    }
    return entry;
  }

  for (const m of models) {
    for (const c of m.citations) {
      const e = ensure(c);
      e.providerSlugs.add(m.providerSlug);
      e.usage.add("model");
    }
  }

  for (const c of STATUS_MONITORING_SOURCES) {
    const e = ensure(c);
    // Heuristic provider attribution for status citations: match
    // hostname against known provider tokens.
    if (/anthropic|claude/i.test(c.url)) {
      e.providerSlugs.add("anthropic");
    }
    if (/google\.com|gcp|cloud\.google/i.test(c.url)) {
      e.providerSlugs.add("google");
    }
    e.usage.add("status");
  }

  // Hosted-provider pricing citations are attributed to the BILLING
  // provider (Groq, Together AI) — that's whose pricing page the row
  // was sourced from. The model creator's source surface is unaffected.
  for (const r of hostedPricing) {
    if (r.citation) {
      const e = ensure(r.citation);
      e.providerSlugs.add(r.billingProviderSlug);
      e.usage.add("hosted-pricing");
    }
    for (const t of r.tiers) {
      if (isVerified(t.amount)) {
        const e = ensure(t.amount.citation);
        e.providerSlugs.add(r.billingProviderSlug);
        e.usage.add("hosted-pricing");
      }
    }
  }

  return Array.from(byUrl.values());
}

export default async function SourcesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const providerFilter = readParam(params, "provider");
  const sourceTypeFilter = readParam(params, "sourceType") as
    | SourceType
    | undefined;

  const filtered = isFilteredRoute(params);

  const allCitations = buildCitationIndex();

  const visible = allCitations.filter((entry) => {
    if (
      providerFilter &&
      !entry.providerSlugs.has(providerFilter) &&
      // a citation with no provider attachment shouldn't survive a provider filter
      true
    ) {
      if (!entry.providerSlugs.has(providerFilter)) return false;
    }
    if (sourceTypeFilter && entry.citation.type !== sourceTypeFilter) {
      return false;
    }
    return true;
  });

  const visibleByProvider: Record<string, IndexedCitation[]> = {};
  for (const entry of visible) {
    const slugs = entry.providerSlugs.size
      ? Array.from(entry.providerSlugs)
      : ["other"];
    for (const slug of slugs) {
      (visibleByProvider[slug] ??= []).push(entry);
    }
  }

  const visibleByType: Record<string, IndexedCitation[]> = {};
  for (const entry of visible) {
    (visibleByType[entry.citation.type] ??= []).push(entry);
  }

  const providerOrder = providers.map((p) => p.slug);

  return (
    <PageShell
      eyebrow="Transparency"
      title="Sources"
      intro={`Every primary-source citation that backs a verified value on this site. ${allCitations.length} unique URLs are indexed below. Each entry records when it was last retrieved and a short note describing what was used.`}
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Sources", href: "/sources" },
        ]}
      />

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Sources", href: "/sources" },
        ])}
      />

      <aside
        role="note"
        aria-label="Sources caveat"
        className="card-surface p-4 text-sm text-muted-foreground"
      >
        <p>
          This page is the audit trail. If a metric appears on a model or
          provider page, the source it came from is listed here — and
          conversely, if a metric is rendered as <DataNotVerified />, no
          citation exists for it yet. Pricing sources are classified as{" "}
          <em>first-party pricing reference</em> (the model creator&apos;s
          own pricing page) or{" "}
          <em>hosted pricing reference</em> (a hosting platform&apos;s
          page). Both are reference values, not live quotes. For
          per-attempt outcomes (including blocked retrievals), see{" "}
          <Link href="/coverage" className="text-primary hover:underline">
            /coverage
          </Link>
          . For the methodology behind these citations, see{" "}
          <Link
            href="/research/source-verification-methodology"
            className="text-primary hover:underline"
          >
            /research/source-verification-methodology
          </Link>{" "}
          and the reference at{" "}
          <Link
            href="/docs/data-verification"
            className="text-primary hover:underline"
          >
            /docs/data-verification
          </Link>
          .
        </p>
      </aside>

      <form
        method="get"
        action="/sources"
        aria-label="Filter citations"
        className="card-surface p-4"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">Provider</span>
            <select
              name="provider"
              defaultValue={providerFilter ?? ""}
              aria-label="Filter by provider"
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">All providers</option>
              {providers.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">
              Source type
            </span>
            <select
              name="sourceType"
              defaultValue={sourceTypeFilter ?? ""}
              aria-label="Filter by source type"
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">All source types</option>
              {(
                Object.keys(SOURCE_TYPE_LABEL) as SourceType[]
              ).map((k) => (
                <option key={k} value={k}>
                  {SOURCE_TYPE_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-3 text-xs text-muted-foreground">
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-lg border border-primary/30 bg-primary/10 px-3 font-medium text-primary hover:bg-primary/15"
            >
              Apply filters
            </button>
            {filtered ? (
              <Link href="/sources" className="text-primary hover:underline">
                Reset
              </Link>
            ) : null}
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {visible.length} citation{visible.length === 1 ? "" : "s"} match
          {filtered ? " the current filters" : ""}. Filtered URLs are{" "}
          <code className="rounded bg-muted px-1">noindex, follow</code>.
        </p>
      </form>

      <section
        aria-label="By source type"
        className="space-y-3"
      >
        <SectionHeader
          eyebrow="Grouped"
          title="By source type"
          as="h2"
          description="Distribution of indexed citations across the source-type allow-list."
        />
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(SOURCE_TYPE_LABEL) as SourceType[]).map((t) => {
            const count = visibleByType[t]?.length ?? 0;
            return (
              <li
                key={t}
                className="card-surface flex items-center justify-between gap-3 p-3 text-sm"
              >
                <span className="text-muted-foreground">
                  {SOURCE_TYPE_LABEL[t]}
                </span>
                <span className="font-semibold tabular-nums text-foreground">
                  {count}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        aria-label="Status monitoring sources"
        className="space-y-3"
      >
        <SectionHeader
          eyebrow="Status monitoring"
          title={`${STATUS_MONITORING_SOURCES.length} vendor-reported status source${STATUS_MONITORING_SOURCES.length === 1 ? "" : "s"}`}
          description="Sources read by the Sprint 9 status observers in lib/observers/. Vendor-reported only — independent HTTP probes are not yet enabled."
          as="h2"
        />
        <ul className="grid gap-2 sm:grid-cols-2">
          {STATUS_MONITORING_SOURCES.map((c) => (
            <li key={c.url}>
              <SourceCitationItem citation={c} />
            </li>
          ))}
        </ul>
      </section>

      {providerOrder.map((slug) => {
        const list = (visibleByProvider[slug] ?? []).map(
          (entry) => entry.citation
        );
        // Deduplicate citations per provider section (a single URL can
        // attach to multiple providers via the index, but each section
        // should show each URL once).
        const dedup = Array.from(
          new Map(list.map((c) => [c.url, c])).values()
        );
        if (!dedup.length) return null;
        const provider = providers.find((p) => p.slug === slug);
        return (
          <section
            key={slug}
            aria-label={`Sources for ${provider?.name ?? slug}`}
            className="space-y-3"
          >
            <SectionHeader
              eyebrow={provider?.name ?? slug}
              title={`${dedup.length} primary-source citation${dedup.length === 1 ? "" : "s"}`}
              as="h2"
            />
            <ul className="grid gap-2 sm:grid-cols-2">
              {dedup.map((c) => (
                <li key={c.url}>
                  <SourceCitationItem citation={c} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </PageShell>
  );
}
