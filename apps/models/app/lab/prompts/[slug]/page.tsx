import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { PromptEvaluationTable } from "@/components/lab/PromptEvaluationTable";
import { PromptObservationChecklist } from "@/components/lab/PromptObservationChecklist";
import { PromptPolicyNote } from "@/components/lab/PromptPolicyNote";
import { buildMetadata, breadcrumbJsonLd, articleJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import {
  getEvaluationPromptSet,
  getEvaluationPromptSets,
} from "@/lib/evaluation-prompts";
import { getLabPlaybook, getLabTemplate } from "@/lib/lab-playbooks";

interface RouteParams {
  slug: string;
}

export function generateStaticParams(): RouteParams[] {
  return getEvaluationPromptSets().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const set = getEvaluationPromptSet(slug);
  if (!set) {
    return buildMetadata({
      title: "Evaluation prompt set",
      path: `/lab/prompts/${slug}`,
    });
  }
  return buildMetadata({
    title: `${set.title} — evaluation prompts`,
    description: set.summary,
    path: `/lab/prompts/${set.slug}`,
    keywords: [
      "evaluation prompt set",
      `${set.slug} prompt set`,
      `${set.category} prompts`,
    ],
  });
}

export default async function PromptSetDetailPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const set = getEvaluationPromptSet(slug);
  if (!set) notFound();

  const path = `/lab/prompts/${set.slug}`;

  return (
    <PageShell
      eyebrow={`Lab · ${set.category}`}
      title={set.title}
      intro={set.summary}
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Lab", href: "/lab" },
          { name: "Prompts", href: "/lab/prompts" },
          { name: set.title, href: path },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Lab", href: "/lab" },
            { name: "Prompts", href: "/lab/prompts" },
            { name: set.title, href: path },
          ]),
          articleJsonLd({
            type: "TechArticle",
            headline: set.title,
            description: set.summary,
            path,
            dateModified: siteConfig.buildDate,
          }),
        ]}
      />

      <section
        aria-label="At a glance"
        className="card-surface grid gap-3 p-5 text-sm sm:grid-cols-4"
      >
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Category
          </p>
          <p className="mt-1 text-base font-semibold text-foreground capitalize">
            {set.category}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Difficulty
          </p>
          <p className="mt-1 text-base font-semibold text-foreground capitalize">
            {set.difficulty}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Estimated time
          </p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {set.estimatedMinutes} min
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Prompts
          </p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {set.prompts.length}
          </p>
        </div>
      </section>

      <aside
        role="note"
        aria-label="Prompt set policy"
        className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          Evaluation inputs, not production prompts.
        </p>
        <p>{set.policyNote}</p>
      </aside>

      <section
        aria-label="When to use this"
        className="card-surface space-y-2 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          When to use this
        </p>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          {set.whenToUse.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Evaluation goal"
        className="card-surface p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Evaluation goal
        </p>
        <p className="mt-2 text-muted-foreground">{set.evaluationGoal}</p>
      </section>

      <section
        aria-label="Prerequisites"
        className="card-surface space-y-2 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Prerequisites
        </p>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          {set.prerequisites.map((p) => (
            <li key={`${p.label}-${p.href}`}>
              <Link
                href={p.href}
                className="text-primary hover:underline"
              >
                {p.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Export" className="card-surface space-y-2 p-5 text-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Export
        </p>
        <p className="text-muted-foreground">
          Open the raw Markdown if you want to paste the whole set
          into your harness or design doc.
        </p>
        <p>
          <Link
            href={`/api/lab/prompts/${set.slug}`}
            className="inline-flex h-9 items-center rounded-lg border border-primary/40 bg-primary/10 px-3 text-sm font-medium text-primary hover:bg-primary/15"
          >
            Open raw Markdown →{" "}
            <code className="ml-2 rounded bg-muted px-1 py-0.5 text-[10px] text-foreground">
              /api/lab/prompts/{set.slug}
            </code>
          </Link>
        </p>
      </section>

      <section aria-label="Prompts" className="space-y-3">
        <SectionHeader
          eyebrow="Prompts"
          title={`${set.prompts.length} evaluation prompts`}
          description="Each prompt targets one observable behaviour. Copy into your own harness; the page renders the prompt text inside a non-executable code block."
          as="h2"
        />
        <PromptEvaluationTable prompts={set.prompts} />
      </section>

      <PromptObservationChecklist
        title="Observation checklist"
        caption="Tick items off in your own notes; the page does not store progress."
        items={set.observationChecklist}
      />

      <PromptObservationChecklist
        title="Comparison notes"
        caption="Apply when running the set across multiple candidate models."
        items={set.comparisonNotes}
      />

      {set.matrixUsageNote ? (
        <PromptObservationChecklist
          title="How to use with the prompt-test matrix"
          caption="The matrix template ships at /lab/templates/prompt-test-matrix."
          items={set.matrixUsageNote}
        />
      ) : null}

      {set.doNotConclude ? (
        <section
          aria-label="What not to conclude"
          className="card-surface space-y-2 p-5 text-sm not-prose"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            What not to conclude
          </p>
          <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
            {set.doNotConclude.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {set.rerunWhen ? (
        <PromptObservationChecklist
          title="When to rerun this set"
          items={set.rerunWhen}
        />
      ) : null}

      <section
        aria-label="Related playbooks and templates"
        className="card-surface space-y-3 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Related playbooks and templates
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Playbooks
            </p>
            {set.relatedPlaybooks.length ? (
              <ul className="mt-1 ml-5 list-disc space-y-1 text-muted-foreground">
                {set.relatedPlaybooks.map((slug) => {
                  const playbook = getLabPlaybook(slug);
                  if (!playbook) return null;
                  return (
                    <li key={slug}>
                      <Link
                        href={`/lab/${slug}`}
                        className="text-primary hover:underline"
                      >
                        {playbook.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                None registered for this set.
              </p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Templates
            </p>
            {set.relatedTemplates.length ? (
              <ul className="mt-1 ml-5 list-disc space-y-1 text-muted-foreground">
                {set.relatedTemplates.map((slug) => {
                  const template = getLabTemplate(slug);
                  if (!template) return null;
                  return (
                    <li key={slug}>
                      <Link
                        href={`/lab/templates/${slug}`}
                        className="text-primary hover:underline"
                      >
                        {template.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                None registered for this set.
              </p>
            )}
          </div>
        </div>
      </section>

      <section
        aria-label="Related workflows"
        className="card-surface space-y-2 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Related workflows
        </p>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          {set.relatedRoutes.map((r) => (
            <li key={`${r.label}-${r.href}`}>
              <Link
                href={r.href}
                className="text-primary hover:underline"
              >
                {r.label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/briefs/build"
              className="text-primary hover:underline"
            >
              Add findings to a decision brief
            </Link>
          </li>
        </ul>
      </section>

      <PromptPolicyNote />

      <aside
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="Back to prompts"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Back to prompts
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <Link
              href="/lab/prompts"
              className="text-primary hover:underline"
            >
              All prompt sets →
            </Link>
          </li>
          <li>
            <Link
              href="/lab"
              className="text-primary hover:underline"
            >
              All lab playbooks →
            </Link>
          </li>
          <li>
            <Link
              href="/lab/templates"
              className="text-primary hover:underline"
            >
              All lab templates →
            </Link>
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
