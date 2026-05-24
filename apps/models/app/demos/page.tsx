import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { DecisionWorkflow } from "@/components/DecisionWorkflow";
import { DemoRouteCard } from "@/components/demo/DemoRouteCard";
import { WorkflowPreviewPanel } from "@/components/demo/WorkflowPreviewPanel";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { getGuidedDemos } from "@/lib/guided-demos";

export const metadata: Metadata = buildMetadata({
  title: "Guided product demos",
  description:
    "Follow source-backed workflows that show how use cases, shortlists, comparisons, evidence briefs, sources, and freshness fit together on WebmasterID Models. Navigation examples, not model recommendations.",
  path: "/demos",
});

export default function DemosHubPage() {
  const demos = getGuidedDemos();
  const showcaseDemo = demos[0];

  return (
    <PageShell
      eyebrow="Demos"
      title="Guided product demos"
      intro="Follow source-backed workflows that show how use cases, shortlists, comparisons, evidence briefs, sources, and freshness fit together. These demos are navigation examples, not model recommendations."
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Demos", href: "/demos" },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Demos", href: "/demos" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Guided product demos",
            url: `${siteConfig.url}/demos`,
            description:
              "Guided workflow demos for WebmasterID Models.",
            dateModified: siteConfig.buildDate,
            isPartOf: { "@type": "WebSite", url: siteConfig.url },
          },
        ]}
      />

      <aside
        role="note"
        aria-label="Pick the demo that matches your role"
        className="card-surface space-y-1 p-5 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          Pick the demo that matches your role.
        </p>
        <p>
          The <Link href="/for" className="text-primary hover:underline">/for</Link>{" "}
          hub recommends a specific demo per audience — developers,
          product teams, automation specialists, governance teams —
          alongside the matching learning path and lab playbook.
        </p>
      </aside>

      <aside
        role="note"
        aria-label="Demo policy"
        className="card-surface space-y-2 p-4 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          Navigation examples, not model recommendations.
        </p>
        <p>
          Each demo is a predefined route plan that walks the same
          five-step decision workflow used everywhere else on the
          site (use case → shortlist → compare → brief → sources).
          No demo declares a winner, ranks by price, asserts
          latency / throughput / uptime, or certifies compliance.
          The visitor follows the route; the catalogue surfaces
          verified fields and explicit data gaps along the way.
        </p>
        <p className="text-xs">
          New to the concepts the demos walk through? Start at{" "}
          <Link
            href="/learn"
            className="text-primary hover:underline"
          >
            /learn
          </Link>{" "}
          or pick a role-based path:{" "}
          <Link
            href="/learn/path/beginner"
            className="text-primary hover:underline"
          >
            Beginner
          </Link>{" "}
          ·{" "}
          <Link
            href="/learn/path/developer"
            className="text-primary hover:underline"
          >
            Developer
          </Link>{" "}
          ·{" "}
          <Link
            href="/learn/path/automation-specialist"
            className="text-primary hover:underline"
          >
            Automation specialist
          </Link>
          .
        </p>
      </aside>

      <DecisionWorkflow variant="card" />

      <section aria-label="Demo cards" className="space-y-3">
        <SectionHeader
          eyebrow="Pick a demo"
          title="Three guided workflows"
          description="Each demo loads the same verified data layer the rest of the site uses — the demo only changes which fields you walk through first."
          as="h2"
        />
        <ul className="grid gap-3 lg:grid-cols-3">
          {demos.map((demo) => (
            <li key={demo.slug}>
              <DemoRouteCard demo={demo} />
            </li>
          ))}
        </ul>
      </section>

      {showcaseDemo ? (
        <section
          aria-label="Visual proof"
          className="space-y-3"
        >
          <SectionHeader
            eyebrow="Visual proof"
            title="What the workflow produces"
            description="The panel below renders the five steps for the long-context-analysis demo, with every tile linking to the live surface the demo walks through. The data comes straight from the typed local data layer — no fabricated screenshots."
            as="h2"
          />
          <WorkflowPreviewPanel demo={showcaseDemo} />
        </section>
      ) : null}

      <section
        aria-label="Why these demos exist"
        className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Why these demos exist
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            Show the workflow end to end without forcing a visitor
            to discover every URL on their own.
          </li>
          <li>
            Demonstrate the verified-field approach with real model
            records, real source citations, and real freshness
            states.
          </li>
          <li>
            Surface explicit data gaps so the reader can see what
            the catalogue does <em>not</em> know — and where to go
            to confirm a value externally.
          </li>
          <li>
            Make the no-ranking / no-recommendation policy obvious.
            The demos walk evidence; they do not point at "the right
            model".
          </li>
        </ul>
      </section>

      <section
        aria-label="After the demo, complete an exercise"
        className="card-surface space-y-3 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          After the demo, complete an exercise
        </p>
        <p className="text-muted-foreground">
          Demos walk the workflow; exercises ask you to produce the
          artifact. Pair them in either order. When the artifact is
          ready, run the matching{" "}
          <Link href="/lab" className="text-primary hover:underline">
            lab playbook
          </Link>{" "}
          and an{" "}
          <Link
            href="/lab/prompts"
            className="text-primary hover:underline"
          >
            evaluation prompt set
          </Link>{" "}
          before integration.
        </p>
        <ul className="grid gap-2 sm:grid-cols-3">
          <li>
            <Link
              href="/learn/exercises/build-first-shortlist"
              className="block rounded-lg border border-border bg-card p-3 transition hover:border-primary/30"
            >
              <p className="text-sm font-semibold text-foreground">
                Build first shortlist →
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Pairs with the long-context-analysis demo.
              </p>
            </Link>
          </li>
          <li>
            <Link
              href="/learn/exercises/map-hosted-provider"
              className="block rounded-lg border border-border bg-card p-3 transition hover:border-primary/30"
            >
              <p className="text-sm font-semibold text-foreground">
                Map hosted provider →
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Pairs with the hosted-inference demo.
              </p>
            </Link>
          </li>
          <li>
            <Link
              href="/learn/exercises/check-source-freshness"
              className="block rounded-lg border border-border bg-card p-3 transition hover:border-primary/30"
            >
              <p className="text-sm font-semibold text-foreground">
                Check source freshness →
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Pairs with the governance-review demo.
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
              href="/how-it-works"
              className="text-primary hover:underline"
            >
              /how-it-works
            </Link>{" "}
            — the same workflow without the demo framing.
          </li>
          <li>
            <Link
              href="/examples/decision-brief"
              className="text-primary hover:underline"
            >
              /examples/decision-brief
            </Link>{" "}
            — a single pre-built evidence brief for inspection.
          </li>
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
