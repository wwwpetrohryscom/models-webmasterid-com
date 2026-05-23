import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { VerificationBadge } from "@/components/VerificationBadge";
import { VerifiedField } from "@/components/VerifiedField";
import { DataNotVerified } from "@/components/DataNotVerified";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { isFilteredRoute, robotsMetadata } from "@/lib/should-index";
import { models, getModelBySlug } from "@/data/models";
import { providers, getProviderBySlug } from "@/data/providers";
import { hostedPricing } from "@/data/hosted-pricing";
import { formatDateISO, formatUsd, unknownLabel } from "@/lib/utils";
import { isVerified } from "@/lib/verified";
import {
  getPricingFreshness,
  pricingFreshnessClasses,
  pricingFreshnessLabel,
  PRICING_VOLATILITY_NOTE,
  PRICING_NO_RANKING_NOTE,
} from "@/lib/pricing-freshness";
import type { ModelEntity, PricingUnit } from "@/lib/types";

type SearchParams = Record<string, string | string[] | undefined>;

interface PageProps {
  searchParams: Promise<SearchParams>;
}

const PRICING_STATUS_OPTIONS: { value: "verified" | "pending"; label: string }[] = [
  { value: "verified", label: "Verified" },
  { value: "pending", label: "Pending verification" },
];

/**
 * Curated unit dropdown — every option is a member of the PricingUnit
 * union in lib/types.ts. We expose the most common axes a reader
 * filters by (base in/out, cache, batch, prompt-size tiers, cache
 * storage). Special units like "image" / "minute" are uncommon enough
 * not to clutter the UI.
 */
const UNIT_OPTIONS: { value: PricingUnit; label: string }[] = [
  { value: "1M input tokens", label: "Input — base" },
  { value: "1M output tokens", label: "Output — base" },
  {
    value: "1M cache read tokens",
    label: "Cache read (Anthropic/DeepSeek)",
  },
  {
    value: "1M cache write tokens (5m)",
    label: "Cache write — 5m TTL",
  },
  {
    value: "1M cache write tokens (1h)",
    label: "Cache write — 1h TTL",
  },
  {
    value: "1M cache storage / hour",
    label: "Cache storage / hour (Google)",
  },
  { value: "1M batch input tokens", label: "Batch input" },
  { value: "1M batch output tokens", label: "Batch output" },
  {
    value: "1M input tokens (>200k context)",
    label: "Input — >200k context",
  },
  {
    value: "1M output tokens (>200k context)",
    label: "Output — >200k context",
  },
];

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
      title: "AI API Pricing",
      description:
        "API pricing across tracked AI models. Where rates have not been verified against official provider documentation, the platform marks them unverified rather than substituting estimates. Filter by provider, status, or unit.",
      path: "/pricing",
    }),
    robots: robotsMetadata(!filtered),
  };
}

interface RowMatch {
  model: ModelEntity;
  matchesUnitFilter: boolean;
}

