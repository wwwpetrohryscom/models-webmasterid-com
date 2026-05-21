import type { Metadata } from "next";
import Link from "next/link";
import { ContentPageShell } from "@/components/ContentPageShell";
import { buildMetadata } from "@/lib/seo";
import { getContentPage } from "@/lib/content";

const SLUG = "/research/source-verification-methodology";

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
      breadcrumbParent={{ name: "Research", href: "/research" }}
      toc={[
        { id: "core-rule", label: "The core rule" },
        { id: "primary-sources", label: "What counts as a primary source" },
        { id: "verified-field", label: "The VerifiedField shape" },
        { id: "states", label: "Verification states" },
        { id: "retrieval-cadence", label: "Retrieval cadence" },
        { id: "blocked-attempts", label: "Blocked retrievals are recorded too" },
        { id: "jsonld-policy", label: "JSON-LD exclusion policy" },
        { id: "manual-workflow", label: "Manual verification workflow" },
      ]}
      verifiedToday={[
        {
          label: "Allow-listed source types",
          detail:
            "official-vendor-docs, official-vendor-pricing, official-vendor-site, regulatory-filing, research-paper, public-dataset. Anything else is rejected at the citation constructor.",
        },
        {
          label: "Type-system guard",
          detail:
            "Metric fields are typed MaybeVerified<T> = VerifiedField<T> | null. The verified() helper throws at build if the citation is missing url, name, or retrievedAt.",
        },
        {
          label: "Render-time guard",
          detail:
            "<VerifiedField> renders the canonical unverified-data label when its input is null. The literal phrase is forbidden everywhere except the renderer, the constant declaration, and the policy docs.",
        },
      ]}
      dataGaps={[
        {
          label: "Vendors that block automated retrieval",
          detail:
            "platform.openai.com returns 403. mistral.ai/pricing renders Le Chat plans by default — the API pricing tab is JS-driven. Both require a manual browser pass; the audit log at /coverage records each blocked attempt.",
        },
      ]}
      relatedLinks={[
        {
          href: "/sources",
          label: "Sources",
          description: "Every primary-source citation indexed by provider and source type.",
        },
        {
          href: "/coverage",
          label: "Coverage",
          description: "Per-provider verification matrix and per-attempt audit log.",
        },
        {
          href: "/docs/data-verification",
          label: "Data verification reference",
          description: "Schema reference for VerifiedField, MaybeVerified, and the verification states.",
        },
      ]}
    >
      <section id="core-rule">
        <h2>The core rule</h2>
        <p>
          Every metric on this site has a citation, or it does not
          exist. A &quot;metric&quot; is anything a reader could act on
          or be misled by: pricing, context window, max output,
          modality, release/snapshot dates, knowledge cutoff,
          lifecycle, benchmark scores, latency, uptime, regions,
          features. The type system enforces this — metric fields are
          typed{" "}
          <code className="rounded bg-muted px-1">
            MaybeVerified&lt;T&gt; = VerifiedField&lt;T&gt; | null
          </code>
          ; a non-null value cannot exist without a{" "}
          <code className="rounded bg-muted px-1">SourceCitation</code>{" "}
          attached to it.
        </p>
      </section>

      <section id="primary-sources">
        <h2>What counts as a primary source</h2>
        <p>
          The allow-list is intentionally narrow:
        </p>
        <ul>
          <li>
            <code className="rounded bg-muted px-1">
              official-vendor-docs
            </code>{" "}
            — the provider&apos;s own technical documentation hosted on
            a provider-controlled domain.
          </li>
          <li>
            <code className="rounded bg-muted px-1">
              official-vendor-pricing
            </code>{" "}
            — the provider&apos;s own pricing reference, on a
            provider-controlled domain, in a stable URL.
          </li>
          <li>
            <code className="rounded bg-muted px-1">
              official-vendor-site
            </code>{" "}
            — the provider&apos;s own marketing surface, used only
            when the relevant fact is structurally bound there
            (e.g. headquarters, status page URL).
          </li>
          <li>
            <code className="rounded bg-muted px-1">
              regulatory-filing
            </code>{" "}
            — an authoritative regulator&apos;s record.
          </li>
          <li>
            <code className="rounded bg-muted px-1">research-paper</code>{" "}
            — a peer-reviewed paper or a preprint on a recognised
            archive, used for factual claims about model architecture
            or training data when the provider has published them.
          </li>
          <li>
            <code className="rounded bg-muted px-1">public-dataset</code>{" "}
            — a publicly-versioned dataset used as a benchmark
            reference.
          </li>
        </ul>
        <p>
          Blog posts that are not on the provider&apos;s primary docs
          surface, social media, leaderboard sites, and AI-generated
          summaries are <em>not</em> primary sources.{" "}
          <code className="rounded bg-muted px-1">WebSearch</code>{" "}
          tool output is also not a primary source — it is an
          AI-generated summary of pages we cannot verify directly, and
          the verification workflow forbids it.
        </p>
      </section>

      <section id="verified-field">
        <h2>The VerifiedField shape</h2>
        <p>
          Every verified value is wrapped via the{" "}
          <code className="rounded bg-muted px-1">verified()</code>{" "}
          helper, which constructs:
        </p>
        <pre className="overflow-x-auto rounded-lg border border-border bg-background/60 p-3 text-[12px] leading-relaxed">
          {`interface VerifiedField<T> {
  value: T;
  citation: {
    url: string;            // absolute URL
    name: string;           // human-friendly source name
    type: SourceType;       // allow-listed
    retrievedAt: string;    // ISO-8601 datetime
    notes?: string;         // what was actually used from the page
  };
  confidenceLevel: 'high' | 'medium' | 'low' | 'unverified';
  notes?: string;
}`}
        </pre>
        <p>
          The constructor throws at build time if{" "}
          <code className="rounded bg-muted px-1">url</code>,{" "}
          <code className="rounded bg-muted px-1">name</code>, or{" "}
          <code className="rounded bg-muted px-1">retrievedAt</code>{" "}
          is missing. There is no escape hatch — a metric without a
          citation cannot ship.
        </p>
      </section>

      <section id="states">
        <h2>Verification states</h2>
        <ul>
          <li>
            <strong>verified</strong> — every metric on the entity is
            wrapped in a VerifiedField with a current citation.
          </li>
          <li>
            <strong>partial</strong> — some metrics are verified, others
            are null. The partial-verification badge appears on entity
            pages with this state.
          </li>
          <li>
            <strong>unverified</strong> — entity identity is known but
            no metric has been confirmed. Common for entries blocked by
            403/JS-only rendering.
          </li>
        </ul>
      </section>

      <section id="retrieval-cadence">
        <h2>Retrieval cadence</h2>
        <p>
          Pricing values: every 30 days, and immediately on any vendor
          pricing announcement. Lifecycle (deprecation, retirement):
          every 30 days plus on every published deprecation notice.
          Context window / max output / modality: every 90 days; these
          change less frequently. Benchmark scores: only when a new
          primary-source publication lands. Latency / uptime:
          continuously, once an independent monitor is wired; until
          then, null.
        </p>
        <p>
          Each entity records a{" "}
          <code className="rounded bg-muted px-1">lastCheckedAt</code>{" "}
          timestamp documenting the most recent full sweep. A field
          whose citation{" "}
          <code className="rounded bg-muted px-1">retrievedAt</code> is
          older than the cadence above should either be re-verified or
          dropped back to null.
        </p>
      </section>

      <section id="blocked-attempts">
        <h2>Blocked retrievals are recorded too</h2>
        <p>
          When an official documentation page cannot be retrieved
          (HTTP 403, JS-only rendering, redirect loop), the attempt
          itself is recorded in{" "}
          <code className="rounded bg-muted px-1">
            verification-attempts.ts
          </code>{" "}
          with the URL, the date, the outcome category, and a
          free-text note. The audit log at{" "}
          <Link href="/coverage" className="text-primary hover:underline">
            /coverage
          </Link>{" "}
          surfaces every attempt — including the OpenAI 403s — so
          readers can see exactly which gaps exist and why.
        </p>
      </section>

      <section id="jsonld-policy">
        <h2>JSON-LD exclusion policy</h2>
        <p>
          schema.org markup is generated per page from the verified
          fields only. The model JSON-LD helper at{" "}
          <code className="rounded bg-muted px-1">
            lib/model-jsonld.ts
          </code>{" "}
          uses{" "}
          <code className="rounded bg-muted px-1">isVerified()</code>{" "}
          to gate every metric and an integrity guard refuses to ship
          a build that emits unverified pricing, benchmark, latency,
          or uptime properties in JSON-LD. Search engines and AI
          surfaces never see an estimate from this site.
        </p>
      </section>

      <section id="manual-workflow">
        <h2>Manual verification workflow</h2>
        <p>
          For providers that block automated retrieval, the manual
          workflow is documented in{" "}
          <code className="rounded bg-muted px-1">VERIFICATION.md</code>
          : open the source in a real browser, capture each URL and the
          retrieval timestamp, work through the field-by-field
          checklist, and encode each fact via the{" "}
          <code className="rounded bg-muted px-1">verified(value, citation, notes)</code>{" "}
          call with the new citation added to{" "}
          <code className="rounded bg-muted px-1">data/citations.ts</code>. Build
          validation runs the integrity guard suite end-to-end before
          deploy; nothing without a citation ships.
        </p>
      </section>
    </ContentPageShell>
  );
}
