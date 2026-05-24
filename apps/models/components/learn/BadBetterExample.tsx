export interface BadBetterExampleData {
  weak: string[];
  better: string[];
  explanation: string;
}

/**
 * BadBetterExample — two-column comparison of a weak approach vs a
 * better approach to the same workflow. The component is never used
 * to declare a winning model; it teaches inspection discipline.
 */
export function BadBetterExample({
  example,
  title = "Weak vs better approach",
}: {
  example: BadBetterExampleData;
  title?: string;
}) {
  return (
    <section
      aria-label={title}
      className="card-surface space-y-3 p-5 text-sm not-prose"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {title}
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-muted/40 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Weak approach
          </p>
          <ul className="mt-2 ml-5 list-disc space-y-1 text-muted-foreground">
            {example.weak.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Better approach
          </p>
          <ul className="mt-2 ml-5 list-disc space-y-1 text-foreground">
            {example.better.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">Why better:</span>{" "}
        {example.explanation}
      </p>
    </section>
  );
}
