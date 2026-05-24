import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { VerificationBadge } from "@/components/VerificationBadge";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { isFilteredRoute, robotsMetadata } from "@/lib/should-index";
import { siteConfig } from "@/lib/site-config";
import { providers } from "@/data/providers";
import {
  getModelShortlist,
  getShortlistSummary,
  type ModelShortlistFilters,
} from "@/lib/model-shortlists";
import { comparisonBuilderUrl } from "@/lib/comparison-builder";
import { decisionBriefUrl } from "@/lib/decision-briefs";
import { DecisionWorkflow } from "@/components/DecisionWorkflow";
import { modelUseCases, type ModelUseCaseSlug } from "@/lib/use-cases";
import {
  freshnessClasses,
  freshnessLabel,
  type FreshnessState,
} from "@/lib/source-freshness";
import { formatDateISO } from "@/lib/utils";
import { isVerified } from "@/lib/verified";

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

const LIFECYCLE_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "preview", label: "Preview" },
  { value: "deprecated", label: "Deprecated" },
  { value: "retired", label: "Retired" },
];

const MODALITY_OPTIONS = [
  { value: "text-in", label: "Text input" },
  { value: "image-in", label: "Image input" },
  { value: "audio-in", label: "Audio input" },
  { value: "video-in", label: "Video input" },
  { value: "text-out", label: "Text output" },
];

const MIN_CONTEXT_OPTIONS = [
  { value: "32000", label: "≥ 32k" },
  { value: "128000", label: "≥ 128k" },
  { value: "200000", label: "≥ 200k" },
  { value: "1000000", label: "≥ 1M" },
];

const FRESHNESS_OPTIONS = [
  { value: "fresh", label: "Fresh" },
  { value: "review_due", label: "Review due" },
  { value: "stale", label: "Stale" },
  { value: "unknown", label: "Unknown" },
];

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const filtered = isFilteredRoute(params);
  return {
    ...buildMetadata({
      title: "Model Selection Workspace",
      description:
        "Build a source-backed shortlist of AI models using verified context windows, lifecycle status, pricing references, hosted availability, source coverage, and data gaps. No rankings, no recommendations.",
      path: "/select",
    }),
    robots: robotsMetadata(!filtered),
  };
}

