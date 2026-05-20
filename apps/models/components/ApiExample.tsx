import type { SourceCitation } from "@/lib/types";
import { SourceCitationItem } from "./SourceCitation";

export type ApiExampleBlock = {
  label: string;
  language: "bash" | "python" | "javascript" | "typescript";
  code: string;
};

/**
 * Documentation-style API usage example. Blocks are anchored to a
 * provider citation and visibly labelled as documentation examples —
 * they are not framed as recommendations or live performance claims.
 *
 * Examples should only show the shape of a request (model id, endpoint,
 * minimum payload). They never imply a particular response, throughput,
 * latency, or capability beyond what is documented at the citation URL.
 */
export function ApiExample({
  title,
  intro,
  blocks,
  citation,
}: {
  title: string;
  intro?: string;
  blocks: ApiExampleBlock[];
  citation: SourceCitation;
}) {
  return (
    <section
      aria-label={`API usage example: ${title}`}
      className="card-surface p-5"
      data-example-source-type={citation.type}
    >
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Documentation example
        </p>
        <h2 className="mt-1 text-base font-semibold text-foreground">
          {title}
        </h2>
        {intro ? (
          <p className="mt-1 text-sm text-muted-foreground">{intro}</p>
        ) : null}
      </header>

      <div className="mt-4 space-y-3">
        {blocks.map((b) => (
          <div key={b.label}>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              {b.label}
            </p>
            <pre className="overflow-x-auto rounded-lg border border-border bg-background/60 p-3 text-[12px] leading-relaxed text-foreground">
              <code data-language={b.language}>{b.code}</code>
            </pre>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Shown for reference — not a performance recommendation. Refer to
        the provider's documentation for current request shape, headers,
        and limits.
      </p>

      <div className="mt-3">
        <SourceCitationItem citation={citation} compact />
      </div>
    </section>
  );
}
