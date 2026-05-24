import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import {
  docsPages,
  RESEARCH_SECTION_LABEL,
  type ContentSection,
} from "@/lib/content";
import { formatDateISO } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "Docs",
  description:
    "Reference documentation for the WebmasterID Models data model — VerifiedField + MaybeVerified, the PricingUnit enum, StatusObservation, comparison rules, provider coverage dimensions, and the ModelEntity schema.",
  path: "/docs",
});

export default function DocsHubPage() {
  const sections: ContentSection[] = [
    "data-model",
    "data-verification",
    "pricing-docs",
    "status-docs",
    "comparison-docs",
  ];

  return (
    <PageShell
      eyebrow="Reference hub"
      title="Docs"
      intro="Reference documentation for the data model behind every model, provider, comparison, and observation. Each docs page is a stable schema reference; the methodology behind those schemas lives in /research."
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Docs", href: "/docs" },
        ]}
      />

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Docs", href: "/docs" },
        ])}
      />

      <aside
        role="note"
        aria-label="Editorial policy"
        className="card-surface p-4 text-sm text-muted-foreground"
      >
        <p>
          Docs describe the verified-data schema, not opinions. They are
          reference material — every field is documented with the same
          source-discipline rules used in the live entity graph. See{" "}
          <Link
            href="/docs/data-verification"
            className="text-primary hover:underline"
          >
            data verification
          </Link>{" "}
          for the foundational rules.
        </p>
        <p className="text-xs">
          Looking for a plain-language read instead of a schema reference?{" "}
          <Link href="/learn" className="text-primary hover:underline">
            /learn
          </Link>{" "}
          teaches the same fields without the data-model framing.
        </p>
      </aside>

      {sections.map((section) => {
        const items = docsPages.filter((p) => p.section === section);
        if (items.length === 0) return null;
        return (
          <section
            key={section}
            aria-label={RESEARCH_SECTION_LABEL[section]}
            className="space-y-3"
          >
            <SectionHeader
              eyebrow={RESEARCH_SECTION_LABEL[section]}
              title={`${items.length} page${items.length === 1 ? "" : "s"}`}
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
                      Read reference →
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
        aria-label="Crawler endpoints"
      >
        <h2 className="text-base font-semibold text-foreground">
          Machine-readable endpoints
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          <li>
            <Link href="/sitemap.xml" className="text-primary hover:underline">
              /sitemap.xml
            </Link>
          </li>
          <li>
            <Link href="/robots.txt" className="text-primary hover:underline">
              /robots.txt
            </Link>
          </li>
          <li>
            <Link href="/llms.txt" className="text-primary hover:underline">
              /llms.txt
            </Link>
          </li>
          <li>
            <Link href="/rss.xml" className="text-primary hover:underline">
              /rss.xml
            </Link>
          </li>
          <li>
            <Link href="/api/site" className="text-primary hover:underline" prefetch={false}>
              /api/site
            </Link>
          </li>
          <li>
            <Link href="/api/debug/deployment" className="text-primary hover:underline" prefetch={false}>
              /api/debug/deployment
            </Link>
          </li>
        </ul>
      </aside>

      <aside
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="Methodology"
      >
        <h2 className="text-base font-semibold text-foreground">
          Methodology and guides
        </h2>
        <p className="mt-2">
          See{" "}
          <Link href="/research" className="text-primary hover:underline">
            /research
          </Link>{" "}
          for source-aware guides on model selection, API pricing,
          context windows, status monitoring, benchmark methodology, and
          inference infrastructure.
        </p>
      </aside>
    </PageShell>
  );
}