export default async function SelectPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const useCaseFilter = readParam(params, "useCase") as
    | ModelUseCaseSlug
    | undefined;
  const providerFilter = readParam(params, "provider");
  const lifecycleFilter = readParam(params, "lifecycle");
  const minContextRaw = readParam(params, "minContext");
  const minContext = minContextRaw ? Number(minContextRaw) : undefined;
  const modalityFilter = readParam(params, "modality");
  const pricingCoverageFilter = readParam(params, "pricingCoverage") as
    | "verified"
    | "any"
    | undefined;
  const hostedAvailabilityFilter = readParam(params, "hostedAvailability") as
    | "true"
    | "false"
    | undefined;
  const verificationFilter = readParam(params, "verification") as
    | "verified"
    | "partial"
    | undefined;
  const freshnessFilter = readParam(params, "freshness") as
    | FreshnessState
    | undefined;
  const filtered = isFilteredRoute(params);

  const filters: ModelShortlistFilters = {
    useCase: useCaseFilter,
    provider: providerFilter,
    lifecycle: lifecycleFilter,
    minContext:
      typeof minContext === "number" && !Number.isNaN(minContext)
        ? minContext
        : undefined,
    modality: modalityFilter,
    pricingCoverage: pricingCoverageFilter,
    hostedAvailability: hostedAvailabilityFilter,
    verification: verificationFilter,
    freshness: freshnessFilter,
  };
  const shortlist = getModelShortlist(filters);
  const summary = getShortlistSummary(filters);
  const total = getModelShortlist().length;

  return (
    <PageShell
      eyebrow="Workspace"
      title="Model Selection Workspace"
      intro="Build a source-backed shortlist using verified context windows, lifecycle status, pricing references, hosted availability, source coverage, and data gaps. This is not a recommendation engine. It surfaces verified fields so a reader can decide which models to investigate."
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Select", href: "/select" },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Select", href: "/select" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Model Selection Workspace",
            url: `${siteConfig.url}/select`,
            description:
              "Source-backed shortlist builder for AI models on WebmasterID Models.",
            dateModified: siteConfig.buildDate,
            isPartOf: { "@type": "WebSite", url: siteConfig.url },
          },
        ]}
      />

      <aside
        role="note"
        aria-label="Selection workspace policy"
        className="card-surface space-y-2 p-4 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">Shortlist, not ranking.</p>
        <p>
          The shortlist orders models by verified field coverage, active
          lifecycle, and source count — never by score. WebmasterID Models
          does not declare a winner, does not rank by price, and does not
          invent metrics. Unknown values remain explicitly unverified;
          unsupported modalities are not asserted.
        </p>
        <p>
          Shortlists help narrow a field set; the comparison builder
          shows verified values side by side. Open the top of this
          shortlist in the builder for a side-by-side view.
        </p>
      </aside>

      <DecisionWorkflow variant="card" highlightStep={2} />

      <form
        method="get"
        action="/select"
        aria-label="Filter the model shortlist"
        className="card-surface p-4"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">Use case</span>
            <select
              name="useCase"
              defaultValue={useCaseFilter ?? ""}
              aria-label="Filter by use case"
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">Any use case</option>
              {modelUseCases.map((u) => (
                <option key={u.slug} value={u.slug}>
                  {u.title}
                </option>
              ))}
            </select>
          </label>
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
            <span className="block font-medium text-foreground">Lifecycle</span>
            <select
              name="lifecycle"
              defaultValue={lifecycleFilter ?? ""}
              aria-label="Filter by lifecycle"
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">Any lifecycle</option>
              {LIFECYCLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">
              Min context
            </span>
            <select
              name="minContext"
              defaultValue={minContextRaw ?? ""}
              aria-label="Filter by minimum context window"
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">Any size</option>
              {MIN_CONTEXT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">Modality</span>
            <select
              name="modality"
              defaultValue={modalityFilter ?? ""}
              aria-label="Filter by modality channel"
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">Any modality</option>
              {MODALITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">
              Pricing coverage
            </span>
            <select
              name="pricingCoverage"
              defaultValue={pricingCoverageFilter ?? ""}
              aria-label="Filter by pricing coverage"
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">Any</option>
              <option value="verified">Has verified pricing reference</option>
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">
              Hosted availability
            </span>
            <select
              name="hostedAvailability"
              defaultValue={hostedAvailabilityFilter ?? ""}
              aria-label="Filter by hosted availability"
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">Any</option>
              <option value="true">Has hosted availability</option>
              <option value="false">No hosted availability</option>
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
              <option value="partial">Partial</option>
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">Freshness</span>
            <select
              name="freshness"
              defaultValue={freshnessFilter ?? ""}
              aria-label="Filter by model freshness"
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">Any state</option>
              {FRESHNESS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
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
            <Link href="/select" className="text-primary hover:underline">
              Reset
            </Link>
          ) : null}
          <span>
            {shortlist.length} of {total} model
            {total === 1 ? "" : "s"} match.
          </span>
          <span>
            verified context: {summary.withVerifiedContext} · verified
            pricing: {summary.withVerifiedPricing} · hosted available:{" "}
            {summary.withHostedAvailability} · active:{" "}
            {summary.activeOnly}
          </span>
        </div>
      </form>

      <section aria-label="Shortlist" className="space-y-3">
        <SectionHeader
          eyebrow="Shortlist"
          title={`Shortlist (${shortlist.length})`}
          description="Shortlist order: verified field count → active lifecycle → source count → name. This is not a ranking; it is a deterministic order that surfaces well-sourced records first."
          cta={
            shortlist.length >= 2
              ? {
                  label: "Compare top shortlist in builder →",
                  href: comparisonBuilderUrl({
                    modelSlugs: shortlist
                      .slice(0, 4)
                      .map((e) => e.model.slug),
                    useCase: useCaseFilter ?? undefined,
                  }),
                }
              : undefined
          }
          as="h2"
        />
        {shortlist.length >= 2 ? (
          <p className="text-xs text-muted-foreground">
            <Link
              href={decisionBriefUrl({
                modelSlugs: shortlist
                  .slice(0, 4)
                  .map((e) => e.model.slug),
                useCase: useCaseFilter ?? undefined,
              })}
              className="text-primary hover:underline"
            >
              Create evidence brief for top shortlist →
            </Link>{" "}
            Briefs preserve evidence and data gaps; they do not
            choose for you.
          </p>
        ) : null}
        {shortlist.length ? (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left">
                    Model
                  </th>
                  <th scope="col" className="px-4 py-2 text-left">
                    Provider / creator
                  </th>
                  <th scope="col" className="px-4 py-2 text-left">
                    Lifecycle
                  </th>
                  <th scope="col" className="px-4 py-2 text-right">
                    Context
                  </th>
                  <th scope="col" className="px-4 py-2 text-right">
                    Output
                  </th>
                  <th scope="col" className="px-4 py-2 text-left">
                    Modalities
                  </th>
                  <th scope="col" className="px-4 py-2 text-left">
                    Pricing
                  </th>
                  <th scope="col" className="px-4 py-2 text-left">
                    Hosted
                  </th>
                  <th scope="col" className="px-4 py-2 text-right">
                    Sources
                  </th>
                  <th scope="col" className="px-4 py-2 text-right">
                    Gaps
                  </th>
                  <th scope="col" className="px-4 py-2 text-left">
                    Freshness
                  </th>
                  <th scope="col" className="px-4 py-2 text-left">
                    Suggested next action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card">
                {shortlist.map(({ model, signals, suggestedAction }) => (
                  <tr
                    key={model.slug}
                    className="border-t border-border align-top"
                  >
                    <th
                      scope="row"
                      className="px-4 py-2 text-left font-medium text-foreground"
                    >
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/models/${model.slug}`}
                          className="hover:underline"
                        >
                          {model.name}
                        </Link>
                        <VerificationBadge
                          status={model.verificationStatus}
                        />
                      </div>
                    </th>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      <Link
                        href={`/providers/${model.providerSlug}`}
                        className="hover:underline"
                      >
                        {model.providerSlug}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {isVerified(model.lifecycle)
                        ? model.lifecycle.value.status
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-xs">
                      {isVerified(model.contextWindow)
                        ? model.contextWindow.value.toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-xs">
                      {isVerified(model.maxOutputTokens)
                        ? model.maxOutputTokens.value.toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {isVerified(model.modality)
                        ? model.modality.value.join(", ")
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {signals.verifiedFirstPartyPricing ? "Verified" : "—"}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {signals.hostedAvailability ? "Available" : "—"}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-xs">
                      {signals.sourceCount}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-xs">
                      {signals.dataGapCount}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${freshnessClasses(signals.freshnessState)}`}
                      >
                        {freshnessLabel(signals.freshnessState)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      <p>{suggestedAction}</p>
                      <p className="mt-1">
                        <Link
                          href={comparisonBuilderUrl({
                            modelSlugs: [model.slug],
                            useCase: useCaseFilter ?? undefined,
                          })}
                          className="text-primary hover:underline"
                        >
                          Compare in builder →
                        </Link>
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="card-surface p-4 text-sm text-muted-foreground">
            No models match this filter. Reset and start from a use case.
          </p>
        )}
      </section>

      <section
        aria-label="Decision checklist"
        className="card-surface space-y-3 p-5 text-sm text-muted-foreground"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Decision checklist
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>Is the model active (not deprecated or retired)?</li>
          <li>Is the context window verified against the vendor docs?</li>
          <li>Is the max-output limit verified, or null?</li>
          <li>Is first-party pricing verified, or only hosted available?</li>
          <li>
            If hosted: do you accept the billing platform&apos;s rate as a
            reference (not a live quote)?
          </li>
          <li>Is the provider&apos;s status surface observed?</li>
          <li>
            Are the source citations fresh, or do they appear on the
            reverification queue?
          </li>
          <li>Are the remaining data gaps acceptable for this workload?</li>
        </ul>
      </section>

      <aside
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="Related workflows"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Related workflows
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <Link href="/use-cases" className="text-primary hover:underline">
              /use-cases
            </Link>{" "}
            — narrow which fields matter before opening the shortlist.
          </li>
          <li>
            <Link href="/models" className="text-primary hover:underline">
              /models
            </Link>{" "}
            — full catalogue with verification badges.
          </li>
          <li>
            <Link href="/compare" className="text-primary hover:underline">
              /compare
            </Link>{" "}
            — side-by-side reference for two models on the shortlist.
          </li>
          <li>
            <Link href="/pricing" className="text-primary hover:underline">
              /pricing
            </Link>{" "}
            — first-party + hosted pricing references with freshness chips.
          </li>
          <li>
            <Link href="/coverage" className="text-primary hover:underline">
              /coverage
            </Link>{" "}
            — what is verified vs partial vs blocked across the graph.
          </li>
          <li>
            <Link href="/sources" className="text-primary hover:underline">
              /sources
            </Link>{" "}
            — every primary-source citation with retrievedAt.
          </li>
          <li>
            <Link
              href="/reverification"
              className="text-primary hover:underline"
            >
              /reverification
            </Link>{" "}
            — sources due for manual review before reuse.
          </li>
          <li>
            <Link
              href="/research/model-selection"
              className="text-primary hover:underline"
            >
              /research/model-selection
            </Link>{" "}
            — methodology behind the verified-field selection workflow.
          </li>
          <li>
            <Link
              href="/docs/comparison-methodology"
              className="text-primary hover:underline"
            >
              /docs/comparison-methodology
            </Link>{" "}
            — how comparison pages render verified fields side-by-side.
          </li>
        </ul>
      </aside>

      <p className="text-xs text-muted-foreground">
        Build date:{" "}
        <code className="rounded bg-muted px-1">
          {formatDateISO(siteConfig.buildDate)}
        </code>
        . Freshness states are computed deterministically against this date.
      </p>
    </PageShell>
  );
}
