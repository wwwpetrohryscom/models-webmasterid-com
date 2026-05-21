import Link from "next/link";

/**
 * Honest data-gap panel for model / provider / comparison detail
 * pages. Renders the list of unverified fields callers compute from
 * the entity itself; the component does not infer.
 *
 * If the array is empty, the component renders nothing — a fully
 * verified entity does not need the panel.
 */
export interface DataGapItem {
  field: string;
  reason: string;
}

export function EntityDataGaps({
  items,
  description,
}: {
  items: DataGapItem[];
  description?: string;
}) {
  if (!items.length) return null;
  return (
    <section
      aria-label="Data gaps"
      className="card-surface border-warning/30 bg-warning/5 p-5 text-sm"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-warning">
        Data gaps
      </p>
      <h2 className="mt-1 text-base font-semibold text-foreground">
        Fields not yet verified
      </h2>
      <p className="mt-1 text-muted-foreground">
        {description ??
          "These fields are intentionally null until verified against a primary source. They are not estimated."}
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((g) => (
          <li
            key={g.field}
            className="rounded-lg border border-warning/20 bg-background/60 p-3"
          >
            <p className="font-medium text-foreground">{g.field}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{g.reason}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        How a value moves from this list to a verified row — see{" "}
        <Link
          href="/research/source-verification-methodology"
          className="text-primary hover:underline"
        >
          source verification methodology
        </Link>
        .
      </p>
    </section>
  );
}
