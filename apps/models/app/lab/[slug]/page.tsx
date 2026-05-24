import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { LabChecklistSection } from "@/components/lab/LabChecklistSection";
import { LabPolicyNote } from "@/components/lab/LabPolicyNote";
import { buildMetadata, breadcrumbJsonLd, articleJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import {
  getLabPlaybook,
  getLabPlaybooks,
  getLabTemplate,
} from "@/lib/lab-playbooks";

interface RouteParams {
  slug: string;
}

export function generateStaticParams(): RouteParams[] {
  return getLabPlaybooks().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const playbook = getLabPlaybook(slug);
  if (!playbook) {
    return buildMetadata({ title: "Playbook", path: `/lab/${slug}` });
  }
  return buildMetadata({
    title: `${playbook.title} — lab playbook`,
    description: playbook.summary,
    path: `/lab/${playbook.slug}`,
    keywords: [
      "ai model testing playbook",
      `${playbook.slug} playbook`,
      "ai evaluation recipe",
    ],
  });
}

export default async function LabPlaybookDetailPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const playbook = getLabPlaybook(slug);
  if (!playbook) notFound();

  const path = `/lab/${playbook.slug}`;

  return (
    <PageShell
      eyebrow={`Lab · ${playbook.difficulty}`}
      title={playbook.title}
      intro={playbook.summary}
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Lab", href: "/lab" },
          { name: playbook.title, href: path },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Lab", href: "/lab" },
            { name: playbook.title, href: path },
          ]),
          articleJsonLd({
            type: "TechArticle",
            headline: playbook.title,
            description: playbook.summary,
            path,
            dateModified: siteConfig.buildDate,
          }),
        ]}
      />

      <section
        aria-label="At a glance"
        className="card-surface grid gap-3 p-5 text-sm sm:grid-cols-3"
      >
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Difficulty
          </p>
          <p className="mt-1 text-base font-semibold text-foreground capitalize">
            {playbook.difficulty}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Estimated time
          </p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {playbook.estimatedMinutes} min
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Output
          </p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {playbook.outputs.length} Markdown artifact
            {playbook.outputs.length === 1 ? "" : "s"}
          </p>
        </div>
      </section>

      <section
        aria-label="Policy note"
        className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          A planning recipe, not a safety validation.
        </p>
        <p>{playbook.policyNote}</p>
      </section>

      <section aria-label="Goal" className="card-surface p-5 text-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Goal
        </p>
        <p className="mt-2 text-muted-foreground">{playbook.goal}</p>
      </section>

      <LabChecklistSection
        title="When to use this"
        items={playbook.whenToUse}
      />

      <section
        aria-label="Prerequisites"
        className="card-surface space-y-2 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Prerequisites
        </p>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          {playbook.prerequisites.map((p) => (
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

      <LabChecklistSection
        title="Test setup"
        items={playbook.testSetup}
      />
      <LabChecklistSection
        title="Minimum test set"
        items={playbook.minimumTestSet}
      />
      <LabChecklistSection
        title="Prompt variants"
        caption="Vary one dimension at a time so you can attribute behaviour."
        items={playbook.promptVariants}
      />
      <LabChecklistSection
        title="Observations to record"
        caption="Record observations, not scores. The evidence brief stays auditable."
        items={playbook.observationsToRecord}
      />
      <LabChecklistSection
        title="Failure modes to watch"
        items={playbook.failureModes}
      />
      <LabChecklistSection
        title="Stop conditions"
        caption="Knowing when to stop is part of the test."
        items={playbook.stopConditions}
      />
      <LabChecklistSection
        title="Outputs"
        items={playbook.outputs}
      />

      <section
        aria-label="Related templates"
        className="card-surface space-y-2 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Related templates
        </p>
        {playbook.relatedTemplates.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {playbook.relatedTemplates.map((slug) => {
              const template = getLabTemplate(slug);
              if (!template) return null;
              return (
                <li key={slug}>
                  <Link
                    href={`/lab/templates/${slug}`}
                    className="block rounded-lg border border-border bg-card p-3 transition hover:border-primary/30"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {template.title} →
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {template.summary}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">
            No templates registered for this playbook yet.
          </p>
        )}
      </section>

      <section
        aria-label="Related workflows"
        className="card-surface space-y-2 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Related workflows
        </p>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          {playbook.relatedRoutes.map((r) => (
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
              Create a decision brief after testing
            </Link>
          </li>
          <li>
            <Link
              href="/sources"
              className="text-primary hover:underline"
            >
              Review sources
            </Link>{" "}
            and{" "}
            <Link
              href="/reverification"
              className="text-primary hover:underline"
            >
              freshness
            </Link>{" "}
            before signing off.
          </li>
        </ul>
      </section>

      <LabPolicyNote />

      <aside
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="Back to lab"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Back to lab
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <Link href="/lab" className="text-primary hover:underline">
              All playbooks →
            </Link>
          </li>
          <li>
            <Link
              href="/lab/templates"
              className="text-primary hover:underline"
            >
              All templates →
            </Link>
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
