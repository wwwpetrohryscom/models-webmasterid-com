import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { OutcomeWorkflow } from "@/components/outcomes/OutcomeWorkflow";
import { OutcomeResourceGrid } from "@/components/outcomes/OutcomeResourceGrid";
import { OutcomeArtifactList } from "@/components/outcomes/OutcomeArtifactList";
import { OutcomePolicyNote } from "@/components/outcomes/OutcomePolicyNote";
import { breadcrumbJsonLd, articleJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { getAudience } from "@/lib/audiences";
import type { OutcomeUseCase } from "@/lib/outcome-use-cases";

/**
 * OutcomePage — renders a full outcome detail page from a registry
 * entry. The 6 outcome routes call this with their specific entry.
 * Server component; no client JS.
 */
export function OutcomePage({ outcome }: { outcome: OutcomeUseCase }) {
  const path = `/use-cases/${outcome.slug}`;
  const audience = outcome.audienceSlug
    ? getAudience(outcome.audienceSlug)
    : undefined;

  return (
    <PageShell
      eyebrow="Outcome"
      title={outcome.title}
      intro={outcome.summary}
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Use cases", href: "/use-cases" },
          { name: outcome.title, href: path },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Use cases", href: "/use-cases" },
            { name: outcome.title, href: path },
          ]),
          articleJsonLd({
            type: "TechArticle",
            headline: outcome.title,
            description: outcome.summary,
            path,
            dateModified: siteConfig.buildDate,
          }),
          {
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: outcome.title,
            description: outcome.summary,
            url: `${siteConfig.url}${path}`,
            step: outcome.suggestedWorkflow.map((s) => ({
              "@type": "HowToStep",
              position: s.step,
              name: s.label,
              text: s.output,
              url: `${siteConfig.url}${s.href}`,
            })),
          },
        ]}
      />

      <section
        aria-label="Headline"
        className="card-surface space-y-2 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Outcome headline
        </p>
        <p className="text-base font-medium text-foreground">
          {outcome.headline}
        </p>
      </section>

      <section
        aria-label="Problem"
        className="card-surface space-y-2 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Problem
        </p>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          {outcome.problem.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Who this is for"
        className="card-surface space-y-2 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Who this is for
        </p>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          {outcome.whoThisIsFor.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
        {audience ? (
          <p className="text-xs">
            <Link
              href={`/for/${audience.slug}`}
              className="text-primary hover:underline"
            >
              Open the audience page → /for/{audience.slug}
            </Link>
          </p>
        ) : null}
      </section>

      <OutcomeArtifactList artifacts={outcome.evidenceArtifacts} />

      <SectionHeader
        eyebrow="Workflow"
        title={`${outcome.suggestedWorkflow.length} sequenced steps`}
        description="Open each step in order. Every route already exists in the product — outcome pages are entry points, not parallel surfaces."
        as="h2"
      />
      <OutcomeWorkflow steps={outcome.suggestedWorkflow} />

      <OutcomeResourceGrid outcome={outcome} />

      <section
        aria-label="What this outcome does not promise"
        className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          What this outcome does not promise
        </p>
        <ul className="ml-5 list-disc space-y-1">
          {outcome.doesNotPromise.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </section>

      <OutcomePolicyNote />

      <aside
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="Back to use cases"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Back to use cases
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <Link href="/use-cases" className="text-primary hover:underline">
              All use cases →
            </Link>
          </li>
          <li>
            <Link href="/for" className="text-primary hover:underline">
              Audience entry points →
            </Link>
          </li>
          <li>
            <Link href="/learn/paths" className="text-primary hover:underline">
              Role-based learning paths →
            </Link>
          </li>
          <li>
            <Link href="/kits" className="text-primary hover:underline">
              Workflow kits →
            </Link>
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
