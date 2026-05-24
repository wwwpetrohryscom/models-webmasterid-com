import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { DecisionWorkflow } from "@/components/DecisionWorkflow";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { isFilteredRoute, robotsMetadata } from "@/lib/should-index";
import { siteConfig } from "@/lib/site-config";
import {
  buildDecisionBrief,
  decisionBriefUrl,
  DECISION_BRIEF_DEFAULT_FIELDS,
  DECISION_BRIEF_FIELDS,
  DECISION_BRIEF_MAX_MODELS,
  getBriefableModels,
  getDecisionBriefDefaults,
  type DecisionBriefField,
} from "@/lib/decision-briefs";
import { modelUseCases, type ModelUseCaseSlug } from "@/lib/use-cases";
import { formatDateISO } from "@/lib/utils";

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
      title: "Decision Brief Builder",
      description:
        "Generate a shareable evidence brief from verified AI model fields, source trails, data gaps, and freshness notes. No rankings, no winner claims, no recommendations — evidence only. Markdown and JSON export.",
      path: "/briefs/build",
    }),
    robots: robotsMetadata(!filtered),
  };
}

export default async function BriefsBuildPage({
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
  ) as DecisionBriefField[];

  let effectiveSlugs = modelSlugs;
  if (effectiveSlugs.length === 0 && useCaseFilter) {
    effectiveSlugs = getDecisionBriefDefaults(useCaseFilter).modelSlugs;
  }
  const fields =
    fieldsFromParam.length > 0
      ? fieldsFromParam
      : DECISION_BRIEF_DEFAULT_FIELDS;

  const brief = buildDecisionBrief({
    modelSlugs: effectiveSlugs,
    useCase: useCaseFilter,
    fields,
  });

  const catalogue = getBriefableModels();
  const hasModels = brief.selectedModels.length > 0;

  const exportMarkdownUrl =
    (effectiveSlugs.length || useCaseFilter
      ? `/api/briefs/decision?${new URLSearchParams({
          models: effectiveSlugs.join(","),
          ...(useCaseFilter ? { useCase: useCaseFilter } : {}),
          ...(fieldsFromParam.length
            ? { fields: fieldsFromParam.join(",") }
            : {}),
          format: "markdown",
        }).toString()}`
      : "/api/briefs/decision");
  const exportJsonUrl =
    (effectiveSlugs.length || useCaseFilter
      ? `/api/briefs/decision?${new URLSearchParams({
          models: effectiveSlugs.join(","),
          ...(useCaseFilter ? { useCase: useCaseFilter } : {}),
          ...(fieldsFromParam.length
            ? { fields: fieldsFromParam.join(",") }
            : {}),
          format: "json",
        }).toString()}`
      : "/api/briefs/decision?format=json");

  return (
    <PageShell
      eyebrow="Workspace"
      title="Decision Brief Builder"
      intro="Generate a shareable evidence brief from verified model fields, source trails, data gaps, and freshness notes. Briefs are evidence, not recommendations. Generated query URLs are noindex; only the base /briefs/build page is indexable."
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Briefs", href: "/briefs/build" },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Briefs", href: "/briefs/build" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Decision Brief Builder",
            url: `${siteConfig.url}/briefs/build`,
            description:
              "Source-backed evidence pack generator for AI model selection.",
            dateModified: siteConfig.buildDate,
            isPartOf: { "@type": "WebSite", url: siteConfig.url },
          },
        ]}
      />

      <aside
        role="note"
        aria-label="Brief policy"
        className="card-surface space-y-2 p-4 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          Decision briefs are evidence packs, not recommendations.
        </p>
        <p>
          A brief collects verified fields, data gaps, source trails,
          freshness notes, and hosted availability for 2–4 selected
          models. WebmasterID Models does not declare a winner, does
          not rank by price, and does not generate conclusions that
          imply endorsement. Unknown values stay explicitly unverified.
        </p>
      </aside>

      <DecisionWorkflow variant="card" highlightStep={6} />

      <form
        method="get"
        action="/briefs/build"
        aria-label="Build a decision brief"
        className="card-surface p-4"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3].map((i) => {
            const current = effectiveSlugs[i] ?? "";
            const label = `Model ${i + 1}${i >= 2 ? " (optional)" : ""}`;
            return (
              <label key={i} className="text-xs text-muted-foreground">
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
              aria-label="Use case"
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
          <fieldset className="text-xs text-muted-foreground sm:col-span-2">
            <legend className="block font-medium text-foreground">
              Fields to include
            </legend>
            <div className="mt-1 flex flex-wrap gap-2">
              {DECISION_BRIEF_FIELDS.map((f) => (
                <label
                  key={f.value}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[11px]"
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
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <button
            type="submit"
            className="inline-flex h-8 items-center rounded-lg border border-primary/30 bg-primary/10 px-3 font-medium text-primary hover:bg-primary/15"
          >
            Build brief
          </button>
          <Link
            href="/briefs/build"
            className="text-primary hover:underline"
          >
            Reset
          </Link>
          <span>
            Cap: {DECISION_BRIEF_MAX_MODELS} models per brief.
          </span>
        </div>
      </form>

      {!hasModels ? (
        <aside
          role="note"
          className="card-surface p-4 text-sm text-muted-foreground"
        >
          <p>
            No models selected. Start from{" "}
            <Link href="/select" className="text-primary hover:underline">
              /select
            </Link>
            ,{" "}
            <Link href="/use-cases" className="text-primary hover:underline">
              /use-cases
            </Link>
            , or pick models in the form above (max{" "}
            {DECISION_BRIEF_MAX_MODELS}).
          </p>
        </aside>
      ) : null}

      {hasModels ? (
        <>
          <section
            aria-label="Evidence summary"
            className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-5"
          >
            {[
              {
                label: "Selected models",
                value: brief.selectedModels.length,
              },
              {
                label: "Verified evidence rows",
                value: brief.verifiedEvidence.length,
              },
              { label: "Data gaps", value: brief.dataGaps.length },
              {
                label: "Source citations",
                value: brief.sourceTrail.length,
              },
              {
                label: "Hosted availability",
                value: brief.hostedAvailability.length,
              },
            ].map((card) => (
              <article key={card.label} className="card-surface p-3">
                <p className="text-[10px] uppercase tracking-wider">
                  {card.label}
                </p>
                <p className="mt-0.5 text-base font-semibold text-foreground tabular-nums">
                  {card.value}
                </p>
              </article>
            ))}
          </section>

          <section aria-label="Selected models" className="space-y-3">
            <SectionHeader
              eyebrow="Models"
              title={`Selected models (${brief.selectedModels.length})`}
              description="In query order. Lifecycle reflects the verified value or 'unverified' when null."
              as="h2"
            />
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {brief.selectedModels.map((m) => (
                <li key={m.slug} className="card-surface p-3 text-sm">
                  <p className="font-semibold text-foreground">
                    <Link
                      href={`/models/${m.slug}`}
                      className="hover:underline"
                    >
                      {m.name}
                    </Link>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {m.providerName} · lifecycle: {m.lifecycle}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground break-all">
                    {m.pageUrl}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="Verified evidence" className="space-y-3">
            <SectionHeader
              eyebrow="Evidence"
              title={`Verified evidence (${brief.verifiedEvidence.length})`}
              description="Per-model verified field values. Source IDs map to the source trail below."
              as="h2"
            />
            {brief.verifiedEvidence.length ? (
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-4 py-2 text-left">
                        Model
                      </th>
                      <th scope="col" className="px-4 py-2 text-left">
                        Field
                      </th>
                      <th scope="col" className="px-4 py-2 text-left">
                        Value
                      </th>
                      <th scope="col" className="px-4 py-2 text-left">
                        Sources
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card text-xs">
                    {brief.verifiedEvidence.map((e, idx) => (
                      <tr
                        key={`${e.modelSlug}-${e.field}-${idx}`}
                        className="border-t border-border align-top"
                      >
                        <th
                          scope="row"
                          className="px-4 py-2 text-left font-medium text-foreground"
                        >
                          {e.modelSlug}
                        </th>
                        <td className="px-4 py-2 text-muted-foreground">
                          {e.field}
                        </td>
                        <td className="px-4 py-2 text-foreground">
                          {e.value}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {e.sourceIds.length
                            ? e.sourceIds.map((id) => (
                                <code
                                  key={id}
                                  className="mr-1 rounded bg-muted px-1 text-[10px]"
                                >
                                  {id}
                                </code>
                              ))
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="card-surface p-4 text-sm text-muted-foreground">
                No verified evidence rows for the selected fields.
              </p>
            )}
          </section>

          <section aria-label="Data gaps" className="space-y-3">
            <SectionHeader
              eyebrow="Honest gaps"
              title={`Data gaps (${brief.dataGaps.length})`}
              description="Unverified canonical fields per model. Gaps are not invented; the catalogue refuses to guess."
              as="h2"
            />
            {brief.dataGaps.length ? (
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-4 py-2 text-left">
                        Model
                      </th>
                      <th scope="col" className="px-4 py-2 text-left">
                        Field
                      </th>
                      <th scope="col" className="px-4 py-2 text-left">
                        Reason
                      </th>
                      <th scope="col" className="px-4 py-2 text-left">
                        Affected route
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card text-xs">
                    {brief.dataGaps.map((g, idx) => (
                      <tr
                        key={`${g.modelSlug}-${g.field}-${idx}`}
                        className="border-t border-border align-top"
                      >
                        <th
                          scope="row"
                          className="px-4 py-2 text-left font-medium text-foreground"
                        >
                          {g.modelSlug}
                        </th>
                        <td className="px-4 py-2 text-muted-foreground">
                          {g.field}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {g.reason}
                        </td>
                        <td className="px-4 py-2 text-xs">
                          <Link
                            href={g.affectedRoute}
                            className="text-primary hover:underline"
                          >
                            {g.affectedRoute}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="card-surface p-4 text-sm text-muted-foreground">
                No data gaps for the selected models — all canonical
                fields are verified.
              </p>
            )}
          </section>

          <section aria-label="Source trail" className="space-y-3">
            <SectionHeader
              eyebrow="Sources"
              title={`Source trail (${brief.sourceTrail.length})`}
              description="Primary-source citations referenced by the evidence rows above."
              as="h2"
            />
            {brief.sourceTrail.length ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {brief.sourceTrail.map((s) => (
                  <li
                    key={s.sourceId}
                    className="card-surface space-y-1 p-3 text-xs"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-primary">
                      {s.sourceId}
                    </p>
                    <Link
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block break-all text-primary hover:underline"
                    >
                      {s.name}
                    </Link>
                    <p className="text-muted-foreground">
                      {s.sourceType} · retrieved{" "}
                      {formatDateISO(s.retrievedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {brief.freshnessNotes.length ? (
            <section aria-label="Freshness notes" className="space-y-3">
              <SectionHeader
                eyebrow="Freshness"
                title={`Freshness notes (${brief.freshnessNotes.length})`}
                description="Records and citations that have aged past the fresh window. Stale ≠ false."
                as="h2"
              />
              <ul className="space-y-2">
                {brief.freshnessNotes.map((n, idx) => (
                  <li
                    key={`${n.modelSlug ?? n.sourceId ?? "fn"}-${idx}`}
                    className="card-surface p-3 text-xs text-muted-foreground"
                  >
                    {n.note}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {brief.hostedAvailability.length ? (
            <section aria-label="Hosted availability" className="space-y-3">
              <SectionHeader
                eyebrow="Hosted"
                title={`Hosted availability (${brief.hostedAvailability.length})`}
                description="Where third-party platforms host these models. Hosted pricing is set by the hosting platform — not the model creator."
                as="h2"
              />
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-4 py-2 text-left">
                        Model
                      </th>
                      <th scope="col" className="px-4 py-2 text-left">
                        Billing provider
                      </th>
                      <th scope="col" className="px-4 py-2 text-left">
                        Hosted model ID
                      </th>
                      <th scope="col" className="px-4 py-2 text-left">
                        Pricing reference
                      </th>
                      <th scope="col" className="px-4 py-2 text-left">
                        Last checked
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card text-xs">
                    {brief.hostedAvailability.map((h, idx) => (
                      <tr
                        key={`${h.modelSlug}-${h.billingProviderSlug}-${idx}`}
                        className="border-t border-border align-top"
                      >
                        <th
                          scope="row"
                          className="px-4 py-2 text-left font-medium text-foreground"
                        >
                          {h.modelSlug}
                        </th>
                        <td className="px-4 py-2 text-muted-foreground">
                          <Link
                            href={`/providers/${h.billingProviderSlug}`}
                            className="text-primary hover:underline"
                          >
                            {h.billingProviderSlug}
                          </Link>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {h.hostedModelId ? (
                            <code className="rounded bg-muted px-1 text-[10px]">
                              {h.hostedModelId}
                            </code>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {h.pricingReferenceAvailable
                            ? "available"
                            : "not verified"}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {h.lastCheckedAt
                            ? formatDateISO(h.lastCheckedAt)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      <section aria-label="Next external tests" className="space-y-3">
        <SectionHeader
          eyebrow="Outside the catalogue"
          title="Next external tests"
          description="The catalogue stops at verified fields. These are the checks a reader still needs to run before committing."
          as="h2"
        />
        <ul className="card-surface space-y-2 p-4 text-sm text-muted-foreground">
          {brief.nextExternalTests.map((t) => (
            <li key={t}>
              <label className="inline-flex items-baseline gap-2">
                <input type="checkbox" className="mt-1 accent-primary" />
                <span>{t}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Export" className="space-y-3">
        <SectionHeader
          eyebrow="Export"
          title="Export this brief"
          description="Same query parameters as this page. Endpoint returns Markdown by default; pass ?format=json for the structured payload."
          as="h2"
        />
        <ul className="grid gap-2 sm:grid-cols-2">
          <li className="card-surface p-3 text-sm">
            <p className="font-medium text-foreground">Markdown</p>
            <Link
              href={exportMarkdownUrl}
              className="mt-1 inline-block break-all text-xs text-primary hover:underline"
            >
              {exportMarkdownUrl}
            </Link>
          </li>
          <li className="card-surface p-3 text-sm">
            <p className="font-medium text-foreground">JSON</p>
            <Link
              href={exportJsonUrl}
              className="mt-1 inline-block break-all text-xs text-primary hover:underline"
            >
              {exportJsonUrl}
            </Link>
          </li>
        </ul>
      </section>

      <aside
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="Related references"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Related references
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <Link
              href="/docs/decision-briefs"
              className="text-primary hover:underline"
            >
              /docs/decision-briefs
            </Link>{" "}
            — what a brief is and what it deliberately does not assert.
          </li>
          <li>
            <Link
              href="/docs/decision-workflow"
              className="text-primary hover:underline"
            >
              /docs/decision-workflow
            </Link>
          </li>
          <li>
            <Link href="/select" className="text-primary hover:underline">
              /select
            </Link>
            {" · "}
            <Link
              href="/compare/build"
              className="text-primary hover:underline"
            >
              /compare/build
            </Link>
            {" · "}
            <Link href="/use-cases" className="text-primary hover:underline">
              /use-cases
            </Link>
          </li>
          <li>
            <Link href="/coverage" className="text-primary hover:underline">
              /coverage
            </Link>
            {" · "}
            <Link href="/sources" className="text-primary hover:underline">
              /sources
            </Link>
          </li>
        </ul>
      </aside>

      <p className="text-[11px] text-muted-foreground">
        Build date:{" "}
        <code className="rounded bg-muted px-1">
          {formatDateISO(siteConfig.buildDate)}
        </code>
        . Briefs use this date as the deterministic{" "}
        <code className="rounded bg-muted px-1">generatedAt</code> so
        the same build produces the same brief.
      </p>

      {/* expose helper for tooling that wants to derive the canonical
          brief URL from input — no live use today. */}
      <p hidden>{decisionBriefUrl({ modelSlugs: effectiveSlugs })}</p>
    </PageShell>
  );
}
