/**
 * OutcomeArtifactList — chip list of the evidence artifacts the
 * reader will leave the outcome flow with. Server component.
 */
export function OutcomeArtifactList({
  artifacts,
  title = "What you will produce",
}: {
  artifacts: string[];
  title?: string;
}) {
  if (!artifacts.length) return null;
  return (
    <section
      aria-label={title}
      className="card-surface space-y-2 p-5 text-sm"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {title}
      </p>
      <p className="text-xs text-muted-foreground">
        Completion is the named Markdown artifacts in your hands —
        not a certificate, badge, or progress bar.
      </p>
      <ul className="flex flex-wrap gap-1.5 pt-1">
        {artifacts.map((a) => (
          <li
            key={a}
            className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary"
          >
            {a}
          </li>
        ))}
      </ul>
    </section>
  );
}
