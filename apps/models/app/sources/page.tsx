import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { SourceCitationItem } from "@/components/SourceCitation";
import { DataNotVerified } from "@/components/DataNotVerified";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { models } from "@/data/models";
import { providers } from "@/data/providers";
import type { SourceCitation } from "@/lib/types";

export const metadata: Metadata = buildMetadata({
  title: "Sources",
  description:
    "Every primary-source citation backing a verified value on WebmasterID Models. Grouped by provider; each entry links back to the live source page.",
  path: "/sources",
});

/**
 * Build a deduplicated list of every citation referenced by any model
 * entity, grouped by provider slug. Citations are uniquified by URL
 * across the whole catalogue so that one entry per source URL is shown.
 */
function citationsByProvider(): Record<string, SourceCitation[]> {
  const byProvider: Record<string, Map<string, SourceCitation>> = {};
  for (const m of models) {
    const slug = m.providerSlug;
    byProvider[slug] ??= new Map();
    for (const c of m.citations) {
      if (!byProvider[slug].has(c.url)) byProvider[slug].set(c.url, c);
    }
  }
  const out: Record<string, SourceCitation[]> = {};
  for (const [slug, m] of Object.entries(byProvider)) {
    out[slug] = Array.from(m.values());
  }
  return out;
}

export default function SourcesPage() {
  const grouped = citationsByProvider();
  const totalCitations = Object.values(grouped).reduce(
    (n, list) => n + list.length,
    0
  );
  const providerOrder = providers.map((p) => p.slug);

  return (
    <PageShell
      eyebrow="Transparency"
      title="Sources"
      intro={`Every primary-source citation that backs a verified value on this site. ${totalCitations} unique URLs are listed below. Each citation records when it was last retrieved and a short note describing what was actually used.`}
    >
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Sources", href: "/sources" },
        ])}
      />

      <aside
        role="note"
        aria-label="Sources caveat"
        className="card-surface p-4 text-sm text-muted-foreground"
      >
        <p>
          This page is the audit trail. If a metric appears on a model or
          provider page, the source it came from is listed here — and
          conversely, if a metric is rendered as <DataNotVerified />, no
          citation exists for it yet. For per-attempt outcomes (including
          blocked retrievals), see{" "}
          <Link href="/coverage" className="text-primary hover:underline">
            /coverage
          </Link>
          .
        </p>
      </aside>

      {providerOrder.map((slug) => {
        const list = grouped[slug];
        if (!list || !list.length) return null;
        const provider = providers.find((p) => p.slug === slug);
        return (
          <section
            key={slug}
            aria-label={`Sources for ${provider?.name ?? slug}`}
            className="space-y-3"
          >
            <SectionHeader
              eyebrow={provider?.name ?? slug}
              title={`${list.length} primary-source citation${list.length === 1 ? "" : "s"}`}
              as="h2"
            />
            <ul className="grid gap-2 sm:grid-cols-2">
              {list.map((c) => (
                <li key={c.url}>
                  <SourceCitationItem citation={c} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </PageShell>
  );
}
