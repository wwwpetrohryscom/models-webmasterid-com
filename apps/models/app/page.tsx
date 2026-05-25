import Link from "next/link";
import type { Metadata } from "next";
import { Hero } from "@/components/Hero";
import { DecisionWorkflow } from "@/components/DecisionWorkflow";
import { StatCard } from "@/components/StatCard";
import { DashboardCard } from "@/components/DashboardCard";
import { ModelBadge } from "@/components/ModelBadge";
import { ProviderLogo } from "@/components/ProviderLogo";
import { SectionHeader } from "@/components/SectionHeader";
import { JsonLd } from "@/components/JsonLd";
import { VerificationBadge } from "@/components/VerificationBadge";
import { VerifiedField } from "@/components/VerifiedField";
import { ContentStatCard } from "@/components/content/ContentStatCard";
import { AudienceCard } from "@/components/audience/AudienceCard";
import { siteConfig } from "@/lib/site-config";
import { getAudiences } from "@/lib/audiences";
import {
  buildMetadata,
  organizationJsonLd,
  softwareAppJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import { models, featuredModels, getModelBySlug } from "@/data/models";
import { providers, getProviderBySlug } from "@/data/providers";
import { benchmarks } from "@/data/benchmarks";
import { topComparisons } from "@/data/comparisons";
import { regions } from "@/data/regions";
import { pricing } from "@/data/pricing";
import { unknownLabel } from "@/lib/utils";
import { isVerified } from "@/lib/verified";

export const metadata: Metadata = buildMetadata({
  title: siteConfig.name,
  description: siteConfig.description,
  path: "/",
});

const trustItems = [
  {
    title: "Verified & Transparent",
    body: "Every metric is sourced and timestamped. When a value cannot be confirmed, we say so explicitly.",
  },
  {
    title: "Real-time Intelligence",
    body: "Model launches, pricing changes, and infrastructure shifts are tracked continuously rather than annually.",
  },
  {
    title: "Comprehensive Coverage",
    body: "From frontier providers to open-weights labs and inference platforms — one structured graph.",
  },
  {
    title: "Built for Builders",
    body: "Structured data for engineers shipping AI products, not headlines for newsletters.",
  },
  {
    title: "Actionable Insights",
    body: "Compare pricing, latency, regions, and benchmarks side-by-side without leaving the page.",
  },
];

export default function HomePage() {
  const audiences = getAudiences();
  return (
    <>
      <JsonLd
        data={[websiteJsonLd(), organizationJsonLd(), softwareAppJsonLd()]}
      />

      <Hero />

      {/* Core loop — Learn → Apply → Verify → Test */}
      <section
        aria-label="Learn, apply, verify, test"
        className="container-page mt-10"
      >
        <SectionHeader
          eyebrow="The core loop"
          title="Learn → Apply → Verify → Test"
          description="Four stages, all built on a verified-data backbone. Concept lessons explain each field; workflow workspaces produce the artifacts; sources anchor every claim; the AI Usage Lab teaches workload-specific testing before integration."
        />
        <ul className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              eyebrow: "Learn",
              title: "Learn concepts",
              body: "10 lessons on context, pricing references, hosted vs first-party, lifecycle, status, structured output, benchmark limits.",
              cta: { label: "Open /learn", href: "/learn" },
            },
            {
              eyebrow: "Apply",
              title: "Apply workflows",
              body: "Selection workspace, comparison builder, decision brief builder — each route produces a paste-ready artifact.",
              cta: { label: "Open /select", href: "/select" },
            },
            {
              eyebrow: "Verify",
              title: "Verify evidence",
              body: "Every claim links to a primary-source citation with a retrievedAt date. The reverification queue surfaces what is due for re-check.",
              cta: { label: "Open /sources", href: "/sources" },
            },
            {
              eyebrow: "Test",
              title: "Test behaviour",
              body: "AI Usage Lab — 6 playbooks, 3 templates, 6 evaluation prompt sets. Markdown exports with X-Robots-Tag: noindex.",
              cta: { label: "Open /lab", href: "/lab" },
            },
          ].map((card) => (
            <li key={card.title}>
              <Link
                href={card.cta.href}
                className="card-surface block h-full space-y-2 p-4 transition hover:border-primary/30 hover:shadow-elevated"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  {card.eyebrow}
                </p>
                <p className="text-base font-semibold text-foreground">
                  {card.title}
                </p>
                <p className="text-sm text-muted-foreground">{card.body}</p>
                <p className="text-xs font-medium text-primary">
                  {card.cta.label} →
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Start with a workflow kit */}
      <section
        aria-label="Start with a workflow kit"
        className="container-page mt-12"
      >
        <SectionHeader
          eyebrow="Kits"
          title="Start with a workflow kit"
          description="Role-based packs of lessons, exercises, lab playbooks, prompt sets, and Markdown templates — exportable as a single work document. Each kit ends with a paste-ready evidence brief plus the artifacts your role needs."
          cta={{ label: "All kits", href: "/kits" }}
        />
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              href: "/kits/developer-model-evaluation",
              title: "Developer model evaluation",
              detail:
                "Source-backed model evaluation plan before integration.",
            },
            {
              href: "/kits/automation-workflow-testing",
              title: "Automation workflow testing",
              detail:
                "Safe testing workflow for AI-powered automations.",
            },
            {
              href: "/kits/product-model-selection",
              title: "Product model selection",
              detail:
                "Turn a product use case into a reviewable selection artifact.",
            },
            {
              href: "/kits/governance-review",
              title: "Governance review",
              detail:
                "Source/freshness/lifecycle review package for internal discussions.",
            },
          ].map((card) => (
            <li key={card.href}>
              <Link
                href={card.href}
                className="card-surface block h-full p-4 transition hover:border-primary/30 hover:shadow-elevated"
              >
                <p className="text-sm font-semibold text-foreground">
                  {card.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {card.detail}
                </p>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Exportable as Markdown · no progress tracking.
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Choose your path — audience picker */}
      <section
        aria-label="Choose the path that matches your work"
        className="container-page mt-12"
      >
        <SectionHeader
          eyebrow="For"
          title="Choose the path that matches your work"
          description="Four audience entry points. Each opens a sequenced learning path, a matching lab playbook or template, a guided demo, and the workspaces that produce a paste-ready evidence brief."
          cta={{ label: "All audiences", href: "/for" }}
        />
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {audiences.map((a) => (
            <li key={a.slug}>
              <AudienceCard audience={a} />
            </li>
          ))}
        </ul>
      </section>

      {/* What you can produce here */}
      <section
        aria-label="What you can produce here"
        className="container-page mt-12"
      >
        <SectionHeader
          eyebrow="Evidence artifacts"
          title="See what you will produce"
          description="Every workspace ends with a concrete artifact — a URL, a Markdown export, or a structured checklist. Click any tile to see the working example or open the surface that produces it. No generated scores, no model rankings."
        />
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              href: "/examples/decision-brief",
              title: "Example decision brief",
              detail:
                "Worked example built from the same buildDecisionBrief() helper as the live builder.",
            },
            {
              href: "/lab/templates/model-evaluation-plan",
              title: "Model evaluation plan template",
              detail:
                "Paste-ready Markdown plan covering scope, test plan, observations, decision.",
            },
            {
              href: "/lab/templates/prompt-test-matrix",
              title: "Prompt test matrix template",
              detail:
                "Row-per-prompt scaffold for capturing per-candidate observations.",
            },
            {
              href: "/for",
              title: "Audience walkthroughs",
              detail:
                "Per-role artifact walkthroughs — open the surface, capture the output, paste into the brief.",
            },
          ].map((card) => (
            <li key={card.href}>
              <Link
                href={card.href}
                className="card-surface block h-full p-4 transition hover:border-primary/30 hover:shadow-elevated"
              >
                <p className="text-sm font-semibold text-foreground">
                  {card.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {card.detail}
                </p>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  See it →
                </p>
              </Link>
            </li>
          ))}
        </ul>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              href: "/select",
              title: "Model shortlist",
              detail:
                "A /select URL that opens the same source-backed shortlist for any teammate.",
            },
            {
              href: "/compare/build",
              title: "Side-by-side comparison",
              detail:
                "A /compare/build URL with up to four candidate models rendered against verified fields.",
            },
            {
              href: "/briefs/build",
              title: "Decision evidence brief",
              detail:
                "Markdown brief listing verified fields, data gaps, source trail, freshness, and hosted availability.",
            },
            {
              href: "/lab/templates/model-evaluation-plan",
              title: "Model evaluation plan",
              detail:
                "Paste-ready Markdown plan covering scope, test plan, observations, and decision sections.",
            },
            {
              href: "/lab/templates/prompt-test-matrix",
              title: "Prompt test matrix",
              detail:
                "Row-per-prompt scaffold for capturing per-candidate observations without collapsing to a score.",
            },
            {
              href: "/reverification",
              title: "Source freshness checklist",
              detail:
                "JSON or Markdown checklist of citations due for re-check, scoped per provider.",
            },
          ].map((card) => (
            <li key={card.href}>
              <Link
                href={card.href}
                className="card-surface block h-full p-4 transition hover:border-primary/30 hover:shadow-elevated"
              >
                <p className="text-sm font-semibold text-foreground">
                  {card.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {card.detail}
                </p>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Open the surface that produces this artifact →
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Differentiation — not another AI ranking site */}
      <section
        aria-label="Not another AI ranking site"
        className="container-page mt-12"
      >
        <SectionHeader
          eyebrow="Differentiation"
          title="Not another AI ranking site"
          description="This is a learning + evidence platform — not a leaderboard, not a news feed, not a prompt marketplace, not a live quote engine, not a certification authority."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="card-surface space-y-2 p-5 text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              This platform is
            </p>
            <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
              <li>
                <strong className="text-foreground">Learning-led</strong> —
                a curriculum that teaches how AI model fields behave,
                not a leaderboard.
              </li>
              <li>
                <strong className="text-foreground">Source-backed</strong>{" "}
                — every claim links to a primary-source citation with a
                retrievedAt date.
              </li>
              <li>
                <strong className="text-foreground">Workflow-oriented</strong>{" "}
                — selection, comparison, brief, and lab workspaces
                stitched together.
              </li>
              <li>
                <strong className="text-foreground">Evidence-producing</strong>{" "}
                — every walk ends with a paste-ready artifact a
                reviewer can read.
              </li>
            </ul>
          </article>
          <article className="card-surface space-y-2 p-5 text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              This platform is not
            </p>
            <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
              <li>An AI news feed or newsletter site.</li>
              <li>A prompt pack or prompt marketplace.</li>
              <li>A model leaderboard or scoring engine.</li>
              <li>A live pricing-quote engine or affiliate site.</li>
              <li>
                A compliance certification, regulatory sign-off, or
                vendor endorsement.
              </li>
            </ul>
            <p className="text-xs">
              Long-form positioning at{" "}
              <Link
                href="/docs/platform-positioning"
                className="text-primary hover:underline"
              >
                /docs/platform-positioning
              </Link>
              .
            </p>
          </article>
        </div>
      </section>

      {/* How to use this — workflow strip */}
      <section
        aria-label="How to use this"
        className="container-page mt-10"
      >
        <SectionHeader
          eyebrow="How to use this"
          title="A decision workflow, not a recommendation engine"
          description="Five server-rendered steps. Start with a use case, narrow a source-backed shortlist, inspect verified fields side by side, surface the data gaps, then export an evidence brief. WebmasterID Models supports the decision; the reader runs the workload."
          cta={{ label: "Read the full walkthrough", href: "/how-it-works" }}
        />
        <div className="mt-6">
          <DecisionWorkflow variant="card" />
        </div>
      </section>

      {/* Test before production */}
      <section
        aria-label="Test before production"
        className="container-page mt-12"
      >
        <SectionHeader
          eyebrow="Lab"
          title="Test before production"
          description="The AI Usage Lab extends Learn → Apply → Verify into Test. Six playbooks teach prompt testing, structured-output validation, long-context trials, multimodal trials, automation-risk reviews, and regression checks. Templates and playbooks are planning tools, never safety certifications."
          cta={{ label: "Open the lab", href: "/lab" }}
        />
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              href: "/lab/prompt-testing-basics",
              title: "Prompt testing basics",
              detail:
                "Minimum prompt-testing routine before integration. Beginner · 25 min.",
            },
            {
              href: "/lab/structured-output-testing",
              title: "Structured output testing",
              detail:
                "Validate JSON mode, structured output, and tool calls against your real schema.",
            },
            {
              href: "/lab/automation-workflow-testing",
              title: "Automation workflow testing",
              detail:
                "Test the model inside an automation loop before it runs unattended.",
            },
          ].map((card) => (
            <li key={card.href}>
              <Link
                href={card.href}
                className="card-surface block h-full p-4 transition hover:border-primary/30 hover:shadow-elevated"
              >
                <p className="text-sm font-semibold text-foreground">
                  {card.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {card.detail}
                </p>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Ends with a Markdown evidence brief · no scoring.
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Choose a learning path */}
      <section
        aria-label="Choose a learning path"
        className="container-page mt-12"
      >
        <SectionHeader
          eyebrow="Learn → Apply → Verify"
          title="Choose a learning path"
          description="AI usage learning platform powered by verified model intelligence. Pick the role-based path that matches your work and end with concrete evidence artifacts — shortlist URLs, comparison URLs, decision briefs, freshness checklists, test plans."
          cta={{ label: "All paths", href: "/learn/paths" }}
        />
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              href: "/learn/path/beginner",
              title: "Beginner",
              detail:
                "Newcomer to AI model selection. 3 readings + 4 exercises.",
            },
            {
              href: "/learn/path/developer",
              title: "Developer",
              detail:
                "Engineer preparing an integration. Hosted/host, structured output, testing.",
            },
            {
              href: "/learn/path/product-manager",
              title: "Product manager",
              detail:
                "Use case framing, pricing references, lifecycle, benchmark limits.",
            },
            {
              href: "/learn/path/governance",
              title: "Governance",
              detail:
                "Lifecycle, status, sources, freshness — defensible evidence trail.",
            },
            {
              href: "/learn/path/automation-specialist",
              title: "Automation specialist",
              detail:
                "Safe AI model use inside automations. Structured output + test plan.",
            },
          ].map((card) => (
            <li key={card.href}>
              <Link
                href={card.href}
                className="card-surface block h-full p-4 transition hover:border-primary/30 hover:shadow-elevated"
              >
                <p className="text-sm font-semibold text-foreground">
                  {card.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {card.detail}
                </p>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Lessons + exercises + workflows · no progress accounts.
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Who / What this is not */}
      <section
        aria-label="Who this is for and what it is not"
        className="container-page mt-12"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <article className="card-surface space-y-2 p-5 text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Who this is for
            </p>
            <p className="text-foreground">
              Engineers and technical buyers evaluating which AI model
              to test next.
            </p>
            <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
              <li>
                You need verified context windows, modality, lifecycle
                status, and pricing references in one place.
              </li>
              <li>
                You want explicit data gaps when a vendor does not
                publish a value, not invented numbers.
              </li>
              <li>
                You want a paste-ready evidence brief you can share
                with the rest of the team.
              </li>
              <li>
                You are comfortable doing the final workload-specific
                testing yourself.
              </li>
            </ul>
          </article>
          <article className="card-surface space-y-2 p-5 text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              What this catalogue is not
            </p>
            <p className="text-foreground">
              An evidence base — not a verdict generator.
            </p>
            <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
              <li>
                Not a model ranking. No winner is declared.
              </li>
              <li>
                Not a price-ranking engine. Pricing rows are
                source-backed references, not live quotes.
              </li>
              <li>
                Not a latency / throughput / uptime claim. Status
                observations are recorded; SLA assertions are not.
              </li>
              <li>
                Not a compliance certification. Verification means a
                primary source backed the value on the date recorded.
              </li>
            </ul>
          </article>
        </div>
      </section>

      {/* Try a guided workflow */}
      <section
        aria-label="Try a guided workflow"
        className="container-page mt-12"
      >
        <SectionHeader
          eyebrow="Demos"
          title="Try a guided workflow"
          description="Three pre-packaged route plans that walk the full use case → shortlist → compare → brief → sources workflow on real verified data. Navigation examples, not model recommendations."
          cta={{ label: "All demos", href: "/demos" }}
        />
        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            {
              href: "/demos/long-context-analysis",
              title: "Long-context analysis",
              detail:
                "Verified context window + prompt-size pricing tiers.",
            },
            {
              href: "/demos/hosted-inference",
              title: "Hosted inference",
              detail:
                "Hosted availability + per-platform pricing references.",
            },
            {
              href: "/demos/governance-review",
              title: "Governance review",
              detail:
                "Verification state + source freshness + reverification queue.",
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
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Walks five steps · ends at an example evidence brief.
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Stats strip */}
      <section
        aria-label="Coverage statistics"
        className="container-page mt-12"
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            label="Models tracked"
            value={String(models.length)}
            hint="seed dataset"
          />
          <StatCard
            label="Providers"
            value={String(providers.length)}
            hint="seed dataset"
          />
          <StatCard
            label="Benchmarks"
            value={String(benchmarks.length)}
            hint="seed dataset"
          />
          <StatCard
            label="Pricing entries"
            value={String(pricing.length)}
            hint="seed dataset"
          />
          <StatCard
            label="Regions monitored"
            value={String(regions.length)}
            hint="seed dataset"
          />
          <StatCard
            label="Avg API uptime"
            value={unknownLabel()}
            hint="not yet measured"
          />
        </div>
      </section>

      {/* Start with a use case */}
      <section
        aria-label="Start with a use case"
        className="container-page mt-12"
      >
        <SectionHeader
          eyebrow="Use cases"
          title="Start with a use case"
          description="Each use case names the verified fields a reader should weight. WebmasterID Models does not rank or recommend models — it surfaces source-backed signals."
          cta={{ label: "All use cases", href: "/use-cases" }}
        />
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              href: "/use-cases/long-context-analysis",
              title: "Long-context analysis",
              detail:
                "Verified context window, max output, pricing tier references.",
            },
            {
              href: "/use-cases/multimodal-input",
              title: "Multimodal input",
              detail:
                "Verified input modality channels — image, audio, video, text.",
            },
            {
              href: "/use-cases/hosted-inference",
              title: "Hosted inference",
              detail:
                "Hosted availability + hosted pricing references. Not creator pricing.",
            },
            {
              href: "/use-cases/governance-review",
              title: "Governance review",
              detail:
                "Verification status, source freshness, reverification queue.",
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

      {/* Tracked providers strip */}
      <section
        aria-label="Tracked providers"
        className="container-page mt-12"
      >
        <SectionHeader
          eyebrow="Tracked providers"
          title="Providers covered"
          description="Frontier labs and inference platforms in the catalogue. Logos are in-repo lettermarks pending review of each provider's official brand resources. WebmasterID Models is independent and not affiliated with any listed provider."
          cta={{ label: "All providers", href: "/providers" }}
        />
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {providers.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/providers/${p.slug}`}
                className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/30 hover:shadow-elevated"
              >
                <ProviderLogo slug={p.slug} name={p.name} size="lg" />
                <span className="text-xs font-medium text-foreground">
                  {p.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Source-backed intelligence + verified preview */}
      <section
        aria-label="How verification works"
        className="container-page mt-16 grid gap-4 lg:grid-cols-3"
      >
        <article className="card-surface p-6 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Source-backed intelligence
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            Primary sources only. Verification before rendering.
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Primary sources only:</strong>{" "}
              official vendor documentation, official pricing pages,
              regulatory filings, peer-reviewed papers, public datasets.
              Blogs, social posts, and AI-generated summaries are not
              primary sources.
            </li>
            <li>
              <strong className="text-foreground">Timestamped citations:</strong>{" "}
              every verified field carries a <code className="rounded bg-muted px-1 py-0.5 text-xs">sourceUrl</code>,{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">sourceName</code>,{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">sourceType</code>,
              and <code className="rounded bg-muted px-1 py-0.5 text-xs">retrievedAt</code>.
            </li>
            <li>
              <strong className="text-foreground">No fabricated metrics:</strong>{" "}
              unverified pricing, benchmark scores, latency, and uptime
              are surfaced through a single canonical unverified-data
              label — never substituted with estimates.
            </li>
            <li>
              <strong className="text-foreground">JSON-LD discipline:</strong>{" "}
              schema.org markup only emits fields backed by a citation.
              Search engines and AI surfaces never see unverified claims
              from this site.
            </li>
            <li>
              <strong className="text-foreground">Type-system guard:</strong>{" "}
              metric fields are typed{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">MaybeVerified&lt;T&gt;</code>{" "}
              — the build refuses to ship if a non-null metric lacks a
              citation.
            </li>
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            See{" "}
            <Link href="/docs" className="text-primary hover:underline">
              /docs
            </Link>{" "}
            for the verification workflow,{" "}
            <Link href="/coverage" className="text-primary hover:underline">
              /coverage
            </Link>{" "}
            for the per-provider audit log, and{" "}
            <Link href="/sources" className="text-primary hover:underline">
              /sources
            </Link>{" "}
            for the full citation index.
          </p>
        </article>

        {(() => {
          const opus4 = getModelBySlug("claude-opus-4");
          if (!opus4) return null;
          const verifiedFieldCount =
            (isVerified(opus4.apiIdentifiers) ? 1 : 0) +
            (isVerified(opus4.contextWindow) ? 1 : 0) +
            (isVerified(opus4.maxOutputTokens) ? 1 : 0) +
            (isVerified(opus4.modality) ? 1 : 0) +
            (isVerified(opus4.knowledgeCutoff) ? 1 : 0) +
            (isVerified(opus4.features) ? 1 : 0) +
            (isVerified(opus4.lifecycle) ? 1 : 0) +
            opus4.pricing.filter((t) => isVerified(t.amount)).length;
          return (
            <article className="card-surface p-6" aria-label="Verified preview: Claude Opus 4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Verified preview
              </p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">
                {opus4.name}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Gold-standard worked example for the verification workflow.
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Verified fields</dt>
                  <dd className="font-medium tabular-nums text-foreground">
                    {verifiedFieldCount}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Sources</dt>
                  <dd className="font-medium tabular-nums text-foreground">
                    {opus4.citations.length}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Context window</dt>
                  <dd className="font-medium text-foreground">
                    <VerifiedField
                      field={opus4.contextWindow}
                      format={(v) => `${v.toLocaleString("en-US")} tokens`}
                      label="context window"
                      inlineCitation={false}
                    />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Lifecycle</dt>
                  <dd className="font-medium text-foreground">
                    <VerifiedField
                      field={opus4.lifecycle}
                      format={(v) =>
                        v.retirementDate
                          ? `${v.status} (retires ${v.retirementDate})`
                          : v.status
                      }
                      label="lifecycle"
                      inlineCitation={false}
                    />
                  </dd>
                </div>
              </dl>
              <Link
                href={`/models/${opus4.slug}`}
                className="mt-4 inline-flex text-xs font-medium text-primary hover:underline"
              >
                View full record →
              </Link>
            </article>
          );
        })()}
      </section>

      {/* Recently verified */}
      <section
        aria-label="Recently verified"
        className="container-page mt-12"
      >
        <SectionHeader
          eyebrow="Verification queue"
          title="Recently verified"
          description="Latest models with primary-source citations on record. Each entry links to its full record where every metric is anchored to the documentation page it came from."
          cta={{ label: "All models", href: "/models" }}
        />
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {([
            "claude-opus-4-7",
            "gemini-2-5-pro",
            "deepseek-v4-pro",
          ] as const)
            .map((slug) => getModelBySlug(slug))
            .filter(
              (m): m is NonNullable<ReturnType<typeof getModelBySlug>> =>
                Boolean(m)
            )
            .map((m) => {
              const p = getProviderBySlug(m.providerSlug);
              const verifiedFieldCount =
                (isVerified(m.apiIdentifiers) ? 1 : 0) +
                (isVerified(m.contextWindow) ? 1 : 0) +
                (isVerified(m.maxOutputTokens) ? 1 : 0) +
                (isVerified(m.modality) ? 1 : 0) +
                (isVerified(m.knowledgeCutoff) ? 1 : 0) +
                (isVerified(m.features) ? 1 : 0) +
                (isVerified(m.lifecycle) ? 1 : 0) +
                m.pricing.filter((t) => isVerified(t.amount)).length;
              return (
                <li key={m.slug}>
                  <Link
                    href={`/models/${m.slug}`}
                    className="card-surface block p-5 transition hover:border-primary/30 hover:shadow-elevated"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {p?.name ?? "Unknown"}
                    </p>
                    <p className="mt-1 text-base font-semibold text-foreground">
                      {m.name}
                    </p>
                    <dl className="mt-3 space-y-1 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">
                          Verified fields
                        </dt>
                        <dd className="font-medium tabular-nums text-foreground">
                          {verifiedFieldCount}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">Sources</dt>
                        <dd className="font-medium tabular-nums text-foreground">
                          {m.citations.length}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">Last checked</dt>
                        <dd className="font-medium text-foreground">
                          {m.lastCheckedAt
                            ? m.lastCheckedAt.slice(0, 10)
                            : "—"}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-3 text-xs font-medium text-primary">
                      View record →
                    </p>
                  </Link>
                </li>
              );
            })}
        </ul>
      </section>

      {/* Dashboard cards */}
      <section
        aria-label="Latest intelligence"
        className="container-page mt-12 space-y-6"
      >
        <SectionHeader
          eyebrow="Live dashboards"
          title="Latest intelligence"
          description="Curated views of the AI model ecosystem. All values are tagged with verification status and last-checked timestamps."
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <DashboardCard
            title="Latest Models"
            description="Recently catalogued AI models"
            href="/models"
            cta="All models"
          >
            <ul className="space-y-2">
              {featuredModels.slice(0, 4).map((m) => {
                const p = getProviderBySlug(m.providerSlug);
                return (
                  <li key={m.slug}>
                    <ModelBadge
                      model={m}
                      providerName={p?.name ?? "Unknown"}
                    />
                  </li>
                );
              })}
            </ul>
          </DashboardCard>

          <DashboardCard
            title="Featured Comparisons"
            description="Side-by-side model breakdowns"
            href="/compare"
            cta="All comparisons"
          >
            <ul className="space-y-2">
              {topComparisons.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/compare/${c.slug}`}
                    className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-3 transition hover:border-primary/30 hover:shadow-elevated"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {c.name}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {c.description}
                      </p>
                    </div>
                    <VerificationBadge status={c.verificationStatus} />
                  </Link>
                </li>
              ))}
            </ul>
          </DashboardCard>

          <DashboardCard
            title="Benchmarks"
            description="Reasoning, coding, knowledge, math"
            href="/benchmarks"
            cta="All benchmarks"
          >
            <ul className="space-y-2">
              {benchmarks.slice(0, 4).map((b) => (
                <li
                  key={b.slug}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {b.name}
                    </p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {b.category}
                    </p>
                  </div>
                  <VerificationBadge status={b.verificationStatus} />
                </li>
              ))}
            </ul>
          </DashboardCard>

          <DashboardCard
            title="Providers"
            description="Frontier labs and inference platforms"
            href="/providers"
            cta="All providers"
          >
            <ul className="grid grid-cols-2 gap-2">
              {providers.slice(0, 6).map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/providers/${p.slug}`}
                    className="flex items-center gap-2 rounded-xl border border-border bg-card p-2.5 transition hover:border-primary/30"
                  >
                    <ProviderLogo slug={p.slug} name={p.name} size="sm" />
                    <span className="truncate text-sm font-medium text-foreground">
                      {p.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </DashboardCard>

          <DashboardCard
            title="API Pricing"
            description="Per-million-token rates"
            href="/pricing"
            cta="All pricing"
          >
            <ul className="space-y-2">
              {pricing.slice(0, 4).map((p) => (
                <li
                  key={p.slug}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {p.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      USD · per 1M tokens
                    </p>
                  </div>
                  <VerificationBadge status={p.verificationStatus} />
                </li>
              ))}
            </ul>
          </DashboardCard>

          <DashboardCard
            title="Regions"
            description="Inference availability map"
            href="/infrastructure"
            cta="View infrastructure"
          >
            <ul className="space-y-2">
              {regions.map((r) => (
                <li
                  key={r.slug}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {r.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.providersAvailable.length} providers tracked
                    </p>
                  </div>
                  <VerificationBadge status={r.verificationStatus} />
                </li>
              ))}
            </ul>
          </DashboardCard>
        </div>
      </section>

      {/* Verified coverage strip — derived from local data layer */}
      <section
        aria-label="Current verified coverage"
        className="container-page mt-16"
      >
        <SectionHeader
          eyebrow="Live counts"
          title="Current verified coverage"
          description="Derived from the typed local data layer at build time. Each card links to the hub that surfaces the underlying detail."
        />
        {(() => {
          const verifiedModels = models.filter(
            (m) => m.verificationStatus === "verified"
          ).length;
          const verifiedProviders = providers.filter(
            (p) => p.verificationStatus === "verified"
          ).length;
          const verifiedPricingRows = models.reduce(
            (n, m) =>
              n +
              m.pricing.filter(
                (t) => t.amount && t.amount.citation
              ).length,
            0
          );
          const sourceCitationCount = (() => {
            const seen = new Set<string>();
            for (const m of models)
              for (const c of m.citations) seen.add(c.url);
            return seen.size;
          })();
          return (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <ContentStatCard
                label="Verified models"
                value={verifiedModels}
                caption={`of ${models.length} tracked`}
                href="/models?verification=verified"
              />
              <ContentStatCard
                label="Verified providers"
                value={verifiedProviders}
                caption={`of ${providers.length} tracked`}
                href="/providers"
              />
              <ContentStatCard
                label="Verified pricing rows"
                value={verifiedPricingRows}
                caption="across catalogue"
                href="/pricing?status=verified"
              />
              <ContentStatCard
                label="Status observers"
                value={3}
                caption="2 vendor + 1 probe"
                href="/status"
              />
              <ContentStatCard
                label="Source citations"
                value={sourceCitationCount}
                caption="unique primary-source URLs"
                href="/sources"
              />
            </div>
          );
        })()}
      </section>

      {/* Useful content layer */}
      <section
        aria-label="Build with verified model infrastructure data"
        className="container-page mt-16"
      >
        <SectionHeader
          eyebrow="Methodology + reference"
          title="Build with verified model infrastructure data"
          description="Source-aware research guides and reference docs that go beyond the catalogue rows — how to read pricing, how status is monitored, how comparisons are constructed, and how verification works end-to-end."
          cta={{ label: "All research", href: "/research" }}
        />
        <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              href: "/compare",
              eyebrow: "Catalogue",
              title: "Compare verified models",
              body: "Two-sided verified comparisons of pricing, context, modality, and lifecycle — never a winner.",
            },
            {
              href: "/research/api-pricing-methodology",
              eyebrow: "Research guide",
              title: "Understand API pricing",
              body: "How input/output/cache/batch units differ across providers and why we keep them as separate rows.",
            },
            {
              href: "/status",
              eyebrow: "Catalogue",
              title: "Track provider status",
              body: "Vendor-reported observations and independent HTTP probes — kept strictly separate; no fabricated uptime.",
            },
            {
              href: "/sources",
              eyebrow: "Audit",
              title: "Review source coverage",
              body: "Every primary-source citation indexed by provider and source type.",
            },
            {
              href: "/research/source-verification-methodology",
              eyebrow: "Research guide",
              title: "Learn verification methodology",
              body: "VerifiedField, MaybeVerified, source allow-list, retrieval cadence, JSON-LD exclusion policy.",
            },
            {
              href: "/research/inference-infrastructure",
              eyebrow: "Research guide",
              title: "Explore infrastructure limits",
              body: "Regions, batching, caching, rate limits — fields we record, fields we leave open.",
            },
          ].map((card) => (
            <li key={card.href}>
              <Link
                href={card.href}
                className="card-surface block h-full p-5 transition hover:border-primary/30 hover:shadow-elevated"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {card.eyebrow}
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">
                  {card.title}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {card.body}
                </p>
                <p className="mt-3 text-xs font-medium text-primary">
                  Read →
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Trust / value strip */}
      <section
        aria-label="Why WebmasterID Models"
        className="container-page mt-16"
      >
        <SectionHeader
          eyebrow="Operating principles"
          title="Why WebmasterID Models"
        />
        <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {trustItems.map((t) => (
            <li key={t.title} className="card-surface p-5">
              <p className="text-sm font-semibold text-foreground">{t.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{t.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Explanatory crawlable section */}
      <section
        aria-labelledby="what-is-section"
        className="container-page mt-16"
      >
        <article className="card-surface p-6 md:p-10">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              About the platform
            </p>
            <h2
              id="what-is-section"
              className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
            >
              What is WebmasterID Models?
            </h2>
          </header>

          <div className="prose-content mt-5 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-foreground">WebmasterID Models</strong>{" "}
              is the AI model infrastructure intelligence layer of the{" "}
              <strong className="text-foreground">WebmasterID</strong>{" "}
              ecosystem. It is a structured intelligence platform focused on
              AI models, the providers behind them, the benchmarks that measure
              them, the pricing that constrains them, and the inference
              infrastructure that runs them. The goal is not to publish
              headlines about AI — the goal is to maintain a verified,
              timestamped, comparable view of the entire AI model stack so that
              engineers, operators, and decision-makers can reason about it
              like any other piece of critical infrastructure.
            </p>
            <p>
              The platform is built for{" "}
              <strong className="text-foreground">
                builders shipping production AI systems
              </strong>
              : engineering teams choosing between frontier APIs, platform
              teams evaluating self-hosted open-weights models, infra teams
              monitoring uptime and regional availability, and product leaders
              comparing total cost of ownership across providers. It is also
              useful for researchers and analysts who need a clean, structured
              entity graph of models, providers, and benchmarks rather than a
              scrape of yesterday's blog posts.
            </p>
            <p>
              Model infrastructure intelligence matters because the AI model
              ecosystem is now operating at the same cadence as cloud
              infrastructure. Prices change weekly, new models launch monthly,
              context windows shift, regions come online, and benchmark
              leadership flips between vendors. Treating that landscape as
              an ad-hoc collection of marketing pages is no longer viable for
              teams whose products depend on choosing the right model and
              provider. WebmasterID Models exists to give that landscape a
              spine: stable identifiers, semantic linking between models,
              providers, pricing, and benchmarks, and a clear separation
              between verified data and unverified claims.
            </p>
            <p>
              This is deliberately not an{" "}
              <strong className="text-foreground">AI news site</strong> and not
              an <strong className="text-foreground">AI tools directory</strong>.
              News sites optimise for novelty; directories optimise for
              affiliate traffic. Neither produces a structured graph you can
              build on. WebmasterID Models is closer to an observability and
              intelligence layer: comparable rows of models, providers,
              benchmarks, prices, regions, and statuses, each with verification
              metadata. The output is data, not opinion.
            </p>
            <p>
              The platform's focus areas are deliberately narrow:{" "}
              <strong className="text-foreground">verified models</strong>{" "}
              with stable slugs and provider attribution, the{" "}
              <strong className="text-foreground">providers</strong> who train
              and serve them,{" "}
              <strong className="text-foreground">API pricing</strong> per unit
              of work, <strong className="text-foreground">benchmarks</strong>{" "}
              spanning reasoning, coding, math, knowledge, and multimodality,{" "}
              <strong className="text-foreground">
                inference infrastructure
              </strong>{" "}
              including regions and latency, real{" "}
              <strong className="text-foreground">status and uptime</strong>{" "}
              signals, and{" "}
              <strong className="text-foreground">side-by-side comparisons</strong>{" "}
              that make tradeoffs explicit rather than hidden.
            </p>
            <p>
              Because the underlying data changes so quickly, citations,
              timestamps, and data freshness are first-class concerns.
              Every entity records when it was last checked and when it was
              last updated; values that are unknown or not yet verified are
              surfaced through a single canonical unverified-data label
              rather than invented. That discipline is what turns a content
              site into a reliable intelligence layer, and it is what
              WebmasterID Models is ultimately optimising for.
            </p>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Canonical URL:{" "}
            <Link
              href={siteConfig.url}
              className="underline-offset-2 hover:underline"
            >
              {siteConfig.url}
            </Link>
          </p>
        </article>
      </section>
    </>
  );
}
