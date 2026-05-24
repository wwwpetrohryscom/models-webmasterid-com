import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { LabPlaybookCard } from "@/components/lab/LabPlaybookCard";
import { LabTemplateCard } from "@/components/lab/LabTemplateCard";
import { LabPolicyNote } from "@/components/lab/LabPolicyNote";
import { LabWorkflowStrip } from "@/components/lab/LabWorkflowStrip";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import {
  getLabPlaybooks,
  getLabTemplates,
} from "@/lib/lab-playbooks";

export const metadata: Metadata = buildMetadata({
  title: "AI Usage Lab",
  description:
    "Practical playbooks for testing AI models before production use — prompt tests, structured-output checks, long-context trials, multimodal trials, automation-risk reviews, and regression checks. Paste-ready Markdown templates included. Templates and playbooks are planning tools, not safety guarantees.",
  path: "/lab",
  keywords: [
    "ai model testing playbook",
    "prompt testing recipe",
    "structured output testing",
    "long context testing",
    "automation risk review",
    "model regression test",
    "ai evaluation template",
  ],
});

export default function LabHubPage() {
  const playbooks = getLabPlaybooks();
  const templates = getLabTemplates();

  return (
    <PageShell
      eyebrow="Lab"
      title="AI Usage Lab"
      intro="Practical playbooks for testing AI models before production use — prompt tests, structured-output checks, long-context trials, multimodal trials, automation-risk reviews, and regression checks. Paste-ready Markdown templates are included. Learn → Apply → Verify → Test."
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Lab", href: "/lab" },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Lab", href: "/lab" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "AI Usage Lab",
            url: `${siteConfig.url}/lab`,
            description:
              "AI model testing playbooks + paste-ready evaluation templates. Planning tools, not safety certifications.",
            dateModified: siteConfig.buildDate,
            isPartOf: { "@type": "WebSite", url: siteConfig.url },
            hasPart: [
              ...playbooks.map((p) => ({
                "@type": "HowTo",
                name: p.title,
                description: p.summary,
                totalTime: `PT${p.estimatedMinutes}M`,
                url: `${siteConfig.url}/lab/${p.slug}`,
              })),
              ...templates.map((t) => ({
                "@type": "CreativeWork",
                name: t.title,
                description: t.summary,
                url: `${siteConfig.url}/lab/templates/${t.slug}`,
                encodingFormat: "text/markdown",
              })),
            ],
          },
        ]}
      />

      <section
        aria-label="Hero call to action"
        className="card-surface space-y-4 p-5 sm:p-6"
      >
        <p className="text-sm text-muted-foreground">
          The lab extends the curriculum from Learn → Apply → Verify
          into <strong className="text-foreground">Test</strong>. Each
          playbook is a testing recipe you run yourself before
          integrating a model; each template is a paste-ready Markdown
          planning document you adapt to your workload.
        </p>
        <ul className="flex flex-wrap gap-2 text-sm">
          <li>
            <Link
              href="/lab/prompt-testing-basics"
              className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 font-medium text-primary hover:bg-primary/15"
            >
              Start prompt testing basics
            </Link>
          </li>
          <li>
            <Link
              href="/lab/templates"
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-foreground hover:border-primary/30"
            >
              View templates
            </Link>
          </li>
          <li>
            <Link
              href="/learn/path/developer"
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-foreground hover:border-primary/30"
            >
              Continue developer path
            </Link>
          </li>
          <li>
            <Link
              href="/briefs/build"
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-foreground hover:border-primary/30"
            >
              Generate evidence brief
            </Link>
          </li>
        </ul>
      </section>

      <aside
        role="note"
        aria-label="Use the lab with a role path"
        className="card-surface space-y-1 p-5 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          Use the lab with a role path.
        </p>
        <p>
          The <Link href="/for" className="text-primary hover:underline">/for</Link>{" "}
          hub matches each audience to the right playbook + template +
          prompt set. Developers, product teams, automation
          specialists, and governance teams each get a sequenced
          entry.
        </p>
      </aside>

      <LabWorkflowStrip />

      <section aria-label="Playbooks" className="space-y-3">
        <SectionHeader
          eyebrow="Playbooks"
          title={`${playbooks.length} testing playbooks`}
          description="Each playbook walks one testing dimension — prompt behaviour, structured output, long-context, multimodal, automation, regression — and ends with a Markdown evidence brief you can attach to /briefs/build."
          as="h2"
        />
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {playbooks.map((p) => (
            <li key={p.slug}>
              <LabPlaybookCard playbook={p} />
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Evaluation prompt library"
        className="space-y-3"
      >
        <SectionHeader
          eyebrow="Prompts"
          title="Evaluation prompt library"
          description="Six prompt sets — summarisation, structured extraction, long-context recall, instruction following, refusal boundary, automation robustness. Evaluation inputs you run in your own harness, not production prompts."
          cta={{ label: "All prompt sets", href: "/lab/prompts" }}
          as="h2"
        />
        <ul className="grid gap-3 md:grid-cols-3">
          {[
            {
              href: "/lab/prompts/summarization-quality",
              title: "Summarization quality",
              detail: "Beginner · 20 min · faithful summarisation.",
            },
            {
              href: "/lab/prompts/structured-extraction",
              title: "Structured extraction",
              detail: "Intermediate · 25 min · schema-conformant extraction.",
            },
            {
              href: "/lab/prompts/automation-robustness",
              title: "Automation robustness",
              detail:
                "Intermediate · 25 min · contract adherence in automations.",
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
        <p className="text-xs text-muted-foreground">
          New here? Start at{" "}
          <Link
            href="/lab/prompt-testing-basics"
            className="text-primary hover:underline"
          >
            /lab/prompt-testing-basics
          </Link>{" "}
          or read the{" "}
          <Link
            href="/lab/evaluation"
            className="text-primary hover:underline"
          >
            evaluation guide
          </Link>
          .
        </p>
      </section>

      <section aria-label="Templates" className="space-y-3">
        <SectionHeader
          eyebrow="Templates"
          title={`${templates.length} paste-ready templates`}
          description="Generic Markdown planning documents you adapt per workload. Every template is exportable via /api/lab/templates/<slug>."
          cta={{ label: "All templates", href: "/lab/templates" }}
          as="h2"
        />
        <ul className="grid gap-3 md:grid-cols-3">
          {templates.map((t) => (
            <li key={t.slug}>
              <LabTemplateCard template={t} />
            </li>
          ))}
        </ul>
      </section>

      <LabPolicyNote />

      <aside
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="Related routes"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Related routes
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <Link href="/learn" className="text-primary hover:underline">
              /learn
            </Link>{" "}
            — concept lessons (Learn step).
          </li>
          <li>
            <Link
              href="/learn/exercises"
              className="text-primary hover:underline"
            >
              /learn/exercises
            </Link>{" "}
            — practical exercises (Apply step).
          </li>
          <li>
            <Link href="/sources" className="text-primary hover:underline">
              /sources
            </Link>{" "}
            — citation registry (Verify step).
          </li>
          <li>
            <Link
              href="/briefs/build"
              className="text-primary hover:underline"
            >
              /briefs/build
            </Link>{" "}
            — paste the lab's evidence brief into the decision brief
            builder.
          </li>
          <li>
            <Link
              href="/reverification"
              className="text-primary hover:underline"
            >
              /reverification
            </Link>{" "}
            — sources due for re-check during regression suites.
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
