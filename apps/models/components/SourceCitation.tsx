import Link from "next/link";
import type { SourceCitation as SourceCitationT } from "@/lib/types";
import { formatDateISO } from "@/lib/utils";
import {
  freshnessClasses,
  freshnessLabel,
  getFreshnessState,
} from "@/lib/source-freshness";

const TYPE_LABEL: Record<SourceCitationT["type"], string> = {
  "official-vendor-docs": "Official docs",
  "official-vendor-pricing": "Official pricing",
  "official-vendor-site": "Official site",
  "regulatory-filing": "Regulatory filing",
  "research-paper": "Research paper",
  "public-dataset": "Public dataset",
  unknown: "Unknown source",
};

export function SourceCitationItem({
  citation,
  compact = false,
}: {
  citation: SourceCitationT;
  compact?: boolean;
}) {
  // Sprint 21: pair every citation with a deterministic freshness
  // chip computed against siteConfig.buildDate. Pricing citations
  // use the pricing cadence (14d/30d); other citations use the
  // standard cadence (30d/60d/90d).
  const category =
    citation.type === "official-vendor-pricing" ? "pricing" : "source";
  const freshness = getFreshnessState(citation.retrievedAt, { category });
  return (
    <article
      className="rounded-xl border border-border bg-card p-3"
      data-source-type={citation.type}
      data-source-freshness={freshness}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="pill">{TYPE_LABEL[citation.type]}</span>
        <span>Retrieved {formatDateISO(citation.retrievedAt)}</span>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${freshnessClasses(freshness)}`}
          aria-label={`Source freshness ${freshnessLabel(freshness)}`}
        >
          {freshnessLabel(freshness)}
        </span>
      </div>
      <Link
        href={citation.url}
        target="_blank"
        rel="noreferrer"
        className="mt-1.5 block text-sm font-medium text-primary hover:underline"
      >
        {citation.name}
      </Link>
      {!compact && citation.notes ? (
        <p className="mt-1 text-xs text-muted-foreground">{citation.notes}</p>
      ) : null}
    </article>
  );
}

export function SourceCitationList({
  citations,
  title = "Sources",
}: {
  citations: SourceCitationT[];
  title?: string;
}) {
  if (!citations.length) return null;
  return (
    <section aria-label={title} className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {title}
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {citations.map((c) => (
          <li key={c.url}>
            <SourceCitationItem citation={c} />
          </li>
        ))}
      </ul>
    </section>
  );
}
