/**
 * CommonMistakes — "Common mistakes" card with mistake/why-it-hurts pairs.
 *
 * Lesson pages use this to surface the failure modes a reader is most
 * likely to walk into, with a short why-it-matters note for each.
 * Server component, no client JS.
 */
export function CommonMistakes({
  title = "Common mistakes",
  items,
}: {
  title?: string;
  items: { mistake: string; why: string }[];
}) {
  return (
    <section
      aria-label={title}
      className="card-surface space-y-3 p-5 text-sm not-prose"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {title}
      </p>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {item.mistake}
            </p>
            <p className="text-xs text-muted-foreground">{item.why}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
