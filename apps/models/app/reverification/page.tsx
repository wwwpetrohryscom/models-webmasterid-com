import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { isFilteredRoute, robotsMetadata } from "@/lib/should-index";
import { siteConfig } from "@/lib/site-config";
import { providers } from "@/data/providers";
import {
  getReverificationQueue,
  getReverificationSummary,
  type ReverificationQueueItem,
} from "@/lib/reverification";
import {
  freshnessClasses,
  freshnessLabel,
  priorityClasses,
  priorityLabel,
  reasonLabel,
  REVERIFICATION_POLICY_NOTE,
  type FreshnessPriority,
  type FreshnessState,
  type ReverificationReason,
} from "@/lib/source-freshness";
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

const PRIORITY_OPTIONS: { value: FreshnessPriority; label: string }[] = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const FRESHNESS_OPTIONS: { value: FreshnessState; label: string }[] = [
  { value: "fresh", label: "Fresh" },
  { value: "review_due", label: "Review due" },
  { value: "stale", label: "Stale" },
  { value: "blocked", label: "Blocked" },
  { value: "unknown", label: "Unknown" },
];

const ENTITY_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "pricing", label: "Pricing" },
  { value: "hosted_pricing", label: "Hosted pricing" },
  { value: "citation", label: "Citation" },
  { value: "verification_attempt", label: "Verification attempt" },
  { value: "provider", label: "Provider" },
  { value: "model", label: "Model" },
  { value: "status_observer", label: "Status observer" },
];

const REASON_OPTIONS: { value: ReverificationReason; label: string }[] = [
  { value: "pricing_review_due", label: "Pricing review due" },
  {
    value: "hosted_pricing_review_due",
    label: "Hosted pricing review due",
  },
  { value: "source_review_due", label: "Source review due" },
  { value: "blocked_vendor_docs", label: "Vendor docs blocked" },
  { value: "partial_provider_coverage", label: "Provider partial" },
  { value: "unverified_model_metric", label: "Model metric unverified" },
  { value: "status_observer_missing", label: "Status observer missing" },
  { value: "stale_citation", label: "Stale citation" },
];

const REASON_GROUPS: {
  id: string;
  label: string;
  reasons: ReverificationReason[];
  description: string;
}[] = [
  {
    id: "pricing-references",
    label: "Pricing references",
    reasons: ["pricing_review_due"],
    description:
      "First-party API pricing rows whose last-checked timestamp puts them past the pricing freshness window (14d fresh, 30d review-due, 45d stale).",
  },
  {
    id: "hosted-pricing-references",
    label: "Hosted pricing references",
    reasons: ["hosted_pricing_review_due"],
    description:
      "Hosted-platform pricing rows (Groq, Together AI). Hosted rates are high-volatility — same freshness window as first-party pricing.",
  },
  {
    id: "blocked-vendor-docs",
    label: "Blocked vendor docs",
    reasons: ["blocked_vendor_docs"],
    description:
      "Sources that returned 403 / 401 / 429 / JS-required to automated retrieval. A manual browser pass is required to unblock; the catalogue does not pretend a blocked source is verified.",
  },
  {
    id: "partial-provider-coverage",
    label: "Partial provider coverage",
    reasons: ["partial_provider_coverage"],
    description:
      "Providers marked verificationStatus = 'partial'. Their primary URLs are reachable but some model-record fields remain null.",
  },
  {
    id: "stale-citations",
    label: "Stale citations",
    reasons: ["stale_citation", "source_review_due"],
    description:
      "Primary-source citations whose retrievedAt is past the standard freshness window (30d / 60d / 90d). Stale does NOT mean false — it means re-verify before the value is reused on a new surface.",
  },
  {
    id: "status-observer-gaps",
    label: "Status observer gaps",
    reasons: ["status_observer_missing"],
    description:
      "Verified providers that publish a public status page but have no observer wired in lib/observers/. The status surface should still reach these vendors.",
  },
  {
    id: "unverified-model-metrics",
    label: "Unverified model metrics",
    reasons: ["unverified_model_metric"],
    description:
      "Verified model records that nonetheless carry multiple null metric fields (max output, modality, context window, knowledge cutoff, release date). Worth a documentation re-walk.",
  },
];

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const filtered = isFilteredRoute(params);
  return {
    ...buildMetadata({
      title: "Reverification Queue",
      description:
        "Source-freshness queue: which verified facts on WebmasterID Models are due for manual re-verification, why, and what to re-check first. The queue is informational — no automatic scraping, no auto-mutation of values.",
      path: "/reverification",
    }),
    robots: robotsMetadata(!filtered),
  };
}

