import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { WorkflowKitTimeline } from "@/components/kits/WorkflowKitTimeline";
import { WorkflowKitResourceGrid } from "@/components/kits/WorkflowKitResourceGrid";
import { WorkflowKitChecklist } from "@/components/kits/WorkflowKitChecklist";
import { WorkflowKitPolicyNote } from "@/components/kits/WorkflowKitPolicyNote";
import { buildMetadata, breadcrumbJsonLd, articleJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { getWorkflowKit, getWorkflowKits } from "@/lib/workflow-kits";
import { getAudience } from "@/lib/audiences";

interface RouteParams {
  slug: string;
}

export function generateStaticParams(): RouteParams[] {
  return getWorkflowKits().map((k) => ({ slug: k.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const kit = getWorkflowKit(slug);
  if (!kit) {
    return buildMetadata({ title: "Workflow kit", path: `/kits/${slug}` });
  }
  return buildMetadata({
    title: `${kit.title}`,
    description: kit.summary,
    path: `/kits/${kit.slug}`,
    keywords: [
      `${kit.slug} kit`,
      "ai model evaluation kit",
      "decision evidence kit",
    ],
  });
}

export default async function WorkflowKitDetailPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const kit = getWorkflowKit(slug);
  if (!kit) notFound();

  const path = `/kits/${kit.slug}`;
  const audience = getAudience(kit.audienceSlug);

  return (
    <PageShell
      eyebrow={`Kit · ${kit.audienceSlug.replace(/-/g, " ")}`}
      title={kit.title}
      intro={kit.summary}
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Kits", href: "/kits" },
          { name: kit.title, href: path },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Kits", href: "/kits" },
            { name: kit.title, href: path },
          ]),
          articleJsonLd({
            type: "TechArticle",
            headline: kit.title,
            description: kit.summary,
            path,
            dateModified: siteConfig.buildDate,
          }),
          {
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: kit.title,
            description: kit.summary,
            url: `${siteConfig.url}${path}`,
            totalTime: `PT${kit.estimatedMinutes}M`,
            step: kit.workflow.map((s) => ({
              "@type": "HowToStep",
              position: s.step,
              name: s.title,
              text: s.instruction,
              url: `${siteConfig.url}${s.route}`,
            })),
          },
        ]}
      />

      <section
        aria-label="At a glance"
        className="card-surface grid gap-3 p-5 text-sm sm:grid-cols-3"
      >
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Audience
          </p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {audience?.title.replace(/^For\s+/, "") ??
              kit.audienceSlug.replace(/-/g, " ")}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Difficulty
          </p>
          <p className="mt-1 text-base font-semibold text-foreground capitalize">
            {kit.difficulty}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Estimated time
          </p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {kit.estimatedMinutes} min · {kit.workflow.length} steps
          </p>
        </div>
      </section>

      <section
        aria-label="Who this kit is for"
        className="card-surface space-y-2 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Who this kit is for
        </p>
        {audience ? (
          <>
            <p className="text-muted-foreground">{audience.summary}</p>
            <p className="text-xs">
              <Link
                href={`/for/${audience.slug}`}
                className="text-primary hover:underline"
              >
                Open the audience page → /for/{audience.slug}
              </Link>
            </p>
          </>
        ) : (
          <p className="text-muted-foreground">
            See {kit.audienceSlug.replace(/-/g, " ")} audience entry.
          </p>
        )}
      </section>

      <section
        aria-label="Goal"
        className="card-surface p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Goal
        </p>
        <p className="mt-2 text-muted-foreground">{kit.goal}</p>
      </section>

      <section
        aria-label="What you will produce"
        className="card-surface space-y-2 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          What you will produce
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {kit.whatYouWillProduce.map((a) => (
            <li
              key={a}
              className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary"
            >
              {a}
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Prerequisites"
        className="card-surface space-y-2 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Prerequisites
        </p>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          {kit.prerequisites.map((p) => (
            <li key={p.href}>
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

      <section
        aria-label="Export"
        className="card-surface space-y-2 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Export Markdown
        </p>
        <p className="text-muted-foreground">
          The kit serialises to a single Markdown document you can
          paste into a design doc, ticket, or PR description.
        </p>
        <p>
          <Link
            href={`/api/kits/${kit.slug}`}
            className="inline-flex h-9 items-center rounded-lg border border-primary/40 bg-primary/10 px-3 text-sm font-medium text-primary hover:bg-primary/15"
          >
            Open raw Markdown →{" "}
            <code className="ml-2 rounded bg-muted px-1 py-0.5 text-[10px] text-foreground">
              /api/kits/{kit.slug}
            </code>
          </Link>
        </p>
      </section>

      <SectionHeader
        eyebrow="Workflow"
        title={`${kit.workflow.length} sequenced steps`}
        description="Open each step in order. Every step opens a route that already exists — no parallel UI."
        as="h2"
      />
      <WorkflowKitTimeline steps={kit.workflow} />

      <WorkflowKitResourceGrid kit={kit} />

      <WorkflowKitChecklist
        items={kit.finalChecklist}
        caution="No persistence — the checklist resets on every visit. Capture progress in your own notes."
      />

      <section
        aria-label="Evidence routes"
        className="card-surface space-y-2 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Evidence routes
        </p>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          {kit.evidenceRoutes.map((r) => (
            <li key={r.href}>
              <Link
                href={r.href}
                className="text-primary hover:underline"
              >
                {r.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="What this kit does not promise"
        className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          What this kit does not promise
        </p>
        <ul className="ml-5 list-disc space-y-1">
          {kit.doesNotPromise.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </section>

      <WorkflowKitPolicyNote />

      <aside
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="Back to kits"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Back to kits
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <Link href="/kits" className="text-primary hover:underline">
              All kits →
            </Link>
          </li>
          <li>
            <Link href="/for" className="text-primary hover:underline">
              Audience entry points →
            </Link>
          </li>
          <li>
            <Link
              href="/learn/paths"
              className="text-primary hover:underline"
            >
              Role-based learning paths →
            </Link>
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
