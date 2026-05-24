import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { PromptSetCard } from "@/components/lab/PromptSetCard";
import { PromptPolicyNote } from "@/components/lab/PromptPolicyNote";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { getEvaluationPromptSets } from "@/lib/evaluation-prompts";

export const metadata: Metadata = buildMetadata({
  title: "Evaluation prompt library",
  description:
    "Prompt sets for testing model behaviour before production use — summarisation, structured extraction, long-context recall, instruction following, refusal boundary, and automation robustness. Evaluation inputs, not production prompts. No live model calls, no benchmarks, no rankings.",
  path: "/lab/prompts",
  keywords: [
    "evaluation prompt library",
    "ai model prompt testing",
    "structured extraction prompts",
    "long-context recall prompts",
    "instruction following prompts",
    "refusal boundary prompts",
    "automation robustness prompts",
  ],
});

export default function LabPromptsHubPage() {
  const sets = getEvaluationPromptSets();
  return (
    <PageShell
      eyebrow="Lab · Prompts"
      title="Evaluation prompt library"
      intro="Prompt sets for testing model behaviour before production use. These are evaluation inputs you run in your own model harness, not production prompts. Outputs feed into the prompt-test matrix template and the decision brief builder."
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Lab", href: "/lab" },
          { name: "Prompts", href: "/lab/prompts" },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Lab", href: "/lab" },
            { name: "Prompts", href: "/lab/prompts" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "AI Usage Lab — evaluation prompt library",
            url: `${siteConfig.url}/lab/prompts`,
            description:
              "Generic, safe prompt sets for evaluating AI model behaviour across summarisation, structured extraction, long-context recall, instruction following, refusal boundary, and automation robustness.",
            dateModified: siteConfig.buildDate,
            isPartOf: { "@type": "WebSite", url: siteConfig.url },
            hasPart: sets.map((s) => ({
              "@type": "HowTo",
              name: s.title,
              description: s.summary,
              totalTime: `PT${s.estimatedMinutes}M`,
              url: `${siteConfig.url}/lab/prompts/${s.slug}`,
            })),
          },
        ]}
      />

      <aside
        role="note"
        aria-label="Prompt library policy"
        className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          Evaluation inputs, not production prompts.
        </p>
        <p>
          Every prompt is designed to surface a particular failure
          mode in model behaviour — hallucination, schema drift,
          lost-in-the-middle, instruction skipping, unsafe
          compliance, contract violation. Run them in your own
          harness, record observations, and feed findings into a
          decision brief. The library does not rank prompts, does
          not call models live, and does not certify safety.
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
              href="/lab/prompts/summarization-quality"
              className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 font-medium text-primary hover:bg-primary/15"
            >
              Start with summarization quality
            </Link>
          </li>
          <li>
            <Link
              href="/lab/templates/prompt-test-matrix"
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-foreground hover:border-primary/30"
            >
              View prompt test matrix template
            </Link>
          </li>
          <li>
            <Link
              href="/lab/prompt-testing-basics"
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-foreground hover:border-primary/30"
            >
              Read prompt testing basics
            </Link>
          </li>
          <li>
            <Link
              href="/lab/evaluation"
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-foreground hover:border-primary/30"
            >
              Read the evaluation guide
            </Link>
          </li>
        </ul>
      </section>

      <section aria-label="Prompt sets" className="space-y-3">
        <SectionHeader
          eyebrow="Prompt sets"
          title={`${sets.length} prompt sets`}
          description="Each set targets one evaluation dimension. Open a set to see the prompts, expected observations, failure modes, and what to record."
          as="h2"
        />
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sets.map((s) => (
            <li key={s.slug}>
              <PromptSetCard set={s} />
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="How to use these prompts"
        className="card-surface space-y-3 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          How to use these prompts
        </p>
        <ol className="ml-5 list-decimal space-y-2 text-muted-foreground">
          <li>Choose a prompt set that matches the behaviour you need to evaluate.</li>
          <li>
            Run the same prompts across candidate models in{" "}
            <strong className="text-foreground">your own environment</strong>{" "}
            — your keys, your region, your sampling parameters.
          </li>
          <li>
            Record outputs in the{" "}
            <Link
              href="/lab/templates/prompt-test-matrix"
              className="text-primary hover:underline"
            >
              prompt-test matrix template
            </Link>
            .
          </li>
          <li>
            Compare observations, not vibes. Record per-prompt
            evidence rather than collapsing to a single score.
          </li>
          <li>
            Add findings to a{" "}
            <Link
              href="/briefs/build"
              className="text-primary hover:underline"
            >
              decision brief
            </Link>{" "}
            for the next reviewer.
          </li>
        </ol>
      </section>

      <PromptPolicyNote />

      <aside
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="Related routes"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Related routes
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <Link href="/lab" className="text-primary hover:underline">
              /lab
            </Link>{" "}
            — testing playbooks the prompt sets pair with.
          </li>
          <li>
            <Link
              href="/lab/templates"
              className="text-primary hover:underline"
            >
              /lab/templates
            </Link>{" "}
            — paste-ready Markdown templates.
          </li>
          <li>
            <Link
              href="/lab/evaluation"
              className="text-primary hover:underline"
            >
              /lab/evaluation
            </Link>{" "}
            — how playbooks, templates, and prompts fit together.
          </li>
          <li>
            <Link href="/learn" className="text-primary hover:underline">
              /learn
            </Link>{" "}
            — the curriculum that frames each evaluation.
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