function PriorityChip({ item }: { item: ReverificationQueueItem }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityClasses(item.priority)}`}
    >
      {priorityLabel(item.priority)}
    </span>
  );
}

function FreshnessChip({ item }: { item: ReverificationQueueItem }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${freshnessClasses(item.freshnessState)}`}
    >
      {freshnessLabel(item.freshnessState)}
    </span>
  );
}

function QueueTable({ items }: { items: ReverificationQueueItem[] }) {
  if (!items.length) {
    return (
      <p className="card-surface p-4 text-sm text-muted-foreground">
        No items match this filter.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2 text-left">
              Priority
            </th>
            <th scope="col" className="px-4 py-2 text-left">
              Entity
            </th>
            <th scope="col" className="px-4 py-2 text-left">
              Provider
            </th>
            <th scope="col" className="px-4 py-2 text-left">
              Reason
            </th>
            <th scope="col" className="px-4 py-2 text-left">
              Freshness
            </th>
            <th scope="col" className="px-4 py-2 text-left">
              Last checked
            </th>
            <th scope="col" className="px-4 py-2 text-left">
              Source
            </th>
            <th scope="col" className="px-4 py-2 text-left">
              Affected routes
            </th>
            <th scope="col" className="px-4 py-2 text-left">
              Suggested action
            </th>
          </tr>
        </thead>
        <tbody className="bg-card">
          {items.map((item) => (
            <tr key={item.id} className="border-t border-border align-top">
              <td className="px-4 py-2">
                <PriorityChip item={item} />
              </td>
              <th
                scope="row"
                className="px-4 py-2 text-left font-medium text-foreground"
              >
                <div className="space-y-1">
                  <p>{item.title}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {item.entityType.replace(/_/g, " ")}
                  </p>
                </div>
              </th>
              <td className="px-4 py-2 text-xs text-muted-foreground">
                {item.providerSlug ? (
                  <Link
                    href={`/providers/${item.providerSlug}`}
                    className="hover:underline"
                  >
                    {item.providerSlug}
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-2 text-xs text-muted-foreground">
                {reasonLabel(item.reason)}
                {item.blockedReason ? (
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-purple-700">
                    {item.blockedReason}
                  </p>
                ) : null}
              </td>
              <td className="px-4 py-2">
                <FreshnessChip item={item} />
              </td>
              <td className="px-4 py-2 text-xs text-muted-foreground">
                {formatDateISO(item.lastCheckedAt ?? null)}
              </td>
              <td className="px-4 py-2 text-xs">
                {item.sourceUrl ? (
                  <Link
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-primary hover:underline"
                    title={item.sourceName ?? item.sourceUrl}
                  >
                    {(item.sourceName ?? item.sourceUrl).split(" — ")[0]}
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-2 text-xs text-muted-foreground">
                <ul className="space-y-0.5">
                  {item.affectedRoutes.map((r) => (
                    <li key={r}>
                      <Link href={r} className="hover:underline">
                        {r}
                      </Link>
                    </li>
                  ))}
                </ul>
              </td>
              <td className="px-4 py-2 text-xs text-muted-foreground">
                {item.suggestedAction}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ReverificationPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const priorityFilter = readParam(params, "priority") as
    | FreshnessPriority
    | undefined;
  const reasonFilter = readParam(params, "reason") as
    | ReverificationReason
    | undefined;
  const providerFilter = readParam(params, "provider");
  const entityTypeFilter = readParam(params, "entityType");
  const freshnessFilter = readParam(params, "freshness") as
    | FreshnessState
    | undefined;
  const filtered = isFilteredRoute(params);

  const queueAll = getReverificationQueue();
  const summary = getReverificationSummary();

  const queue = queueAll.filter((item) => {
    if (priorityFilter && item.priority !== priorityFilter) return false;
    if (reasonFilter && item.reason !== reasonFilter) return false;
    if (providerFilter && item.providerSlug !== providerFilter) return false;
    if (entityTypeFilter && item.entityType !== entityTypeFilter)
      return false;
    if (freshnessFilter && item.freshnessState !== freshnessFilter)
      return false;
    return true;
  });

  const cards: { label: string; value: number; href?: string }[] = [
    { label: "Total items", value: summary.total, href: "#full-queue" },
    { label: "Critical", value: summary.critical, href: "#full-queue" },
    { label: "High", value: summary.high, href: "#full-queue" },
    {
      label: "Pricing review due",
      value: summary.pricing,
      href: "#pricing-references",
    },
    {
      label: "Hosted pricing review due",
      value: summary.hostedPricing,
      href: "#hosted-pricing-references",
    },
    {
      label: "Blocked vendor docs",
      value: summary.blocked,
      href: "#blocked-vendor-docs",
    },
    {
      label: "Stale citations",
      value: queueAll.filter((i) => i.entityType === "citation").length,
      href: "#stale-citations",
    },
    {
      label: "Build date",
      value: 0,
      href: undefined,
    },
  ];

  return (
    <PageShell
      eyebrow="Transparency"
      title="Reverification Queue"
      intro="Verified facts age. This page surfaces every source that should be re-checked before a value moves to a new surface or a procurement decision. The queue is informational — there is no automatic scraping, no auto-mutation of values, and no claim that a stale row is wrong."
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Reverification", href: "/reverification" },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Reverification", href: "/reverification" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Reverification Queue",
            url: `${siteConfig.url}/reverification`,
            description:
              "Source-freshness queue: which verified facts on WebmasterID Models are due for manual re-verification.",
            dateModified: siteConfig.buildDate,
            isPartOf: { "@type": "WebSite", url: siteConfig.url },
          },
        ]}
      />

      <aside
        role="note"
        aria-label="Reverification policy"
        className="card-surface space-y-2 p-4 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          Policy: review, never auto-update.
        </p>
        <p>{REVERIFICATION_POLICY_NOTE}</p>
        <p>
          Build date:{" "}
          <code className="rounded bg-muted px-1">
            {formatDateISO(siteConfig.buildDate)}
          </code>
          . Freshness states are computed deterministically against
          this date — they only transition on the next deploy, never
          mid-render.
        </p>
      </aside>

      <section aria-label="Summary" className="space-y-3">
        <SectionHeader
          eyebrow="At a glance"
          title="Queue summary"
          description="Counts derived from the typed local data layer. Cards link to the corresponding queue section below."
          as="h2"
        />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const display =
              card.label === "Build date"
                ? formatDateISO(siteConfig.buildDate)
                : card.value;
            const inner = (
              <>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {card.label}
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                  {display}
                </p>
              </>
            );
            return (
              <li key={card.label}>
                {card.href ? (
                  <a
                    href={card.href}
                    className="card-surface block p-4 transition hover:border-primary/30 hover:shadow-elevated"
                  >
                    {inner}
                  </a>
                ) : (
                  <div className="card-surface p-4">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <form
        method="get"
        action="/reverification"
        aria-label="Filter the reverification queue"
        className="card-surface p-4"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">
              Priority
            </span>
            <select
              name="priority"
              defaultValue={priorityFilter ?? ""}
              aria-label="Filter by priority"
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">All priorities</option>
              {PRIORITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">
              Reason
            </span>
            <select
              name="reason"
              defaultValue={reasonFilter ?? ""}
              aria-label="Filter by reason"
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">All reasons</option>
              {REASON_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">
              Provider
            </span>
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
              Entity type
            </span>
            <select
              name="entityType"
              defaultValue={entityTypeFilter ?? ""}
              aria-label="Filter by entity type"
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">All entities</option>
              {ENTITY_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">
              Freshness
            </span>
            <select
              name="freshness"
              defaultValue={freshnessFilter ?? ""}
              aria-label="Filter by freshness state"
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">All states</option>
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
            <Link
              href="/reverification"
              className="text-primary hover:underline"
            >
              Reset
            </Link>
          ) : null}
          <span>
            {queue.length} of {queueAll.length} queue item
            {queueAll.length === 1 ? "" : "s"} match.
          </span>
        </div>
      </form>

      <section
        id="full-queue"
        aria-label="Full reverification queue"
        className="space-y-3"
      >
        <SectionHeader
          eyebrow="Queue"
          title={`Review queue (${queue.length})`}
          description="Ordered by priority (critical → high → medium → low). Every row points at a source URL and a suggested manual action. The catalogue does not change any verified value until a reviewer confirms the source."
          as="h2"
        />
        <QueueTable items={queue} />
      </section>

      {!filtered
        ? REASON_GROUPS.map((group) => {
            const items = queueAll.filter((q) =>
              group.reasons.includes(q.reason)
            );
            if (!items.length) return null;
            return (
              <section
                key={group.id}
                id={group.id}
                aria-label={group.label}
                className="space-y-3"
              >
                <SectionHeader
                  eyebrow="Category"
                  title={`${group.label} (${items.length})`}
                  description={group.description}
                  as="h2"
                />
                <QueueTable items={items} />
              </section>
            );
          })
        : null}

      <aside
        className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
        aria-label="Workflow"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Suggested review workflow
        </p>
        <ol className="ml-5 list-decimal space-y-1">
          <li>Pick a queue item (highest priority first).</li>
          <li>
            Open the linked source URL in a browser. Confirm the value
            on the vendor&apos;s own page.
          </li>
          <li>
            Compare the on-page value against the current catalogue
            record (linked in <em>Affected routes</em>).
          </li>
          <li>
            Update the relevant record in{" "}
            <code className="rounded bg-muted px-1">data/</code> —
            pricing in{" "}
            <code className="rounded bg-muted px-1">data/pricing.ts</code>{" "}
            or{" "}
            <code className="rounded bg-muted px-1">
              data/hosted-pricing.ts
            </code>
            ; citations in{" "}
            <code className="rounded bg-muted px-1">data/citations.ts</code>
            ; verification attempts in{" "}
            <code className="rounded bg-muted px-1">
              data/verification-attempts.ts
            </code>
            . Only update the verified field if the vendor source
            confirms the new value; otherwise update the citation
            timestamp alone.
          </li>
          <li>
            Stamp the new{" "}
            <code className="rounded bg-muted px-1">retrievedAt</code> or{" "}
            <code className="rounded bg-muted px-1">lastCheckedAt</code>{" "}
            with the date of the manual review. Do not back-date.
          </li>
          <li>
            Re-run{" "}
            <code className="rounded bg-muted px-1">
              npm run check:production
            </code>{" "}
            and{" "}
            <code className="rounded bg-muted px-1">npm run build</code>{" "}
            before pushing. The queue refreshes on the next build.
          </li>
        </ol>
        <p className="text-xs">
          Need a printable checklist?{" "}
          <Link
            href="/api/reverification/checklist"
            className="text-primary hover:underline"
          >
            /api/reverification/checklist
          </Link>{" "}
          returns Markdown (or JSON with{" "}
          <code className="rounded bg-muted px-1">?format=json</code>).
        </p>
      </aside>

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
              href="/intelligence"
              className="text-primary hover:underline"
            >
              /intelligence
            </Link>{" "}
            — workspace summary across the entity graph.
          </li>
          <li>
            <Link href="/coverage" className="text-primary hover:underline">
              /coverage
            </Link>{" "}
            — what is verified today and what is partial / blocked.
          </li>
          <li>
            <Link href="/sources" className="text-primary hover:underline">
              /sources
            </Link>{" "}
            — every primary-source citation with retrievedAt.
          </li>
          <li>
            <Link
              href="/docs/data-verification"
              className="text-primary hover:underline"
            >
              /docs/data-verification
            </Link>{" "}
            — verification rules every metric must satisfy.
          </li>
          <li>
            <Link
              href="/research/source-verification-methodology"
              className="text-primary hover:underline"
            >
              /research/source-verification-methodology
            </Link>{" "}
            — how citations are accepted, recorded, and reused.
          </li>
          <li>
            <code className="rounded bg-muted px-1">/api/reverification</code>{" "}
            — machine-readable JSON of this queue.
          </li>
          <li>
            <code className="rounded bg-muted px-1">
              /api/reverification/checklist
            </code>{" "}
            — Markdown / JSON checklist export.
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