export default async function PricingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = readParam(params, "q")?.toLowerCase();
  const providerFilter = readParam(params, "provider");
  const statusFilter = readParam(params, "status") as
    | "verified"
    | "pending"
    | undefined;
  const unitFilter = readParam(params, "unit") as PricingUnit | undefined;

  const filtered = isFilteredRoute(params);

  const candidates: RowMatch[] = models
    .filter((m) => {
      if (q) {
        const haystack = `${m.name} ${m.slug}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (providerFilter && m.providerSlug !== providerFilter) return false;
      return true;
    })
    .map((m) => ({
      model: m,
      matchesUnitFilter: unitFilter
        ? m.pricing.some((t) => t.unit === unitFilter)
        : true,
    }))
    .filter((row) => row.matchesUnitFilter);

  const verifiedRows = candidates.filter(({ model }) =>
    model.pricing.some((t) => isVerified(t.amount))
  );
  const pendingRows = candidates.filter(
    ({ model }) => !model.pricing.some((t) => isVerified(t.amount))
  );

  // Hosted-provider rows filter on the *billing* provider (Groq /
  // Together), not the model-creator provider. The same q / unit
  // filters apply: text search matches model name + slug; unit filter
  // requires a tier with the selected unit.
  const hostedRows = hostedPricing.filter((r) => {
    if (providerFilter && r.billingProviderSlug !== providerFilter) return false;
    const model = getModelBySlug(r.modelSlug);
    if (q) {
      const haystack = `${model?.name ?? ""} ${r.modelSlug} ${
        r.hostedModelId ?? ""
      }`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (unitFilter && !r.tiers.some((t) => t.unit === unitFilter)) return false;
    return true;
  });

  const showVerified = !statusFilter || statusFilter === "verified";
  const showPending = !statusFilter || statusFilter === "pending";
  const showHosted = showVerified;

  return (
    <PageShell
      eyebrow="Hub"
      title="AI API Pricing"
      intro="Per-unit API pricing for tracked models. Pricing values are only displayed when sourced from official provider documentation. Cache and batch pricing surface here when published by the vendor."
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Pricing", href: "/pricing" },
        ]}
      />

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Pricing", href: "/pricing" },
        ])}
      />

      <aside
        role="note"
        aria-label="Pricing volatility policy"
        className="card-surface space-y-2 p-4 text-sm text-muted-foreground"
      >
        <p className="text-foreground font-medium">
          Reference, not live quotes.
        </p>
        <p>{PRICING_VOLATILITY_NOTE}</p>
        <p>{PRICING_NO_RANKING_NOTE}</p>
        <p>
          Every row carries a <em>freshness</em> chip (Fresh, Review due,
          Stale) computed from the row&apos;s{" "}
          <code className="rounded bg-muted px-1">lastCheckedAt</code>{" "}
          and a <em>volatility</em> tag (High / Medium / Low) set by the
          row&apos;s pricing context. Both are decision aids, not
          guarantees.
        </p>
      </aside>

      <section
        aria-label="Cache-pricing semantics"
        className="card-surface p-4 text-sm text-muted-foreground"
      >
        <h2 className="text-base font-semibold text-foreground">
          Cache-pricing semantics differ across providers
        </h2>
        <p className="mt-2">
          We do not collapse provider-specific cache pricing into a single
          row. Anthropic publishes per-token TTL cache writes (5-minute and
          1-hour windows) and per-token cache reads. Google publishes a
          per-hour cache <em>storage</em> rate alongside a one-shot cache
          write fee. DeepSeek publishes an input cache-hit rate. The
          &quot;Cache hit / 1M&quot; column below shows the cache-read (or
          cache-hit-input) rate where the provider publishes one, and
          renders <DataNotVerified /> otherwise.
        </p>
      </section>

      <section
        aria-label="Model creator vs hosted provider"
        className="card-surface p-4 text-sm text-muted-foreground"
      >
        <h2 className="text-base font-semibold text-foreground">
          Hosted-provider pricing is not the same as model-creator pricing
        </h2>
        <p className="mt-2">
          A hosted platform (Groq, Together AI, Bedrock, Vertex, …) may
          expose a model created by another organisation under a
          platform-specific model ID, and bill for it at a rate set by
          the platform — not by the model&apos;s creator. /pricing
          surfaces these as two reference sections: <em>first-party API
          pricing references</em> (where the billing provider IS the
          model creator) and <em>hosted provider pricing references</em>{" "}
          (where they differ). Hosted rows are reference values, not a
          comparison engine — there is no &quot;cheaper&quot; column and
          no winner. See{" "}
          <Link
            href="/research/api-pricing-methodology"
            className="text-primary hover:underline"
          >
            /research/api-pricing-methodology
          </Link>{" "}
          for the methodology and{" "}
          <Link
            href="/docs/pricing-fields"
            className="text-primary hover:underline"
          >
            /docs/pricing-fields
          </Link>{" "}
          for the schema.
        </p>
      </section>

      <form
        method="get"
        action="/pricing"
        aria-label="Filter pricing rows"
        className="card-surface p-4"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">Search</span>
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Filter by model name…"
              aria-label="Search pricing rows"
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
              <option value="">All providers</option>
              {providers.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">Status</span>
            <select
              name="status"
              defaultValue={statusFilter ?? ""}
              aria-label="Filter by verification status"
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">All statuses</option>
              {PRICING_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">
              Pricing unit
            </span>
            <select
              name="unit"
              defaultValue={unitFilter ?? ""}
              aria-label="Filter by pricing unit"
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">Any unit</option>
              {UNIT_OPTIONS.map((o) => (
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
            <Link href="/pricing" className="text-primary hover:underline">
              Reset
            </Link>
          ) : null}
          <span>
            {verifiedRows.length} first-party row
            {verifiedRows.length === 1 ? "" : "s"}, {hostedRows.length} hosted
            row{hostedRows.length === 1 ? "" : "s"}, {pendingRows.length}{" "}
            pending.
          </span>
        </div>
      </form>

      {showVerified ? (
        <section
          aria-label="First-party API pricing references"
          className="space-y-3"
        >
          <h2 className="text-lg font-semibold text-foreground">
            First-party API pricing references ({verifiedRows.length})
          </h2>
          <p className="text-sm text-muted-foreground">
            Rows where the billing provider is the same organisation that
            created the model. Volatility on these rows defaults to{" "}
            <strong className="text-foreground">medium</strong> — first-party
            rates move less than hosted-platform rates but still change
            (promotional discount windows, regional adjustments, model
            retirements). Treat each row as a source-backed reference and
            re-verify against the linked source before projecting cost.
          </p>
          {verifiedRows.length ? (
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-2 text-left">
                      Model
                    </th>
                    <th scope="col" className="px-4 py-2 text-left">
                      Provider
                    </th>
                    <th scope="col" className="px-4 py-2 text-right">
                      Input / 1M
                    </th>
                    <th scope="col" className="px-4 py-2 text-right">
                      Output / 1M
                    </th>
                    <th scope="col" className="px-4 py-2 text-right">
                      Cache hit / 1M
                    </th>
                    <th scope="col" className="px-4 py-2 text-right">
                      Batch in / 1M
                    </th>
                    <th scope="col" className="px-4 py-2 text-left">
                      Pricing context
                    </th>
                    <th scope="col" className="px-4 py-2 text-left">
                      Volatility
                    </th>
                    <th scope="col" className="px-4 py-2 text-left">
                      Freshness
                    </th>
                    <th scope="col" className="px-4 py-2 text-left">
                      Source
                    </th>
                    <th scope="col" className="px-4 py-2 text-left">
                      Last checked
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card">
                  {verifiedRows.map(({ model: m }) => {
                    const p = getProviderBySlug(m.providerSlug);
                    const input = m.pricing.find(
                      (t) => t.unit === "1M input tokens"
                    );
                    const output = m.pricing.find(
                      (t) => t.unit === "1M output tokens"
                    );
                    const cacheRead = m.pricing.find(
                      (t) => t.unit === "1M cache read tokens"
                    );
                    const batchIn = m.pricing.find(
                      (t) => t.unit === "1M batch input tokens"
                    );
                    const sourceCitation =
                      [input?.amount, output?.amount]
                        .filter((f) => f && isVerified(f))
                        .map((f) => isVerified(f) && f.citation)[0] || null;
                    return (
                      <tr key={m.slug} className="border-t border-border">
                        <th
                          scope="row"
                          className="px-4 py-2 text-left font-medium text-foreground"
                        >
                          <Link
                            href={`/models/${m.slug}`}
                            className="hover:underline"
                          >
                            {m.name}
                          </Link>
                        </th>
                        <td className="px-4 py-2 text-muted-foreground">
                          {p ? (
                            <Link
                              href={`/providers/${p.slug}`}
                              className="hover:underline"
                            >
                              {p.name}
                            </Link>
                          ) : (
                            unknownLabel()
                          )}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          <VerifiedField
                            field={input?.amount}
                            format={formatUsd}
                            label="input rate"
                            inlineCitation={false}
                          />
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          <VerifiedField
                            field={output?.amount}
                            format={formatUsd}
                            label="output rate"
                            inlineCitation={false}
                          />
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          <VerifiedField
                            field={cacheRead?.amount}
                            format={formatUsd}
                            label="cache hit"
                            inlineCitation={false}
                          />
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          <VerifiedField
                            field={batchIn?.amount}
                            format={formatUsd}
                            label="batch input"
                            inlineCitation={false}
                          />
                        </td>
                        <td className="px-4 py-2 text-left text-xs text-muted-foreground">
                          First-party API
                        </td>
                        <td className="px-4 py-2 text-left text-xs">
                          <span className="inline-flex items-center rounded-full border border-amber-600/30 bg-amber-600/10 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                            Medium
                          </span>
                        </td>
                        <td className="px-4 py-2 text-left text-xs">
                          {(() => {
                            const state = getPricingFreshness(
                              m.lastCheckedAt
                            );
                            return (
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${pricingFreshnessClasses(state)}`}
                              >
                                {pricingFreshnessLabel(state)}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-2 text-left">
                          {sourceCitation ? (
                            <Link
                              href={sourceCitation.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary hover:underline"
                              title={sourceCitation.name}
                            >
                              {sourceCitation.name.split(" — ")[0]}
                            </Link>
                          ) : (
                            <DataNotVerified />
                          )}
                        </td>
                        <td className="px-4 py-2 text-left text-xs text-muted-foreground">
                          {formatDateISO(m.lastCheckedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="card-surface p-4 text-sm text-muted-foreground">
              No verified pricing rows match the current filters.
            </p>
          )}
        </section>
      ) : null}

      {showHosted ? (
        <section
          aria-label="Hosted provider pricing references"
          className="space-y-3"
        >
          <h2 className="text-lg font-semibold text-foreground">
            Hosted provider pricing references ({hostedRows.length})
          </h2>
          <p className="text-sm text-muted-foreground">
            Rows where a third-party platform hosts a model created by
            another organisation. The <em>Model creator</em> column is the
            organisation that built the model; the <em>Billing provider</em>{" "}
            is the platform that invoices for inference. The two are
            different — and the billing provider sets the rate. Hosted
            rates carry{" "}
            <strong className="text-foreground">high</strong> volatility
            by default; re-verify against the platform&apos;s own pricing
            page before any cost projection.
          </p>
          {hostedRows.length ? (
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-2 text-left">
                      Model
                    </th>
                    <th scope="col" className="px-4 py-2 text-left">
                      Model creator
                    </th>
                    <th scope="col" className="px-4 py-2 text-left">
                      Billing provider
                    </th>
                    <th scope="col" className="px-4 py-2 text-left">
                      Hosted model ID
                    </th>
                    <th scope="col" className="px-4 py-2 text-right">
                      Input / 1M
                    </th>
                    <th scope="col" className="px-4 py-2 text-right">
                      Output / 1M
                    </th>
                    <th scope="col" className="px-4 py-2 text-right">
                      Cache hit / 1M
                    </th>
                    <th scope="col" className="px-4 py-2 text-left">
                      Pricing context
                    </th>
                    <th scope="col" className="px-4 py-2 text-left">
                      Volatility
                    </th>
                    <th scope="col" className="px-4 py-2 text-left">
                      Freshness
                    </th>
                    <th scope="col" className="px-4 py-2 text-left">
                      Source
                    </th>
                    <th scope="col" className="px-4 py-2 text-left">
                      Last checked
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card">
                  {hostedRows.map((r) => {
                    const model = getModelBySlug(r.modelSlug);
                    const creator = getProviderBySlug(
                      r.modelCreatorProviderSlug
                    );
                    const billing = getProviderBySlug(r.billingProviderSlug);
                    const input = r.tiers.find(
                      (t) => t.unit === "1M input tokens"
                    );
                    const output = r.tiers.find(
                      (t) => t.unit === "1M output tokens"
                    );
                    const cacheRead = r.tiers.find(
                      (t) => t.unit === "1M cache read tokens"
                    );
                    return (
                      <tr key={r.id} className="border-t border-border">
                        <th
                          scope="row"
                          className="px-4 py-2 text-left font-medium text-foreground"
                        >
                          {model ? (
                            <Link
                              href={`/models/${model.slug}`}
                              className="hover:underline"
                            >
                              {model.name}
                            </Link>
                          ) : (
                            r.modelSlug
                          )}
                        </th>
                        <td className="px-4 py-2 text-muted-foreground">
                          {creator ? (
                            <Link
                              href={`/providers/${creator.slug}`}
                              className="hover:underline"
                            >
                              {creator.name}
                            </Link>
                          ) : (
                            unknownLabel()
                          )}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {billing ? (
                            <Link
                              href={`/providers/${billing.slug}`}
                              className="hover:underline"
                            >
                              {billing.name}
                            </Link>
                          ) : (
                            unknownLabel()
                          )}
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">
                          {r.hostedModelId ? (
                            <code className="rounded bg-muted px-1">
                              {r.hostedModelId}
                            </code>
                          ) : (
                            <DataNotVerified />
                          )}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          <VerifiedField
                            field={input?.amount}
                            format={formatUsd}
                            label="hosted input rate"
                            inlineCitation={false}
                          />
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          <VerifiedField
                            field={output?.amount}
                            format={formatUsd}
                            label="hosted output rate"
                            inlineCitation={false}
                          />
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          <VerifiedField
                            field={cacheRead?.amount}
                            format={formatUsd}
                            label="hosted cache hit"
                            inlineCitation={false}
                          />
                        </td>
                        <td className="px-4 py-2 text-left text-xs text-muted-foreground">
                          Hosted provider
                        </td>
                        <td className="px-4 py-2 text-left text-xs">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              r.volatility === "high"
                                ? "border border-red-600/30 bg-red-600/10 text-red-700"
                                : r.volatility === "medium"
                                  ? "border border-amber-600/30 bg-amber-600/10 text-amber-700"
                                  : "border border-border bg-muted text-muted-foreground"
                            }`}
                          >
                            {r.volatility.charAt(0).toUpperCase() +
                              r.volatility.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-left text-xs">
                          {(() => {
                            const state = getPricingFreshness(
                              r.lastCheckedAt
                            );
                            return (
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${pricingFreshnessClasses(state)}`}
                              >
                                {pricingFreshnessLabel(state)}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-2 text-left">
                          {r.citation ? (
                            <Link
                              href={r.citation.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary hover:underline"
                              title={r.citation.name}
                            >
                              {r.citation.name.split(" — ")[0]}
                            </Link>
                          ) : (
                            <DataNotVerified />
                          )}
                        </td>
                        <td className="px-4 py-2 text-left text-xs text-muted-foreground">
                          {formatDateISO(r.lastCheckedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="card-surface p-4 text-sm text-muted-foreground">
              No hosted-provider rows match the current filters.
            </p>
          )}
        </section>
      ) : null}

      {showPending ? (
        <section aria-label="Pending verification" className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            Pending or unavailable creator pricing ({pendingRows.length})
          </h2>
          <p className="text-sm text-muted-foreground">
            Models where no first-party (model-creator) API pricing has
            been verified. Reasons differ: Meta does not run a paid
            first-party Llama API at all (hosted pricing may exist on
            Groq / Together — see above); OpenAI&apos;s docs site
            returns HTTP 403 to automated retrieval; Mistral&apos;s
            pricing tab is JavaScript-driven. Each case is logged on{" "}
            <Link href="/coverage" className="text-primary hover:underline">
              /coverage
            </Link>
            .
          </p>
          {pendingRows.length ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {pendingRows.map(({ model: m }) => {
                const p = getProviderBySlug(m.providerSlug);
                const hostedForModel = hostedPricing.filter(
                  (r) => r.modelSlug === m.slug
                );
                return (
                  <li
                    key={m.slug}
                    className="card-surface flex items-center justify-between gap-3 p-3"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/models/${m.slug}`}
                        className="block truncate text-sm font-medium text-foreground hover:underline"
                      >
                        {m.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {p?.name ?? unknownLabel()} ·{" "}
                        <Link
                          href={`/providers/${m.providerSlug}`}
                          className="hover:underline"
                        >
                          provider page
                        </Link>
                      </p>
                      {hostedForModel.length ? (
                        <p className="mt-1 text-[11px] text-primary">
                          Hosted pricing available on{" "}
                          {hostedForModel
                            .map(
                              (r) =>
                                getProviderBySlug(r.billingProviderSlug)
                                  ?.name ?? r.billingProviderSlug
                            )
                            .join(", ")}{" "}
                          — see hosted table above.
                        </p>
                      ) : null}
                    </div>
                    <VerificationBadge status={m.verificationStatus} />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="card-surface p-4 text-sm text-muted-foreground">
              No pending rows match the current filters.
            </p>
          )}
        </section>
      ) : null}

      <aside className="card-surface p-4 text-sm text-muted-foreground">
        <p>
          See <Link href="/sources" className="text-primary hover:underline">/sources</Link>{" "}
          for every primary-source pricing citation,{" "}
          <Link href="/coverage" className="text-primary hover:underline">/coverage</Link>{" "}
          for verification attempts (including blocked retrievals), and{" "}
          <Link href="/compare" className="text-primary hover:underline">/compare</Link>{" "}
          for side-by-side breakdowns. Filtered URLs on this hub are{" "}
          <code className="rounded bg-muted px-1">noindex, follow</code>.
        </p>
      </aside>

      <aside
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="How to read pricing rows"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          How to read these rows
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            See{" "}
            <Link
              href="/research/api-pricing-methodology"
              className="text-primary hover:underline"
            >
              /research/api-pricing-methodology
            </Link>{" "}
            for the full methodology — including why cache pricing is
            kept as separate units instead of normalised into one
            column.
          </li>
          <li>
            See{" "}
            <Link
              href="/docs/pricing-fields"
              className="text-primary hover:underline"
            >
              /docs/pricing-fields
            </Link>{" "}
            for the PricingUnit enum reference.
          </li>
          <li>
            Unverified pricing is intentionally hidden — when a
            provider&apos;s page renders only with JavaScript (Mistral)
            or returns HTTP 403 (OpenAI), no rate is shown. The
            relevant models appear under <em>Pending verification</em>{" "}
            below.
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
