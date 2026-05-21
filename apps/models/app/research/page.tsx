import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import {
  researchPages,
  RESEARCH_SECTION_LABEL,
  type ContentSection,
} from "@/lib/content";
import { formatDateISO } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Research",
  description:
    "Source-aware research notes and infrastructure explainers built on the verified WebmasterID Models entity graph — model selection, API pricing methodology, context windows, status monitoring, benchmark limitations, and verification policy.",
  path: "/research",
});

export default function ResearchHubPage() {
  const sections: ContentSection[] = [
    "research-guides",
    "methodology",
    "infrastructure-explainers",
    "verification-policy",
  ];

  return (
    <PageShell
      eyebrow="Methodology hub"
      title="Research"
      intro="Source-aware research notes and infrastructure explainers built on the verified WebmasterID Models entity graph. Each page is internally linked to the underlying model, provider, pricing, and source records so every assertion can be checked against the data."
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Research", href: "/research" },
        ]}
      />

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Research", href: "/research" },
        ])}
      />

      <aside
        role="note"
        aria-label="Editorial policy"
        className="card-surface p-4 text-sm text-muted-foreground"
      >
        <p>
          <strong className="text-foreground">No winners declared.</strong>{" "}
          No fabricated metrics. No uptime claims without durable
          observations. Pages here are methodology and infrastructure
          explainers — they cite verified facts from the data layer when
          they reference a specific model, and they explicitly mark data
          gaps where the underlying value is not yet verified. See{" "}
          <Link
            href="/research/source-verification-methodology"
            className="text-primary hover:underline"
          >
            source verification methodology
          </Link>
          .
        </p>
      </aside>

      {sections.map((section) => {
        const items = researchPages.filter((p) => p.section === section);
        if (items.length === 0) return null;
        return (
          <section
            key={section}
            aria-label={RESEARCH_SECTION_LABEL[section]}
            className="space-y-3"
          >
            <SectionHeader
              eyebrow={RESEARCH_SECTION_LABEL[section]}
              title={`${items.length} guide${items.length === 1 ? "" : "s"}`}
              as="h2"
            />
            <ul className="grid gap-3 sm:grid-cols-2">
              {items.map((page) => (
                <li key={page.slug}>
                  <Link
                    href={page.slug}
                    className="card-surface block h-full p-5 transition hover:border-primary/30 hover:shadow-elevated"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {RESEARCH_SECTION_LABEL[page.section]}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-foreground">
                      {page.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {page.description}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Last updated: {formatDateISO(page.updatedDate)}
                    </p>
                    <p className="mt-2 text-xs font-medium text-primary">
                      Read guide →
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <aside
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="Related"
      >
        <h2 className="text-base font-semibold text-foreground">
          Looking for the reference docs?
        </h2>
        <p className="mt-2">
          See{" "}
          <Link href="/docs" className="text-primary hover:underline">
            /docs
          </Link>{" "}
          for the data-model and integration reference (PricingUnit,
          StatusObservation, ModelEntity, comparison rules, provider
          coverage). The research pages here explain the why; the docs
          pages document the schema.
        </p>
      </aside>
    </PageShell>
  );
}
