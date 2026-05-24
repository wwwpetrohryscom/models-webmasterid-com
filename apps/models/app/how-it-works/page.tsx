import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { DecisionWorkflow } from "@/components/DecisionWorkflow";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { getContentPage } from "@/lib/content";

const SLUG = "/how-it-works";

export const metadata: Metadata = (() => {
  const page = getContentPage(SLUG)!;
  return buildMetadata({
    title: page.title,
    description: page.description,
    path: page.slug,
    keywords: page.keywords,
  });
})();

export default function HowItWorksPage() {
  const page = getContentPage(SLUG)!;
  return (
    <PageShell
      eyebrow="Walkthrough"
      title={page.title}
      intro={page.description}
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "How it works", href: SLUG },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "How it works", href: SLUG },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "TechArticle",
            name: page.title,
            url: `${siteConfig.url}${SLUG}`,
            description: page.description,
            dateModified: siteConfig.buildDate,
            isPartOf: { "@type": "WebSite", url: siteConfig.url },
          },
        ]}
      />

      <DecisionWorkflow variant="card" />

      <section
        aria-label="What this is and is not"
        className="grid gap-4 md:grid-cols-2"
      >
        <article className="card-surface space-y-2 p-5 text-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            What this catalogue is
          </p>
          <p className="text-foreground">
            A source-backed evidence base for AI model selection.
          </p>
          <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
            <li>
              Verified context windows, modality channels, lifecycle
              status, first-party + hosted pricing references, and
              source freshness — every value tied to a primary-source
              citation.
            </li>
            <li>
              Explicit data gaps where the vendor does not publish.
              Unknown values stay null, not invented.
            </li>
            <li>
              A small server-rendered workspace
              (select → compare → brief) that helps a reader narrow
              candidates without choosing for them.
            </li>
          </ul>
        </article>
        <article className="card-surface space-y-2 p-5 text-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            What it is not
          </p>
          <p className="text-foreground">
            An evidence base, not a verdict generator.
          </p>
          <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
            <li>
              No model rankings, no winner declarations, no
              recommendations.
            </li>
            <li>
              No price ranking. Pricing rows are source-backed
              references with freshness chips, never live quotes.
            </li>
            <li>
              No fabricated latency, throughput, or uptime. Status
              observations are recorded; SLA assertions are not.
            </li>
            <li>
              No compliance certification. Verified means a primary
              source backed the value on the date recorded.
            </li>
          </ul>
        </article>
      </section>

      <section aria-label="Step 1 — use case" className="space-y-3">
        <SectionHeader
          eyebrow="Step 1"
          title="Pick a use case to weight the right fields"
          description="Filters only mean something inside a use case. Long-context analysis weights context window + pricing; multimodal weights the verified modality channel list; hosted inference weights availability + hosted pricing; governance weights verification status + source freshness."
          cta={{ label: "Open use cases", href: "/use-cases" }}
          as="h2"
        />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              href: "/use-cases/long-context-analysis",
              title: "Long-context analysis",
              detail: "≥200k-token workloads.",
            },
            {
              href: "/use-cases/multimodal-input",
              title: "Multimodal input",
              detail: "Verified image/audio/video channels.",
            },
            {
              href: "/use-cases/hosted-inference",
              title: "Hosted inference",
              detail: "Groq, Together, third-party hosting.",
            },
            {
              href: "/use-cases/governance-review",
              title: "Governance review",
              detail: "Inventory + source-backed due diligence.",
            },
          ].map((card) => (
            <li key={card.href}>
              <Link
                href={card.href}
                className="card-surface block p-4 transition hover:border-primary/30 hover:shadow-elevated"
              >
                <p className="text-sm font-semibold text-foreground">
                  {card.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {card.detail}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Step 2 — shortlist" className="space-y-3">
        <SectionHeader
          eyebrow="Step 2"
          title="Build a source-backed shortlist"
          description="The selection workspace at /select renders candidate models in deterministic shortlist order — verified field count → active lifecycle → source count → name. There is no score, no rank function, no opinion."
          cta={{ label: "Open selection workspace", href: "/select" }}
          as="h2"
        />
        <p className="text-sm text-muted-foreground">
          Use-case filter narrows the candidate set; provider,
          lifecycle, min-context, modality, pricing coverage, hosted
          availability, verification status, and freshness filters
          tighten it further. Every filtered URL is{" "}
          <code className="rounded bg-muted px-1">noindex, follow</code>
          ; the base{" "}
          <Link href="/select" className="text-primary hover:underline">
            /select
          </Link>{" "}
          page stays indexable.
        </p>
      </section>

      <section
        aria-label="Step 3 — comparison builder"
        className="space-y-3"
      >
        <SectionHeader
          eyebrow="Step 3"
          title="Compare verified fields side by side"
          description="The comparison builder at /compare/build renders 2–4 selected models against verified fields. No derived metrics, no deltas, no winner. Unknown values render the canonical unverified-data label rather than inventing numbers."
          cta={{
            label: "Open comparison builder",
            href: "/compare/build",
          }}
          as="h2"
        />
        <p className="text-sm text-muted-foreground">
          Pre-seed the builder from a use case (
          <Link
            href="/compare/build?useCase=long-context-analysis"
            className="text-primary hover:underline"
          >
            long-context
          </Link>{" "}
          ·{" "}
          <Link
            href="/compare/build?useCase=hosted-inference"
            className="text-primary hover:underline"
          >
            hosted inference
          </Link>{" "}
          ·{" "}
          <Link
            href="/compare/build?useCase=governance-review"
            className="text-primary hover:underline"
          >
            governance review
          </Link>
          ) or pick models manually. Curated comparison pages under{" "}
          <Link href="/compare" className="text-primary hover:underline">
            /compare
          </Link>{" "}
          follow a higher editorial bar (two-sided verified before
          indexing).
        </p>
      </section>

      <section aria-label="Step 4 — gaps + freshness" className="space-y-3">
        <SectionHeader
          eyebrow="Step 4"
          title="Inspect data gaps and source freshness"
          description="A field marked unverified means the vendor does not publish it (or automated retrieval is blocked) — not that the value is unknowable. The catalogue refuses to guess. Freshness states (fresh / review due / stale / blocked / unknown) are computed deterministically against the build date."
          as="h2"
        />
        <ul className="grid gap-3 sm:grid-cols-3">
          <li>
            <Link
              href="/coverage"
              className="card-surface block p-4 transition hover:border-primary/30 hover:shadow-elevated"
            >
              <p className="text-sm font-semibold text-foreground">
                /coverage
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Verified breadth across every entity domain. Per-domain
                health matrix.
              </p>
            </Link>
          </li>
          <li>
            <Link
              href="/sources"
              className="card-surface block p-4 transition hover:border-primary/30 hover:shadow-elevated"
            >
              <p className="text-sm font-semibold text-foreground">
                /sources
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Every primary-source citation with retrievedAt + a
                freshness chip per row.
              </p>
            </Link>
          </li>
          <li>
            <Link
              href="/reverification"
              className="card-surface block p-4 transition hover:border-primary/30 hover:shadow-elevated"
            >
              <p className="text-sm font-semibold text-foreground">
                /reverification
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Manual review queue for records due for re-check. No
                auto-updates.
              </p>
            </Link>
          </li>
        </ul>
      </section>

      <section
        aria-label="Step 5 — evidence brief"
        className="space-y-3"
      >
        <SectionHeader
          eyebrow="Step 5"
          title="Export a paste-ready evidence brief"
          description="The decision-brief builder at /briefs/build renders verified evidence, explicit data gaps, source trail, freshness notes, hosted availability, and a checklist of external tests for 2–4 selected models. Markdown by default; JSON via ?format=json. The brief is evidence, not a recommendation."
          cta={{
            label: "Open decision-brief builder",
            href: "/briefs/build",
          }}
          as="h2"
        />
        <p className="text-sm text-muted-foreground">
          Same query shape as the comparison builder. The brief sets{" "}
          <code className="rounded bg-muted px-1">X-Robots-Tag: noindex</code>{" "}
          on the export endpoint — generated briefs are team
          artifacts, not indexable pages. The export endpoint is{" "}
          <code className="rounded bg-muted px-1">
            /api/briefs/decision
          </code>
          .
        </p>
      </section>

      <section
        aria-label="Decide what to test externally"
        className="card-surface space-y-2 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Then — decide what to test externally
        </p>
        <p className="text-foreground">
          The catalogue stops at verified fields. Real selection
          requires workload-specific testing in your own environment.
        </p>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          <li>Run task-specific prompt tests against your finalists.</li>
          <li>Verify request latency from your target deployment region.</li>
          <li>Check rate limits in the provider account against your load.</li>
          <li>
            Validate per-token cost against the vendor&apos;s current
            pricing page — references are not live quotes.
          </li>
          <li>
            Confirm compliance / security requirements against your
            organisation&apos;s controls.
          </li>
        </ul>
      </section>

      <section aria-label="Try this workflow" className="space-y-3">
        <SectionHeader
          eyebrow="Try this workflow"
          title="Guided demos and an example brief"
          description="Three pre-built route plans walk the five steps on real verified data. The example decision brief shows what the export looks like without forcing you to build one."
          cta={{ label: "Open all demos", href: "/demos" }}
          as="h2"
        />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <li>
            <Link
              href="/demos/long-context-analysis"
              className="card-surface block p-4 transition hover:border-primary/30 hover:shadow-elevated"
            >
              <p className="text-sm font-semibold text-foreground">
                Long-context demo
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Walks context window + prompt-size pricing tiers.
              </p>
            </Link>
          </li>
          <li>
            <Link
              href="/demos/hosted-inference"
              className="card-surface block p-4 transition hover:border-primary/30 hover:shadow-elevated"
            >
              <p className="text-sm font-semibold text-foreground">
                Hosted inference demo
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Hosted availability + platform pricing references.
              </p>
            </Link>
          </li>
          <li>
            <Link
              href="/demos/governance-review"
              className="card-surface block p-4 transition hover:border-primary/30 hover:shadow-elevated"
            >
              <p className="text-sm font-semibold text-foreground">
                Governance demo
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Verification state + freshness + reverification.
              </p>
            </Link>
          </li>
          <li>
            <Link
              href="/examples/decision-brief"
              className="card-surface block p-4 transition hover:border-primary/30 hover:shadow-elevated"
            >
              <p className="text-sm font-semibold text-foreground">
                Example brief
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Pre-built evidence pack — Markdown + JSON exports
                live.
              </p>
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
              href="/docs/decision-workflow"
              className="text-primary hover:underline"
            >
              /docs/decision-workflow
            </Link>{" "}
            — the no-ranking policy in long form.
          </li>
          <li>
            <Link
              href="/docs/decision-briefs"
              className="text-primary hover:underline"
            >
              /docs/decision-briefs
            </Link>{" "}
            — evidence vs recommendation.
          </li>
          <li>
            <Link
              href="/research/model-selection"
              className="text-primary hover:underline"
            >
              /research/model-selection
            </Link>{" "}
            — methodology behind the verified-field workflow.
          </li>
          <li>
            <Link
              href="/research/source-verification-methodology"
              className="text-primary hover:underline"
            >
              /research/source-verification-methodology
            </Link>
          </li>
          <li>
            <Link
              href="/research/api-pricing-methodology"
              className="text-primary hover:underline"
            >
              /research/api-pricing-methodology
            </Link>{" "}
            — references-not-quotes + no-price-ranking policy.
          </li>
          <li>
            <Link
              href="/intelligence"
              className="text-primary hover:underline"
            >
              /intelligence
            </Link>{" "}
            — operator workspace overview.
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
