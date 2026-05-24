import Link from "next/link";

export interface TeachingExampleData {
  situation: string;
  decision: string;
  fields: string[];
  nextRoutes: Array<{ label: string; href: string }>;
}

/**
 * TeachingExample — a generic, illustrative scenario that names the
 * verified fields a reader should inspect next. The component is
 * pure server-rendered and never describes a specific model or
 * recommendation.
 */
export function TeachingExample({
  example,
  title = "Teaching example",
}: {
  example: TeachingExampleData;
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
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        Illustrative — not a recommendation.
      </p>
      <div className="space-y-2 text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">Situation:</span>{" "}
          {example.situation}
        </p>
        <p>
          <span className="font-semibold text-foreground">Decision to make:</span>{" "}
          {example.decision}
        </p>
        <div>
          <p className="font-semibold text-foreground">
            Verified fields that matter:
          </p>
          <ul className="ml-5 list-disc space-y-0.5">
            {example.fields.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-foreground">What to inspect next:</p>
          <ul className="ml-5 list-disc space-y-0.5">
            {example.nextRoutes.map((r) => (
              <li key={r.href}>
                <Link
                  href={r.href}
                  className="text-primary hover:underline"
                >
                  {r.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
