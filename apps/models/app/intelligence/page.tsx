import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import {
  getCoverageHealthMatrix,
  getIntelligenceSummary,
  getReviewOperationsSummary,
  getWorkspaceLinks,
} from "@/lib/intelligence-summary";
import { getComparisonCoverageSummary } from "@/lib/comparison-clusters";
import { getCitationImpactSummary } from "@/lib/source-usage";
import { formatDateISO } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Intelligence Workspace",
  description:
    "Operational workspace for AI model infrastructure intelligence — verified models, provider coverage, pricing references, status observations, source freshness, comparison clusters, and the manual reverification queue, in one view.",
  path: "/intelligence",
});

export default function IntelligencePage() {
  const summary = getIntelligenceSummary();
  const matrix = getCoverageHealthMatrix();
  const reviewOps = getReviewOperationsSummary();
  const links = getWorkspaceLinks();
  const comparisonCoverage = getComparisonCoverageSummary();
  const citationImpact = getCitationImpactSummary();

  const snapshotCards: { label: string; value: number; href: string }[] = [
    {
      label: "Verified models",
      value: summary.verifiedModels,
      href: "/models",
    },
    {
      label: "Verified providers",
      value: summary.verifiedProviders,
      href: "/providers",
    },
    {
      label: "First-party pricing references",
      value: summary.firstPartyPricingReferences,
      href: "/pricing",
    },
    {
      label: "Hosted pricing references",
      value: summary.hostedPricingReferences,
      href: "/pricing",
    },
    {
      label: "Hosted availability records",
      value: summary.hostedAvailabilityRecords,
      href: "/pricing",
    },
    {
      label: "Two-sided verified comparisons",
      value: summary.twoSidedVerifiedComparisons,
      href: "/compare",
    },
    {
      label: "Status observers",
      value: summary.statusObservers,
      href: "/status",
    },
    {
      label: "Source citations",
      value: summary.sourceCitations,
      href: "/sources",
    },
    {
      label: "Reverification items",
      value: summary.reverificationItems,
      href: "/reverification",
    },
    {
      label: "Blocked vendor docs",
      value: summary.blockedVendorDocs,
      href: "/reverification?reason=blocked_vendor_docs",
    },
  ];

  return (
    <PageShell
      eyebrow="Workspace"
      title="AI Model Infrastructure Intelligence Workspace"
      intro="Operator view across the entity graph — verified models, provider coverage, pricing references, source freshness, comparison clusters, and the manual reverification queue in one snapshot. The same verified-data backbone that powers the AI usage learning curriculum at /learn. Every count below is derived from the typed local data layer. No fabricated metrics, no rankings, no auto-mutation."
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Intelligence", href: "/intelligence" },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Intelligence", href: "/intelligence" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Intelligence Workspace",
            url: `${siteConfig.url}/intelligence`,
            description:
              "Operator workspace for AI model infrastructure intelligence.",
            dateModified: siteConfig.buildDate,
            isPartOf: { "@type": "WebSite", url: siteConfig.url },
          },
        ]}
      />

      <aside
        role="note"
        aria-label="Workspace policy"
        className="card-surface space-y-2 p-4 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          Workspace policy
        </p>
        <p>
          Counts are derived from local typed data. No fabricated
          metrics, no fake uptime, no benchmark scores invented in
          aggregate, no &quot;cheapest&quot; or &quot;best&quot;
          rankings. The reverification queue is informational only —
          the catalogue never auto-fetches vendor sources or mutates
          verified values.
        </p>
        <p>
          Build date:{" "}
          <code className="rounded bg-muted px-1">
            {formatDateISO(siteConfig.buildDate)}
          </code>
          .
        </p>
      </aside>

      <section aria-label="Workspace destinations" className="space-y-3">
        <SectionHeader
          eyebrow="Navigate"
          title="Workspace destinations"
          description="Every hub the catalogue exposes, with a one-line description of what lives there."
          as="h2"
        />
        <ul className="grid gap-3 sm:grid-cols-2">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="card-surface block p-4 transition hover:border-primary/30 hover:shadow-elevated"
              >
                <p className="text-sm font-semibold text-foreground">
                  {link.label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {link.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Intelligence snapshot" className="space-y-3">
        <SectionHeader
          eyebrow="Snapshot"
          title="Current intelligence snapshot"
          description="Counts derived from the typed local data layer. Cards link to the corresponding hub view."
          as="h2"
        />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {snapshotCards.map((card) => (
            <li key={card.label}>
              <Link
                href={card.href}
                className="card-surface block p-4 transition hover:border-primary/30 hover:shadow-elevated"
              >
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {card.label}
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                  {card.value}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Review operations" className="space-y-3">
        <SectionHeader
          eyebrow="Operations"
          title="Review operations"
          description="The high-priority subset of the reverification queue, grouped by reason. The queue is informational — never auto-mutated."
          cta={{ label: "Open queue", href: "/reverification" }}
          as="h2"
        />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              {
                label: "High priority",
                value: reviewOps.highPriorityCount,
                href: "/reverification?priority=high",
              },
              {
                label: "Blocked vendor docs",
                value: reviewOps.blockedVendorDocs,
                href: "/reverification?reason=blocked_vendor_docs",
              },
              {
                label: "Pricing review due",
                value: reviewOps.pricingReviewDue,
                href: "/reverification?reason=pricing_review_due",
              },
              {
                label: "Hosted pricing due",
                value: reviewOps.hostedPricingReviewDue,
                href: "/reverification?reason=hosted_pricing_review_due",
              },
              {
                label: "Stale citations",
                value: reviewOps.staleCitations,
                href: "/reverification?entityType=citation",
              },
              {
                label: "Partial providers",
                value: reviewOps.partialProviders,
                href: "/reverification?reason=partial_provider_coverage",
              },
              {
                label: "Unverified model metrics",
                value: reviewOps.unverifiedModelMetrics,
                href: "/reverification?reason=unverified_model_metric",
              },
            ] as const
          ).map((card) => (
            <li key={card.label}>
              <Link
                href={card.href}
                className="card-surface block p-4 transition hover:border-primary/30 hover:shadow-elevated"
              >
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {card.label}
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                  {card.value}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Coverage health matrix" className="space-y-3">
        <SectionHeader
          eyebrow="Health"
          title="Coverage health matrix"
          description="Per-domain readiness across the entity graph. There is no derived health score — counts are what they are."
          as="h2"
        />
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2 text-left">
                  Domain
                </th>
                <th scope="col" className="px-4 py-2 text-right">
                  Verified / available
                </th>
                <th scope="col" className="px-4 py-2 text-right">
                  Partial / review due
                </th>
                <th scope="col" className="px-4 py-2 text-right">
                  Blocked / missing
                </th>
                <th scope="col" className="px-4 py-2 text-left">
                  Primary action
                </th>
              </tr>
            </thead>
            <tbody className="bg-card">
              {matrix.map((row) => (
                <tr
                  key={row.domain}
                  className="border-t border-border align-top"
                >
                  <th
                    scope="row"
                    className="px-4 py-2 text-left font-medium text-foreground"
                  >
                    <Link
                      href={row.primaryRoute}
                      className="hover:underline"
                    >
                      {row.domain}
                    </Link>
                  </th>
                  <td className="px-4 py-2 text-right tabular-nums text-emerald-700">
                    {row.verifiedOrAvailable}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-amber-700">
                    {row.partialOrReviewDue}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-red-700">
                    {row.blockedOrMissing}
                  </td>
                  <td className="px-4 py-2 text-left text-xs text-muted-foreground">
                    {row.primaryAction}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section
        aria-label="Comparison + citation impact"
        className="grid gap-3 md:grid-cols-2"
      >
        <article className="card-surface space-y-2 p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Comparison coverage
          </p>
          <p className="text-muted-foreground">
            {comparisonCoverage.totalComparisons} comparisons across{" "}
            {comparisonCoverage.totalClusters} provider clusters.
          </p>
          <ul className="text-xs text-muted-foreground">
            <li>
              Two-sided verified:{" "}
              <strong className="text-foreground">
                {comparisonCoverage.twoSidedVerified}
              </strong>
            </li>
            <li>
              One-sided verified:{" "}
              <strong className="text-foreground">
                {comparisonCoverage.oneSidedVerified}
              </strong>
            </li>
            <li>
              Pending:{" "}
              <strong className="text-foreground">
                {comparisonCoverage.pending}
              </strong>
            </li>
          </ul>
          <Link
            href="/compare"
            className="inline-block text-xs text-primary hover:underline"
          >
            Open /compare →
          </Link>
        </article>
        <article className="card-surface space-y-2 p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Citation impact
          </p>
          <p className="text-muted-foreground">
            {citationImpact.totalCitations} unique primary-source
            citations support the verified entity graph.
          </p>
          <ul className="text-xs text-muted-foreground">
            <li>
              Fresh:{" "}
              <strong className="text-foreground">
                {citationImpact.freshCitations}
              </strong>
            </li>
            <li>
              Review due:{" "}
              <strong className="text-foreground">
                {citationImpact.reviewDueCitations}
              </strong>
            </li>
            <li>
              Stale:{" "}
              <strong className="text-foreground">
                {citationImpact.staleCitations}
              </strong>
            </li>
          </ul>
          <Link
            href="/sources"
            className="inline-block text-xs text-primary hover:underline"
          >
            Open /sources →
          </Link>
        </article>
      </section>

      <section aria-label="Methodology" className="space-y-3">
        <SectionHeader
          eyebrow="Methodology"
          title="How these counts are produced"
          as="h2"
        />
        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            {
              label: "Model selection",
              href: "/research/model-selection",
              description: "What to weigh when picking a model.",
            },
            {
              label: "Source verification methodology",
              href: "/research/source-verification-methodology",
              description:
                "Primary-source rules, freshness lifecycle, and the manual review loop.",
            },
            {
              label: "API pricing methodology",
              href: "/research/api-pricing-methodology",
              description:
                "References, not live quotes. No price ranking.",
            },
            {
              label: "AI provider status monitoring",
              href: "/research/ai-provider-status-monitoring",
              description:
                "Vendor-reported feeds + independent probes. No fabricated uptime.",
            },
            {
              label: "Data verification rules",
              href: "/docs/data-verification",
              description:
                "Verification states, freshness lifecycle, stale ≠ false.",
            },
            {
              label: "Comparison methodology",
              href: "/docs/comparison-methodology",
              description: "How comparisons render side-by-side.",
            },
          ].map((card) => (
            <li key={card.href}>
              <Link
                href={card.href}
                className="card-surface block p-4 transition hover:border-primary/30 hover:shadow-elevated"
              >
                <p className="text-sm font-semibold text-foreground">
                  {card.label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {card.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <aside
        className="card-surface p-4 text-sm text-muted-foreground"
        aria-label="Machine endpoint"
      >
        <p>
          Machine-readable counterpart:{" "}
          <code className="rounded bg-muted px-1">
            /api/intelligence
          </code>
          . Returns the same counts and workspace links as JSON for
          partner dashboards. Reverification checklist export:{" "}
          <code className="rounded bg-muted px-1">
            /api/reverification/checklist
          </code>
          {" "}(text/markdown or JSON).
        </p>
      </aside>
    </PageShell>
  );
}
