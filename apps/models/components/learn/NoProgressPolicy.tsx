/**
 * NoProgressPolicy — the explicit "we do not track you" / "there is
 * no certificate" / "completion is the artifact" callout the
 * curriculum pages render so the reader is not surprised.
 *
 * Server component, no client JS.
 */
export function NoProgressPolicy() {
  return (
    <section
      aria-label="No progress, no accounts, no certificates"
      className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        No progress, no accounts, no certificates
      </p>
      <ul className="ml-5 list-disc space-y-1">
        <li>
          No accounts — the catalogue does not have a login surface.
        </li>
        <li>
          No progress tracking — the catalogue does not store which
          pages you have visited.
        </li>
        <li>
          No certificates — the catalogue does not issue completion
          credentials, badges, or scores.
        </li>
        <li>
          Completion is the artifact you produce: a shortlist URL,
          a comparison URL, a Markdown brief, a freshness checklist,
          or a written test plan.
        </li>
      </ul>
    </section>
  );
}
