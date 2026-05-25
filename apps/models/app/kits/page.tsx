import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { WorkflowKitCard } from "@/components/kits/WorkflowKitCard";
import { WorkflowKitPolicyNote } from "@/components/kits/WorkflowKitPolicyNote";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { getWorkflowKits } from "@/lib/workflow-kits";

export const metadata: Metadata = buildMetadata({
  title: "Workflow kits for practical AI model evaluation",
  description:
    "Role-based workflow kits that sequence lessons, exercises, lab playbooks, evaluation prompt sets, and Markdown templates into a single work document. Developer, automation specialist, product, and governance kits — each exportable as Markdown via /api/kits/<slug>.",
  path: "/kits",
  keywords: [
    "ai model evaluation kit",
    "ai workflow kit",
    "developer model evaluation",
    "automation workflow testing",
    "product model selection",
    "governance review kit",
    "ai model decision evidence",
  ],
});

export default function KitsHubPage() {
  const kits = getWorkflowKits();
  return (
    <PageShell
      eyebrow="Kits"
      title="Workflow kits for practical AI model evaluation"
      intro="Follow a role-based pack of lessons, exercises, lab playbooks, prompt sets, templates, and evidence routes. Each kit ends with a Markdown work document you can export and share."
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Kits", href: "/kits" },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Kits", href: "/kits" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Workflow kits",
            url: `${siteConfig.url}/kits`,
            description:
              "Role-based workflow kits: developer, automation specialist, product, governance.",
            dateModified: siteConfig.buildDate,
            isPartOf: { "@type": "WebSite", url: siteConfig.url },
            hasPart: kits.map((k) => ({
              "@type": "HowTo",
              name: k.title,
              description: k.summary,
              totalTime: `PT${k.estimatedMinutes}M`,
              url: `${siteConfig.url}/kits/${k.slug}`,
            })),
          },
        ]}
      />

      <aside
        role="note"
        aria-label="What a workflow kit is"
        className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          What a workflow kit is.
        </p>
        <p>
          A workflow kit is a sequenced work document, not a course
          and not a wizard. It packages an audience entry point, a
          role-based learning path, the lessons and exercises that
          path depends on, the matching lab playbooks, the evaluation
          prompt sets, and the Markdown templates into one ordered
          walk-through. Every step opens an existing route — no
          parallel UI.
        </p>
      </aside>

      <section
        aria-label="Hero call to action"
        className="card-surface space-y-3 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Start here
        </p>
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link
              href="/kits/developer-model-evaluation"
              className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 font-medium text-primary hover:bg-primary/15"
            >
              Developer model evaluation kit
            </Link>
          </li>
          <li>
            <Link
              href="/kits/automation-workflow-testing"
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-foreground hover:border-primary/30"
            >
              Automation workflow testing kit
            </Link>
          </li>
          <li>
            <Link
              href="/learn/paths"
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-foreground hover:border-primary/30"
            >
              View all learning paths
            </Link>
          </li>
          <li>
            <Link
              href="/lab"
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-foreground hover:border-primary/30"
            >
              Open AI Usage Lab
            </Link>
          </li>
        </ul>
      </section>

      <section aria-label="Kits" className="space-y-3">
        <SectionHeader
          eyebrow="Workflow kits"
          title={`${kits.length} role-based kits`}
          description="Each kit produces a paste-ready Markdown work document plus the evidence artifacts the role needs."
          as="h2"
        />
        <ul className="grid gap-3 md:grid-cols-2">
          {kits.map((k) => (
            <li key={k.slug}>
              <WorkflowKitCard kit={k} />
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="What kits produce"
        className="card-surface space-y-3 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          What kits produce
        </p>
        <p className="text-muted-foreground">
          Every kit walks a sequenced path; every walk ends with
          paste-ready Markdown plus deterministic URLs. The artifacts
          differ by role, but the shape stays the same: open the
          route, capture the output, paste into the brief.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Hosted-provider mapping note",
            "Comparison URL from /compare/build",
            "Model evaluation plan (Markdown)",
            "Prompt test matrix (Markdown)",
            "Decision evidence brief (Markdown)",
            "Source freshness checklist",
            "Lifecycle review note",
            "Automation risk checklist",
            "External test plan",
          ].map((item) => (
            <li
              key={item}
              className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <WorkflowKitPolicyNote />

      <aside
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="Related routes"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Related routes
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <Link href="/start" className="text-primary hover:underline">
              /start
            </Link>{" "}
            — first-run onboarding; each role start page links
            straight to the matching kit.
          </li>
          <li>
            <Link
              href="/resources?resourceType=workflow-kit"
              className="text-primary hover:underline"
            >
              /resources?resourceType=workflow-kit
            </Link>{" "}
            — every workflow kit in the resource finder (filtered
            view, noindex).
          </li>
          <li>
            <Link
              href="/use-cases"
              className="text-primary hover:underline"
            >
              /use-cases
            </Link>{" "}
            — outcome-driven entry points that route into each kit.
          </li>
          <li>
            <Link href="/for" className="text-primary hover:underline">
              /for
            </Link>{" "}
            — audience entry points (each links to the matching kit).
          </li>
          <li>
            <Link
              href="/learn/paths"
              className="text-primary hover:underline"
            >
              /learn/paths
            </Link>{" "}
            — the role-based paths each kit wraps.
          </li>
          <li>
            <Link href="/lab" className="text-primary hover:underline">
              /lab
            </Link>{" "}
            — the testing playbooks the kits route through.
          </li>
          <li>
            <Link
              href="/lab/templates"
              className="text-primary hover:underline"
            >
              /lab/templates
            </Link>{" "}
            — the Markdown templates each kit fills in.
          </li>
          <li>
            <Link
              href="/lab/prompts"
              className="text-primary hover:underline"
            >
              /lab/prompts
            </Link>{" "}
            — the evaluation prompt sets the kits include.
          </li>
          <li>
            <Link
              href="/briefs/build"
              className="text-primary hover:underline"
            >
              /briefs/build
            </Link>{" "}
            — the decision brief the kits end at.
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
