import type { Metadata } from "next";
import Link from "next/link";
import { ContentPageShell } from "@/components/ContentPageShell";
import { DataNotVerified } from "@/components/DataNotVerified";
import { FieldDefinitionTable } from "@/components/content/FieldDefinitionTable";
import { buildMetadata } from "@/lib/seo";
import { getContentPage } from "@/lib/content";

const SLUG = "/docs/data-verification";

export const metadata: Metadata = (() => {
  const page = getContentPage(SLUG)!;
  return buildMetadata({
    title: page.title,
    description: page.description,
    path: page.slug,
    keywords: page.keywords,
  });
})();

export default function Page() {
  const page = getContentPage(SLUG)!;
  return (
    <ContentPageShell
      page={page}
      breadcrumbParent={{ name: "Docs", href: "/docs" }}
      toc={[
        { id: "states", label: "Verification states" },
        { id: "source-types", label: "SourceType allow-list" },
        { id: "verified-field", label: "VerifiedField and MaybeVerified" },
        { id: "citation-requirements", label: "Citation requirements" },
        { id: "unverified-label", label: "The canonical unverified-data label" },
        { id: "freshness-lifecycle", label: "Freshness lifecycle and reverification" },
        { id: "allowed-disallowed", label: "Allowed vs disallowed content" },
      ]}
      relatedLinks={[
        {
          href: "/sources",
          label: "Sources",
          description: "Every primary-source citation, grouped by provider.",
        },
        {
          href: "/coverage",
          label: "Coverage",
          description: "Per-provider verification matrix + per-attempt audit log.",
        },
        {
          href: "/docs/model-page-schema",
          label: "Model page schema",
          description: "Where the verified fields land on a ModelEntity.",
        },
        {
          href: "/research/source-verification-methodology",
          label: "Source verification methodology",
          description: "The methodology behind these schemas.",
        },
      ]}
    >
      <section id="states">
        <h2>Verification states</h2>
        <p>
          Every entity (model, provider, comparison, observation,
          pricing tier) declares a{" "}
          <code className="rounded bg-muted px-1">verificationStatus</code>{" "}
          drawn from a fixed enum:
        </p>
        <FieldDefinitionTable
          caption="VerificationStatus enum"
          identifierHeader="Status"
          rows={[
            {
              identifier: "verified",
              definition:
                "Every metric on the entity is wrapped in a VerifiedField with a current citation.",
              rule: "Eligible for indexable detail pages, JSON-LD metric emission, and hub filters that surface verified rows first.",
            },
            {
              identifier: "partial",
              definition:
                "Some metrics are verified, others are null.",
              rule: (
                <>
                  Detail pages render verified fields normally and the
                  canonical unverified-data label for the rest.
                </>
              ),
            },
            {
              identifier: "unverified",
              definition:
                "Entity identity is known (canonical identifier, slug) but no metric has been confirmed against a primary source.",
              rule: "Catalogue entry only. Detail pages render the unverified-data label for every metric.",
            },
          ]}
        />
        <p>
          Lifecycle status (
          <code className="rounded bg-muted px-1">active</code>,{" "}
          <code className="rounded bg-muted px-1">preview</code>,{" "}
          <code className="rounded bg-muted px-1">deprecated</code>,{" "}
          <code className="rounded bg-muted px-1">retired</code>) is a
          separate field; a model may be{" "}
          <code className="rounded bg-muted px-1">verified</code> and{" "}
          <code className="rounded bg-muted px-1">retired</code> at the
          same time.
        </p>
      </section>

      <section id="source-types">
        <h2>SourceType allow-list</h2>
        <p>
          Citations carry a{" "}
          <code className="rounded bg-muted px-1">type</code> field
          drawn from a closed union:
        </p>
        <FieldDefinitionTable
          caption="SourceType allow-list"
          identifierHeader="type"
          rows={[
            {
              identifier: "official-vendor-docs",
              definition:
                "Provider's own technical documentation on a provider-controlled domain.",
              rule: "Preferred for context window, max output, modality, lifecycle, features.",
            },
            {
              identifier: "official-vendor-pricing",
              definition:
                "Provider's own pricing reference, on a provider-controlled domain, at a stable URL.",
              rule: "The only acceptable source for verified pricing amounts.",
            },
            {
              identifier: "official-vendor-site",
              definition:
                "Provider marketing surface, used only when the fact is structurally bound there (HQ, status page URL).",
              rule: "Limited use; never the source for a metric.",
            },
            {
              identifier: "regulatory-filing",
              definition: "Authoritative regulator's record.",
            },
            {
              identifier: "research-paper",
              definition:
                "Peer-reviewed paper or recognised preprint archive, for architecture / training claims the provider has published.",
            },
            {
              identifier: "public-dataset",
              definition:
                "Publicly-versioned dataset, used as a benchmark reference.",
            },
            {
              identifier: "unknown",
              definition: "Placeholder for unclassified sources.",
              rule: "Rejected for metric citations. Rare; mostly historical.",
            },
          ]}
        />
        <p>
          Blog posts, social posts, leaderboard pages, and AI-generated
          summaries are not on the allow-list. The constructor at{" "}
          <code className="rounded bg-muted px-1">lib/verified.ts</code>{" "}
          rejects any citation whose URL is not absolute and rejects any
          field without a non-empty{" "}
          <code className="rounded bg-muted px-1">name</code> and{" "}
          <code className="rounded bg-muted px-1">retrievedAt</code>.
        </p>
      </section>

      <section id="verified-field">
        <h2>VerifiedField and MaybeVerified</h2>
        <pre className="overflow-x-auto rounded-lg border border-border bg-background/60 p-3 text-[12px] leading-relaxed">
          {`type SourceType =
  | 'official-vendor-docs'
  | 'official-vendor-pricing'
  | 'official-vendor-site'
  | 'regulatory-filing'
  | 'research-paper'
  | 'public-dataset'
  | 'unknown';

interface SourceCitation {
  url: string;            // absolute URL
  name: string;
  type: SourceType;
  retrievedAt: string;    // ISO-8601 datetime
  notes?: string;
}

interface VerifiedField<T> {
  value: T;
  citation: SourceCitation;
  confidenceLevel: 'high' | 'medium' | 'low' | 'unverified';
  notes?: string;
}

type MaybeVerified<T> = VerifiedField<T> | null;`}
        </pre>
        <p>
          Metric fields on entities are typed{" "}
          <code className="rounded bg-muted px-1">MaybeVerified&lt;T&gt;</code>.
          The type system blocks unsourced rendering: a renderer cannot
          access{" "}
          <code className="rounded bg-muted px-1">field.value</code>{" "}
          without first calling the{" "}
          <code className="rounded bg-muted px-1">isVerified()</code>{" "}
          type guard.
        </p>
      </section>

      <section id="citation-requirements">
        <h2>Citation requirements</h2>
        <ul>
          <li>
            <code className="rounded bg-muted px-1">url</code> — must be
            absolute (
            <code className="rounded bg-muted px-1">^https?:\/\/</code>
            ); the citation helper rejects relative URLs at module
            load.
          </li>
          <li>
            <code className="rounded bg-muted px-1">retrievedAt</code> —
            ISO-8601 datetime documenting when the page was visually
            inspected or fetched successfully. Not the commit time.
          </li>
          <li>
            <code className="rounded bg-muted px-1">type</code> — one of
            the allow-listed source types above.
          </li>
          <li>
            <code className="rounded bg-muted px-1">notes</code> — free
            text describing what specifically was used from the source
            page. Recommended; not required.
          </li>
        </ul>
      </section>

      <section id="unverified-label">
        <h2>The canonical unverified-data label</h2>
        <p>
          A single phrase is the platform-wide unverified-data label —
          rendered through the{" "}
          <code className="rounded bg-muted px-1">&lt;DataNotVerified /&gt;</code>{" "}
          component and exported from{" "}
          <code className="rounded bg-muted px-1">lib/verified.ts</code>{" "}
          as the{" "}
          <code className="rounded bg-muted px-1">UNVERIFIED_LABEL</code>{" "}
          constant. It appears like this when a metric is unverified:{" "}
          <DataNotVerified />. The literal string may not appear
          elsewhere in the codebase — an integrity guard refuses to
          ship a build that duplicates it outside the renderer, the
          constant declaration, and the policy docs.
        </p>
      </section>

      <section id="freshness-lifecycle">
        <h2>Freshness lifecycle and reverification</h2>
        <p>
          Verification is a moment-in-time act. Sprint 21 added a
          source-freshness layer that pairs every verified record with
          a freshness state computed deterministically against{" "}
          <code className="rounded bg-muted px-1">
            siteConfig.buildDate
          </code>
          .
        </p>
        <ul>
          <li>
            <strong>Fresh</strong> — checked recently (standard cadence:
            within 30 days; pricing cadence: within 14 days).
          </li>
          <li>
            <strong>Review due</strong> — past the fresh window but
            within the stale window. The value is still considered
            verified for rendering; a manual reviewer is suggested.
          </li>
          <li>
            <strong>Stale</strong> — past the stale window. Still not
            asserted as <em>false</em>; the queue marks it for a
            mandatory manual re-check before reuse on a new surface.
          </li>
          <li>
            <strong>Blocked</strong> — a vendor URL that returned
            403/401/429/JS-required to automated retrieval. The
            reverification queue retries every{" "}
            <code className="rounded bg-muted px-1">
              SOURCE_FRESHNESS_DAYS.blockedRetry
            </code>{" "}
            days against a manual browser pass.
          </li>
          <li>
            <strong>Unknown</strong> — no timestamp on record.
          </li>
        </ul>
        <p>
          <strong>Reverification policy.</strong> The catalogue does
          not automatically scrape sources. It does not mutate
          verified values in the background. It does not publish
          unreviewed fetched data. The{" "}
          <Link
            href="/reverification"
            className="text-primary hover:underline"
          >
            /reverification
          </Link>{" "}
          queue (and machine-readable{" "}
          <code className="rounded bg-muted px-1">
            /api/reverification
          </code>
          ) lists every record due for a manual re-check, the source
          URL, and a suggested action. The reviewer confirms the value
          against the vendor&apos;s own page, updates{" "}
          <code className="rounded bg-muted px-1">retrievedAt</code> or{" "}
          <code className="rounded bg-muted px-1">lastCheckedAt</code>{" "}
          with the date of the manual review, and re-runs the
          integrity guards.
        </p>
        <p>
          <strong>Stale is not false.</strong> A row marked stale is a
          row whose source has not been confirmed for longer than the
          window allows — it is not a claim the value is wrong. The
          renderer keeps showing it (the value was verified at the
          time) but pairs it with a chip so any reader can see how
          recently it was last checked.
        </p>
      </section>

      <section id="allowed-disallowed">
        <h2>Allowed vs disallowed content</h2>
        <p>
          <strong>Allowed.</strong> Verified metric rendering through
          VerifiedField. Methodology and educational content (like the
          page you are reading). Source-aware comparison tables. The
          canonical unverified-data label for any unverified metric.
        </p>
        <p>
          <strong>Disallowed.</strong> Estimated, averaged, or
          interpolated values rendered as if verified. Provider-reported
          claims rendered as model properties (rather than as cited
          statements). Benchmark scores without a primary-source
          citation. Uptime percentages without durable observations.
          Latency numbers without a measurement harness.{" "}
          &quot;Best model&quot; rankings of any kind. See{" "}
          <Link
            href="/docs/comparison-methodology"
            className="text-primary hover:underline"
          >
            comparison methodology
          </Link>{" "}
          for the no-winner discipline as it applies to /compare.
        </p>
      </section>
    </ContentPageShell>
  );
}
