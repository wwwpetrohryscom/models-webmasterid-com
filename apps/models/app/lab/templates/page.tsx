import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { LabTemplateCard } from "@/components/lab/LabTemplateCard";
import { LabPolicyNote } from "@/components/lab/LabPolicyNote";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { getLabTemplates } from "@/lib/lab-playbooks";

export const metadata: Metadata = buildMetadata({
  title: "Lab templates",
  description:
    "Paste-ready Markdown templates for AI model evaluation, prompt test matrices, and automation risk checklists. Generic planning tools, never safety certifications.",
  path: "/lab/templates",
  keywords: [
    "ai model evaluation template",
    "prompt test matrix template",
    "automation risk checklist",
    "ai testing planning template",
  ],
});

export default function LabTemplatesHubPage() {
  const templates = getLabTemplates();

  return (
    <PageShell
      eyebrow="Lab · Templates"
      title="Lab templates"
      intro="Paste-ready Markdown templates that pair with the AI Usage Lab playbooks. Adapt them per workload; every section is generic so the template never invents claims about a specific model."
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Lab", href: "/lab" },
          { name: "Templates", href: "/lab/templates" },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Lab", href: "/lab" },
            { name: "Templates", href: "/lab/templates" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "AI Usage Lab — templates",
            url: `${siteConfig.url}/lab/templates`,
            description:
              "Generic Markdown templates for evaluation plans, prompt test matrices, and automation risk checklists.",
            dateModified: siteConfig.buildDate,
            isPartOf: { "@type": "WebSite", url: siteConfig.url },
            hasPart: templates.map((t) => ({
              "@type": "CreativeWork",
              name: t.title,
              description: t.summary,
              url: `${siteConfig.url}/lab/templates/${t.slug}`,
              encodingFormat: "text/markdown",
            })),
          },
        ]}
      />

      <aside
        role="note"
        aria-label="Template policy"
        className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          Templates are planning tools, not safety guarantees.
        </p>
        <p>
          A filled-in template is evidence the team did the planning
          work — it is not a certification that the model is safe,
          compliant, or production-ready. Pair every template with
          the workload-specific tests in the playbooks.
        </p>
      </aside>

      <section
        aria-label="Templates"
        className="space-y-3"
      >
        <SectionHeader
          eyebrow="Templates"
          title={`${templates.length} paste-ready templates`}
          description="Every template is also exportable as raw Markdown via /api/lab/templates/<slug> so you can pipe it into your design doc, ticket, or PR description."
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

      <section
        aria-label="How to use templates"
        className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          How to use templates
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            Pick one template per workload — do not collapse multiple
            workloads into a single document.
          </li>
          <li>
            Fill the sections with observations, not opinions. Pair
            with the matching playbook so the evidence stays
            traceable.
          </li>
          <li>
            Export via{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              /api/lab/templates/&lt;slug&gt;
            </code>{" "}
            for a clean Markdown copy you can paste anywhere.
          </li>
          <li>
            Templates are not auto-validating — review the filled
            template the same way you would review any decision
            document.
          </li>
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
            <Link href="/lab" className="text-primary hover:underline">
              /lab
            </Link>{" "}
            — playbooks the templates pair with.
          </li>
          <li>
            <Link
              href="/briefs/build"
              className="text-primary hover:underline"
            >
              /briefs/build
            </Link>{" "}
            — paste a filled template into the decision brief
            builder.
          </li>
          <li>
            <Link
              href="/learn/path/developer"
              className="text-primary hover:underline"
            >
              /learn/path/developer
            </Link>{" "}
            — the curriculum these templates support.
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
