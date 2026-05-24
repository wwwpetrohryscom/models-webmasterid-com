import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { DataNotVerified } from "@/components/DataNotVerified";
import { DecisionWorkflow } from "@/components/DecisionWorkflow";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { isFilteredRoute, robotsMetadata } from "@/lib/should-index";
import { siteConfig } from "@/lib/site-config";
import { decisionBriefUrl } from "@/lib/decision-briefs";
import {
  buildModelComparison,
  comparisonBuilderUrl,
  COMPARISON_BUILDER_DEFAULT_FIELDS,
  COMPARISON_BUILDER_FIELDS,
  COMPARISON_BUILDER_MAX_MODELS,
  getComparableModels,
  getComparisonBuilderDefaults,
  getComparisonBuilderSummary,
  type ComparisonBuilderField,
} from "@/lib/comparison-builder";
import { modelUseCases, type ModelUseCaseSlug } from "@/lib/use-cases";
import {
  freshnessClasses,
  freshnessLabel,
} from "@/lib/source-freshness";
import { formatDateISO, formatUsd } from "@/lib/utils";

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

function readListParam(
  searchParams: SearchParams,
  key: string
): string[] {
  const v = searchParams[key];
  if (typeof v === "string") {
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (Array.isArray(v)) {
    return v
      .flatMap((entry) =>
        typeof entry === "string"
          ? entry.split(",").map((s) => s.trim())
          : []
      )
      .filter(Boolean);
  }
  return [];
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const filtered = isFilteredRoute(params);
  return {
    ...buildMetadata({
      title: "Comparison Builder",
      description:
        "Build a source-backed side-by-side view from 2–4 AI models on verified fields. No rankings, no winner declarations, no fabricated metrics. Workspace-only — generated URLs are noindex.",
      path: "/compare/build",
    }),
    robots: robotsMetadata(!filtered),
  };
}

export default async function CompareBuilderPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const useCaseFilter = readParam(params, "useCase") as
    | ModelUseCaseSlug
    | undefined;
  const modelSlugs = readListParam(params, "models");
  const fieldsFromParam = readListParam(
    params,
    "fields"
  ) as ComparisonBuilderField[];
  const showGaps = readParam(params, "showGaps") === "true";
  const filtered = isFilteredRoute(params);

  // If no models requested but a useCase is, pre-seed from the
  // shortlist for that use case (top 4).
  let effectiveSlugs = modelSlugs;
  if (effectiveSlugs.length === 0 && useCaseFilter) {
    const defaults = getComparisonBuilderDefaults(useCaseFilter);
    effectiveSlugs = defaults.modelSlugs;
  }

  const fields =
    fieldsFromParam.length > 0
      ? fieldsFromParam
      : COMPARISON_BUILDER_DEFAULT_FIELDS;

  const result = buildModelComparison({
    modelSlugs: effectiveSlugs,
    useCase: useCaseFilter,
    fields,
    showGaps,
  });
  const summary = getComparisonBuilderSummary(result);

  const catalogue = getComparableModels();
  const hasColumns = result.columns.some((c) => c.model !== null);

  const suggestedStarts: { label: string; href: string }[] =
    modelUseCases
      .filter((u) => u.slug !== "comparison-research")
      .slice(0, 6)
      .map((u) => {
        const defaults = getComparisonBuilderDefaults(u.slug);
        return {
          label: `Compare ${u.title.toLowerCase()} candidates`,
          href: comparisonBuilderUrl({
            modelSlugs: defaults.modelSlugs,
            useCase: u.slug,
          }),
        };
      })
      .filter((s) => s.href !== "/compare/build");

  return (
    <PageShell
      eyebrow="Workspace · step 3 of 5"
      title="Comparison Builder"
      intro="Render 2–4 selected models side by side using verified fields straight from the typed local data layer. No derived metrics, no deltas, no winner. Unknown values render the canonical unverified-data label rather than inventing numbers. Generated query URLs are noindex; only the unfiltered base page is indexable. New here? Start at /how-it-works."
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Compare", href: "/compare" },
          { name: "Builder", href: "/compare/build" },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Compare", href: "/compare" },
            { name: "Builder", href: "/compare/build" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Comparison Builder",
            url: `${siteConfig.url}/compare/build`,
            description:
              "Server-rendered side-by-side comparison builder for verified AI model fields.",
            dateModified: siteConfig.buildDate,
            isPartOf: { "@type": "WebSite", url: siteConfig.url },
          },
        ]}
      />

      <DecisionWorkflow variant="card" highlightStep={3} />

      <form
        method="get"
        action="/compare/build"
        aria-label="Pick up to four models to compare"
        className="card-surface p-4"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => {
            const current = effectiveSlugs[i] ?? "";
            const label = `Model ${i + 1}${i >= 2 ? " (optional)" : ""}`;
            return (
              <label
                key={i}
                className="text-xs text-muted-foreground"
              >
                <span className="block font-medium text-foreground">
                  {label}
                </span>
                <select
                  name="models"
                  defaultValue={current}
                  aria-label={label}
                  className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                >
                  <option value="">— none —</option>
                  {catalogue.map((m) => (
                    <option key={m.slug} value={m.slug}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
          <label className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">
              Use case (optional)
            </span>
            <select
              name="useCase"
              defaultValue={useCaseFilter ?? ""}
              aria-label="Filter by use case"
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">— none —</option>
              {modelUseCases.map((u) => (
                <option key={u.slug} value={u.slug}>
                  {u.title}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="text-xs text-muted-foreground sm:col-span-2 lg:col-span-3">
            <legend className="block font-medium text-foreground">
              Fields to render
            </legend>
            <div className="mt-1 flex flex-wrap gap-2">
              {COMPARISON_BUILDER_FIELDS.map((f) => (
                <label
                  key={f.value}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[11px]"
                  title={f.description}
                >
                  <input
                    type="checkbox"
                    name="fields"
                    value={f.value}
                    defaultChecked={fields.includes(f.value)}
                    className="h-3 w-3 accent-primary"
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="inline-flex items-center gap-2 text-xs text-muted-foreground sm:col-span-2 lg:col-span-1">
            <input
              type="checkbox"
              name="showGaps"
              value="true"
              defaultChecked={showGaps}
              className="h-4 w-4 accent-primary"
            />
            <span>Show data gaps matrix</span>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <button
            type="submit"
            className="inline-flex h-8 items-center rounded-lg border border-primary/30 bg-primary/10 px-3 font-medium text-primary hover:bg-primary/15"
          >
            Build comparison
          </button>
          {filtered ? (
            <Link
              href="/compare/build"
              className="text-primary hover:underline"
            >
              Reset
            </Link>
          ) : null}
          <span>
            {result.columns.length} model
            {result.columns.length === 1 ? "" : "s"} selected (max{" "}
            {COMPARISON_BUILDER_MAX_MODELS}).
          </span>
        </div>
      </form>

      {suggestedStarts.length ? (
        <aside
          className="card-surface p-4 text-sm text-muted-foreground"
          aria-label="Suggested starts"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Suggested starts
          </p>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {suggestedStarts.map((s) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className="text-xs text-primary hover:underline"
                >
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px]">
            Each suggested start uses the source-backed shortlist for
            the linked use case (top {COMPARISON_BUILDER_MAX_MODELS} by
            verified field count). Models are listed as candidates,
            not as picks.
          </p>
        </aside>
      ) : null}

      {!hasColumns ? (
        <aside
          role="note"
          aria-label="Empty state"
          className="card-surface p-4 text-sm text-muted-foreground"
        >
          <p>
            No models selected yet. Start from{" "}
            <Link href="/select" className="text-primary hover:underline">
              /select
            </Link>
            ,{" "}
            <Link href="/use-cases" className="text-primary hover:underline">
              /use-cases
            </Link>
            , or pick up to {COMPARISON_BUILDER_MAX_MODELS} models in
            the form above.
          </p>
        </aside>
      ) : null}

      {result.unresolvedSlugs.length ? (
        <aside
          role="alert"
          aria-label="Unresolved model slugs"
          className="card-surface border-amber-600/30 bg-amber-600/5 p-4 text-sm text-foreground"
        >
          <p>
            Unresolved model slug
            {result.unresolvedSlugs.length === 1 ? "" : "s"}:{" "}
            {result.unresolvedSlugs.map((s) => (
              <code
                key={s}
                className="ml-1 rounded bg-muted px-1 text-xs"
              >
                {s}
              </code>
            ))}
            . These slugs are not present in the catalogue and were
            skipped.
          </p>
        </aside>
      ) : null}

      {result.truncatedSlugs.length ? (
        <aside
          role="alert"
          aria-label="Truncated model slugs"
          className="card-surface border-amber-600/30 bg-amber-600/5 p-4 text-sm text-foreground"
        >
          <p>
            Builder caps comparisons at{" "}
            {COMPARISON_BUILDER_MAX_MODELS} models. Dropped:{" "}
            {result.truncatedSlugs.map((s) => (
              <code
                key={s}
                className="ml-1 rounded bg-muted px-1 text-xs"
              >
                {s}
              </code>
            ))}
            .
          </p>
        </aside>
      ) : null}

      {hasColumns ? (
        <section aria-label="Comparison" className="space-y-3">
          <SectionHeader
            eyebrow="Side by side"
            title={`Comparison (${summary.columns} model${summary.columns === 1 ? "" : "s"})`}
            description={
              summary.useCaseTitle
                ? `Use case: ${summary.useCaseTitle}. Fields are rendered straight from the model record — unknown values show the canonical unverified-data label.`
                : "Fields are rendered straight from the model record — unknown values show the canonical unverified-data label."
            }
            as="h2"
          />
          <ul className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
            <li className="card-surface p-3">
              <p className="text-[10px] uppercase tracking-wider">
                Verified context
              </p>
              <p className="mt-0.5 text-base font-semibold text-foreground tabular-nums">
                {summary.withVerifiedContext} / {summary.columns}
              </p>
            </li>
            <li className="card-surface p-3">
              <p className="text-[10px] uppercase tracking-wider">
                Verified pricing
              </p>
              <p className="mt-0.5 text-base font-semibold text-foreground tabular-nums">
                {summary.withVerifiedPricing} / {summary.columns}
              </p>
            </li>
            <li className="card-surface p-3">
              <p className="text-[10px] uppercase tracking-wider">
                Hosted availability
              </p>
              <p className="mt-0.5 text-base font-semibold text-foreground tabular-nums">
                {summary.withHostedAvailability} / {summary.columns}
              </p>
            </li>
            <li className="card-surface p-3">
              <p className="text-[10px] uppercase tracking-wider">
                Total data gaps
              </p>
              <p className="mt-0.5 text-base font-semibold text-foreground tabular-nums">
                {summary.totalGaps}
              </p>
            </li>
          </ul>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-2 text-left"
                  >
                    Field
                  </th>
                  {result.columns.map((c) => (
                    <th
                      key={c.slug}
                      scope="col"
                      className="px-4 py-2 text-left"
                    >
                      {c.model ? (
                        <Link
                          href={`/models/${c.slug}`}
                          className="text-foreground hover:underline"
                        >
                          {c.model.name}
                        </Link>
                      ) : (
                        c.slug
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-card text-xs text-foreground">
                {fields.includes("identity") ? (
                  <tr className="border-t border-border align-top">
                    <th scope="row" className="px-4 py-2 text-left font-medium">
                      Provider / canonical ID
                    </th>
                    {result.columns.map((c) => (
                      <td key={c.slug} className="px-4 py-2">
                        {c.providerName ? (
                          <p>
                            <Link
                              href={`/providers/${c.model?.providerSlug ?? "#"}`}
                              className="text-primary hover:underline"
                            >
                              {c.providerName}
                            </Link>
                          </p>
                        ) : (
                          <DataNotVerified />
                        )}
                        {c.canonicalId ? (
                          <code className="mt-1 block rounded bg-muted px-1 text-[10px]">
                            {c.canonicalId}
                          </code>
                        ) : null}
                      </td>
                    ))}
                  </tr>
                ) : null}
                {fields.includes("lifecycle") ? (
                  <tr className="border-t border-border align-top">
                    <th scope="row" className="px-4 py-2 text-left font-medium">
                      Lifecycle
                    </th>
                    {result.columns.map((c) => (
                      <td key={c.slug} className="px-4 py-2">
                        {c.lifecycleStatus ?? <DataNotVerified />}
                      </td>
                    ))}
                  </tr>
                ) : null}
                {fields.includes("context") ? (
                  <tr className="border-t border-border align-top">
                    <th scope="row" className="px-4 py-2 text-left font-medium">
                      Context window
                    </th>
                    {result.columns.map((c) => (
                      <td
                        key={c.slug}
                        className="px-4 py-2 tabular-nums"
                      >
                        {c.contextWindow !== undefined ? (
                          c.contextWindow.toLocaleString()
                        ) : (
                          <DataNotVerified />
                        )}
                      </td>
                    ))}
                  </tr>
                ) : null}
                {fields.includes("output") ? (
                  <tr className="border-t border-border align-top">
                    <th scope="row" className="px-4 py-2 text-left font-medium">
                      Max output tokens
                    </th>
                    {result.columns.map((c) => (
                      <td
                        key={c.slug}
                        className="px-4 py-2 tabular-nums"
                      >
                        {c.maxOutput !== undefined ? (
                          c.maxOutput.toLocaleString()
                        ) : (
                          <DataNotVerified />
                        )}
                      </td>
                    ))}
                  </tr>
                ) : null}
                {fields.includes("modality") ? (
                  <tr className="border-t border-border align-top">
                    <th scope="row" className="px-4 py-2 text-left font-medium">
                      Modality channels
                    </th>
                    {result.columns.map((c) => (
                      <td key={c.slug} className="px-4 py-2">
                        {c.modalityChannels && c.modalityChannels.length ? (
                          c.modalityChannels.join(", ")
                        ) : (
                          <DataNotVerified />
                        )}
                      </td>
                    ))}
                  </tr>
                ) : null}
                {fields.includes("pricing") ? (
                  <tr className="border-t border-border align-top">
                    <th scope="row" className="px-4 py-2 text-left font-medium">
                      First-party pricing reference
                    </th>
                    {result.columns.map((c) => {
                      const inputTier = c.model?.pricing.find(
                        (t) =>
                          t.unit === "1M input tokens" &&
                          t.amount &&
                          t.amount.value !== undefined
                      );
                      const outputTier = c.model?.pricing.find(
                        (t) =>
                          t.unit === "1M output tokens" &&
                          t.amount &&
                          t.amount.value !== undefined
                      );
                      return (
                        <td key={c.slug} className="px-4 py-2 text-xs">
                          {c.firstPartyPricingVerified ? (
                            <>
                              {inputTier && inputTier.amount ? (
                                <p className="tabular-nums">
                                  In:{" "}
                                  {formatUsd(inputTier.amount.value)}/M
                                </p>
                              ) : null}
                              {outputTier && outputTier.amount ? (
                                <p className="tabular-nums">
                                  Out:{" "}
                                  {formatUsd(outputTier.amount.value)}/M
                                </p>
                              ) : null}
                              {c.firstPartyPricingSourceUrl ? (
                                <Link
                                  href={c.firstPartyPricingSourceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-1 inline-block text-[10px] text-primary hover:underline"
                                >
                                  Source
                                </Link>
                              ) : null}
                            </>
                          ) : (
                            <DataNotVerified />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ) : null}
                {fields.includes("hosted") ? (
                  <tr className="border-t border-border align-top">
                    <th scope="row" className="px-4 py-2 text-left font-medium">
                      Hosted availability
                    </th>
                    {result.columns.map((c) => (
                      <td key={c.slug} className="px-4 py-2 text-xs">
                        {c.hosted.length ? (
                          <ul className="space-y-1">
                            {c.hosted.map((h) => (
                              <li key={h.billingProviderSlug}>
                                <Link
                                  href={`/providers/${h.billingProviderSlug}`}
                                  className="text-primary hover:underline"
                                >
                                  {h.billingProviderSlug}
                                </Link>
                                {h.hostedModelId ? (
                                  <code className="ml-1 rounded bg-muted px-1 text-[10px]">
                                    {h.hostedModelId}
                                  </code>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <DataNotVerified />
                        )}
                      </td>
                    ))}
                  </tr>
                ) : null}
                {fields.includes("sources") ? (
                  <tr className="border-t border-border align-top">
                    <th scope="row" className="px-4 py-2 text-left font-medium">
                      Source count
                    </th>
                    {result.columns.map((c) => (
                      <td
                        key={c.slug}
                        className="px-4 py-2 tabular-nums"
                      >
                        {c.sourceCount}
                      </td>
                    ))}
                  </tr>
                ) : null}
                {fields.includes("freshness") ? (
                  <tr className="border-t border-border align-top">
                    <th scope="row" className="px-4 py-2 text-left font-medium">
                      Freshness
                    </th>
                    {result.columns.map((c) => (
                      <td key={c.slug} className="px-4 py-2 text-xs">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${freshnessClasses(c.freshness)}`}
                        >
                          {freshnessLabel(c.freshness)}
                        </span>
                      </td>
                    ))}
                  </tr>
                ) : null}
                {fields.includes("coverage") ? (
                  <tr className="border-t border-border align-top">
                    <th scope="row" className="px-4 py-2 text-left font-medium">
                      Coverage gaps
                    </th>
                    {result.columns.map((c) => (
                      <td key={c.slug} className="px-4 py-2 text-xs">
                        {c.dataGaps.length ? (
                          <ul className="list-disc pl-4">
                            {c.dataGaps.map((g) => (
                              <li key={g}>{g}</li>
                            ))}
                          </ul>
                        ) : (
                          "—"
                        )}
                      </td>
                    ))}
                  </tr>
                ) : null}
                {fields.includes("status") ? (
                  <tr className="border-t border-border align-top">
                    <th scope="row" className="px-4 py-2 text-left font-medium">
                      Status surface
                    </th>
                    {result.columns.map((c) => (
                      <td key={c.slug} className="px-4 py-2 text-xs">
                        {c.observerWired
                          ? "Provider status page recorded"
                          : "No status surface recorded"}
                      </td>
                    ))}
                  </tr>
                ) : null}
                <tr className="border-t border-border align-top">
                  <th scope="row" className="px-4 py-2 text-left font-medium">
                    Related curated comparison
                  </th>
                  {result.columns.map((c) => (
                    <td key={c.slug} className="px-4 py-2 text-xs">
                      {c.relatedComparisonSlugs.length ? (
                        <ul className="space-y-1">
                          {c.relatedComparisonSlugs.map((s) => (
                            <li key={s}>
                              <Link
                                href={`/compare/${s}`}
                                className="text-primary hover:underline"
                              >
                                /compare/{s}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        "—"
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {hasColumns && (showGaps || true) ? (
        <section aria-label="Data gaps matrix" className="space-y-3">
          <SectionHeader
            eyebrow="Honest gaps"
            title="Data gaps matrix"
            description="Per-model list of canonical fields recorded as unverified. Stale ≠ false; gaps are the missing primary-source claims."
            as="h2"
          />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {result.columns.map((c) => (
              <li key={c.slug} className="card-surface p-3 text-xs">
                <p className="font-semibold text-foreground">
                  {c.model?.name ?? c.slug}
                </p>
                {c.dataGaps.length ? (
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted-foreground">
                    {c.dataGaps.map((g) => (
                      <li key={g}>{g}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-muted-foreground">
                    No canonical gaps recorded.
                  </p>
                )}
                {c.freshness !== "fresh" ? (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Source freshness:{" "}
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${freshnessClasses(c.freshness)}`}
                    >
                      {freshnessLabel(c.freshness)}
                    </span>
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {result.sources.length ? (
        <section aria-label="Source trail" className="space-y-3">
          <SectionHeader
            eyebrow="Sources"
            title={`Source trail (${result.sources.length})`}
            description="Every primary-source citation referenced by the columns above. Open each link to confirm the value on the vendor page."
            as="h2"
          />
          <ul className="grid gap-2 sm:grid-cols-2">
            {result.sources.map((s) => (
              <li
                key={s.url}
                className="card-surface p-3 text-xs text-muted-foreground"
              >
                <Link
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block break-all text-primary hover:underline"
                >
                  {s.name}
                </Link>
                <p className="mt-1">
                  Retrieved: {formatDateISO(s.retrievedAt)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <aside
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="Next actions"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Next actions
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {result.columns.map((c) =>
            c.model ? (
              <li key={`actions-${c.slug}`}>
                <Link
                  href={`/models/${c.slug}`}
                  className="text-primary hover:underline"
                >
                  Open {c.model.name} model page
                </Link>
              </li>
            ) : null
          )}
          <li>
            <Link href="/pricing" className="text-primary hover:underline">
              Open pricing references
            </Link>{" "}
            for the selected models.
          </li>
          <li>
            <Link href="/sources" className="text-primary hover:underline">
              Open source registry
            </Link>{" "}
            for every citation listed above.
          </li>
          <li>
            <Link href="/coverage" className="text-primary hover:underline">
              Open coverage map
            </Link>{" "}
            for verification breadth.
          </li>
          <li>
            <Link
              href="/reverification"
              className="text-primary hover:underline"
            >
              Open the reverification queue
            </Link>{" "}
            if any column reports a stale or review-due freshness state.
          </li>
          <li>
            <Link
              href="/docs/comparison-methodology"
              className="text-primary hover:underline"
            >
              Read the comparison methodology
            </Link>
            .
          </li>
          <li>
            <Link
              href="/docs/decision-workflow"
              className="text-primary hover:underline"
            >
              Read the decision workflow guide
            </Link>{" "}
            for why WebmasterID Models never picks a model for you.
          </li>
          {hasColumns ? (
            <li>
              <Link
                href={decisionBriefUrl({
                  modelSlugs: result.columns
                    .filter((c) => c.model !== null)
                    .map((c) => c.slug),
                  useCase: useCaseFilter ?? undefined,
                  fields: undefined,
                })}
                className="text-primary hover:underline"
              >
                Create decision brief from this comparison →
              </Link>{" "}
              Exports the same selection as a shareable evidence pack
              (Markdown or JSON).
            </li>
          ) : null}
        </ul>
        <p className="mt-3 text-[11px]">
          The builder is a workspace, not a recommendation engine.
          Decide what to test externally — the catalogue does not
          declare a winner.
        </p>
      </aside>
    </PageShell>
  );
}
