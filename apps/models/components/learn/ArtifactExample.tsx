export interface ArtifactExampleData {
  title: string;
  body: string[];
}

/**
 * ArtifactExample — renders a paste-ready, illustrative artifact
 * (note, shortlist line, brief excerpt) so the reader can see the
 * shape of what the workflow ends with. Always labelled illustrative.
 */
export function ArtifactExample({
  artifact,
  caption,
}: {
  artifact: ArtifactExampleData;
  caption?: string;
}) {
  return (
    <section
      aria-label={`Example artifact — ${artifact.title}`}
      className="card-surface space-y-3 p-5 text-sm not-prose"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        Example artifact
      </p>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        Illustrative example — not a recommendation. Substitute your
        own values when you run the workflow.
      </p>
      <h3 className="text-base font-semibold text-foreground">
        {artifact.title}
      </h3>
      <pre className="max-h-72 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed text-foreground">
        <code className="whitespace-pre-wrap">
          {artifact.body.join("\n")}
        </code>
      </pre>
      {caption ? (
        <p className="text-[11px] text-muted-foreground">{caption}</p>
      ) : null}
    </section>
  );
}
