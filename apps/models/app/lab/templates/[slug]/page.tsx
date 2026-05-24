import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { LabPolicyNote } from "@/components/lab/LabPolicyNote";
import { buildMetadata, breadcrumbJsonLd, articleJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import {
  getLabTemplate,
  getLabTemplates,
  getLabPlaybooks,
} from "@/lib/lab-playbooks";

interface RouteParams {
  slug: string;
}

export function generateStaticParams(): RouteParams[] {
  return getLabTemplates().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const template = getLabTemplate(slug);
  if (!template) {
    return buildMetadata({
      title: "Template",
      path: `/lab/templates/${slug}`,
    });
  }
  return buildMetadata({
    title: `${template.title} — template`,
    description: template.summary,
    path: `/lab/templates/${template.slug}`,
    keywords: [
      "ai evaluation template",
      `${template.slug} template`,
      "markdown planning template",
    ],
  });
}

export default async function LabTemplateDetailPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const template = getLabTemplate(slug);
  if (!template) notFound();

  const path = `/lab/templates/${template.slug}`;
  // Playbooks that reference this template
  const relatedPlaybooks = getLabPlaybooks().filter((p) =>
    p.relatedTemplates.includes(template.slug)
  );

  return (
    <PageShell
      eyebrow="Lab · Template"
      title={template.title}
      intro={template.summary}
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Lab", href: "/lab" },
          { name: "Templates", href: "/lab/templates" },
          { name: template.title, href: path },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Lab", href: "/lab" },
            { name: "Templates", href: "/lab/templates" },
            { name: template.title, href: path },
          ]),
          articleJsonLd({
            type: "TechArticle",
            headline: template.title,
            description: template.summary,
            path,
            dateModified: siteConfig.buildDate,
          }),
        ]}
      />

      <aside
        role="note"
        aria-label="Template policy"
        className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          A template, not a safety validation.
        </p>
        <p>{template.policyNote}</p>
      </aside>

      <section
        aria-label="Export"
        className="card-surface space-y-2 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Export
        </p>
        <p className="text-muted-foreground">
          Open or pipe the raw Markdown into your design doc, ticket,
          or PR description.
        </p>
        <p>
          <Link
            href={`/api/lab/templates/${template.slug}`}
            className="inline-flex h-9 items-center rounded-lg border border-primary/40 bg-primary/10 px-3 text-sm font-medium text-primary hover:bg-primary/15"
          >
            Open raw Markdown →{" "}
            <code className="ml-2 rounded bg-muted px-1 py-0.5 text-[10px] text-foreground">
              /api/lab/templates/{template.slug}
            </code>
          </Link>
        </p>
      </section>

      <section aria-label="Template body" className="space-y-4">
        <SectionHeader
          eyebrow="Template"
          title={`${template.sections.length} sections`}
          description="Render order matches the Markdown export. Each section is generic — adapt to your workload before filling in."
          as="h2"
        />
        <article className="card-surface space-y-5 p-5 text-sm">
          <header>
            <h2 className="text-lg font-semibold text-foreground">
              {template.title}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              &gt; {template.summary}
            </p>
          </header>
          {template.sections.map((section) => (
            <section
              key={section.title}
              aria-label={section.title}
              className="space-y-2"
            >
              <h3 className="text-base font-semibold text-foreground">
                {section.title}
              </h3>
              <ul className="space-y-1 text-muted-foreground">
                {section.body.map((line, i) => (
                  <li key={i} className="font-mono text-xs">
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <footer className="border-t border-border pt-3 text-xs text-muted-foreground">
            <p>
              <em>Policy: {template.policyNote}</em>
            </p>
            <p className="mt-1">
              <em>
                Generated by WebmasterID Models AI Usage Lab. No
                fabricated metrics. No model recommendations.{" "}
                <Link
                  href="/lab/templates"
                  className="text-primary hover:underline"
                >
                  /lab/templates
                </Link>
              </em>
            </p>
          </footer>
        </article>
      </section>

      <section
        aria-label="Related playbooks"
        className="card-surface space-y-2 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Related playbooks
        </p>
        {relatedPlaybooks.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {relatedPlaybooks.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/lab/${p.slug}`}
                  className="block rounded-lg border border-border bg-card p-3 transition hover:border-primary/30"
                >
                  <p className="text-sm font-semibold text-foreground">
                    {p.title} →
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.summary}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">
            No playbooks reference this template yet.
          </p>
        )}
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
            <Link
              href="/lab/templates"
              className="text-primary hover:underline"
            >
              All templates →
            </Link>
          </li>
          <li>
            <Link href="/lab" className="text-primary hover:underline">
              All playbooks →
            </Link>
          </li>
          <li>
            <Link
              href="/briefs/build"
              className="text-primary hover:underline"
            >
              Decision brief builder →
            </Link>
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
