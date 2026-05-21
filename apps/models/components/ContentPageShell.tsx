import Link from "next/link";
import type { ReactNode } from "react";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { formatDateISO } from "@/lib/utils";
import type { ContentPage } from "@/lib/content";

export interface ContentSectionLink {
  href: string;
  label: string;
  description?: string;
}

export interface VerifiedTodayItem {
  label: string;
  detail: string;
}

export interface DataGapItem {
  label: string;
  detail: string;
}

/**
 * Standard chrome for every research / docs page.
 *
 * Handles:
 *   - breadcrumb trail (rendered + BreadcrumbList JSON-LD)
 *   - Article / TechArticle JSON-LD
 *   - table-of-contents panel rendered from a `toc` array
 *   - "Verified today" callout for evidence-backed assertions on the page
 *   - "Data gaps" callout for what we explicitly do not assert
 *   - "Related pages" block driven by the content registry
 *   - last-updated timestamp from `page.updatedDate`
 *
 * The children area is where the author writes the body. No special
 * conventions — plain JSX with semantic sections.
 */
export function ContentPageShell({
  page,
  breadcrumbParent,
  toc,
  verifiedToday,
  dataGaps,
  relatedLinks,
  children,
}: {
  page: ContentPage;
  breadcrumbParent: { name: string; href: string };
  toc: { id: string; label: string }[];
  verifiedToday?: VerifiedTodayItem[];
  dataGaps?: DataGapItem[];
  relatedLinks?: ContentSectionLink[];
  children: ReactNode;
}) {
  const breadcrumbItems = [
    { name: "Home", href: "/" },
    breadcrumbParent,
    { name: page.title, href: page.slug },
  ];

  return (
    <PageShell
      eyebrow={
        page.slug.startsWith("/research/")
          ? "Research guide"
          : "Reference"
      }
      title={page.title}
      intro={page.description}
    >
      <Breadcrumbs items={breadcrumbItems} />

      <JsonLd
        data={[
          breadcrumbJsonLd(breadcrumbItems),
          articleJsonLd({
            type: page.jsonLdType,
            headline: page.title,
            description: page.description,
            path: page.slug,
            dateModified: page.updatedDate,
          }),
        ]}
      />

      <p className="text-xs text-muted-foreground">
        Last updated: {formatDateISO(page.updatedDate)}
      </p>

      {toc.length > 0 ? (
        <nav
          aria-label="On this page"
          className="card-surface p-4 text-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            On this page
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-foreground">
            {toc.map((item) => (
              <li key={item.id}>
                <Link
                  href={`#${item.id}`}
                  className="hover:text-primary hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <div className="prose-content space-y-4 text-[15px] leading-relaxed text-foreground">
        {children}
      </div>

      {verifiedToday && verifiedToday.length > 0 ? (
        <section
          aria-label="Verified today"
          className="card-surface border-success/30 bg-success/5 p-5 text-sm"
        >
          <SectionHeader
            eyebrow="What this page assumes is verified"
            title="Verified today"
            description="Each item below is backed by an entry in the citation registry. Updates land via the manual verification workflow — see /docs/data-verification."
            as="h2"
          />
          <ul className="mt-3 space-y-2 text-foreground">
            {verifiedToday.map((v) => (
              <li
                key={v.label}
                className="rounded-lg border border-success/20 bg-background/60 p-3"
              >
                <p className="font-medium">{v.label}</p>
                <p className="mt-0.5 text-muted-foreground">{v.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {dataGaps && dataGaps.length > 0 ? (
        <section
          aria-label="Data gaps"
          className="card-surface border-warning/30 bg-warning/5 p-5 text-sm"
        >
          <SectionHeader
            eyebrow="Honest gaps"
            title="Data gaps"
            description="Things this page intentionally does not assert because the underlying data is not yet verified. Tracked openly so readers can calibrate."
            as="h2"
          />
          <ul className="mt-3 space-y-2 text-foreground">
            {dataGaps.map((g) => (
              <li
                key={g.label}
                className="rounded-lg border border-warning/20 bg-background/60 p-3"
              >
                <p className="font-medium">{g.label}</p>
                <p className="mt-0.5 text-muted-foreground">{g.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {relatedLinks && relatedLinks.length > 0 ? (
        <section
          aria-label="Related"
          className="space-y-3"
        >
          <SectionHeader
            eyebrow="Continue"
            title="Related pages"
            as="h2"
          />
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {relatedLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-xl border border-border bg-card p-3 transition hover:border-primary/30 hover:shadow-elevated"
                >
                  <p className="text-sm font-medium text-foreground">
                    {link.label}
                  </p>
                  {link.description ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {link.description}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </PageShell>
  );
}
