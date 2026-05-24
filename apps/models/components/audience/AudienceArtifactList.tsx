/**
 * AudienceArtifactList — "what you can produce" block for an
 * audience detail page. Renders artifact strings as chips so the
 * visitor can scan what they will end with. Server component.
 */
export function AudienceArtifactList({
  artifacts,
  title = "What you can produce here",
  caption,
}: {
  artifacts: string[];
  title?: string;
  caption?: string;
}) {
  if (!artifacts.length) return null;
  return (
    <section
      aria-label={title}
      className="card-surface space-y-3 p-5 text-sm not-prose"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {title}
      </p>
      {caption ? (
        <p className="text-xs text-muted-foreground">{caption}</p>
      ) : null}
      <ul className="flex flex-wrap gap-1.5">
        {artifacts.map((a) => (
          <li
            key={a}
            className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary"
          >
            {a}
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-muted-foreground">
        Every artifact is paste-ready Markdown, a deterministic
        catalogue URL, or a structured checklist — no generated
        scores, no model rankings.
      </p>
    </section>
  );
}
