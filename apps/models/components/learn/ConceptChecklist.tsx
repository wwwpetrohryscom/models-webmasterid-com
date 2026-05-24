/**
 * ConceptChecklist — "What to verify" / "What to look at" bullet list.
 *
 * Lesson pages use this for the actionable checklist a reader should
 * walk through after they understand the concept. Server component,
 * semantic HTML, no client JS.
 */
export function ConceptChecklist({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <section
      aria-label={title}
      className="card-surface space-y-3 p-5 text-sm not-prose"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {title}
      </p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-muted-foreground"
          >
            <span
              aria-hidden="true"
              className="mt-1 inline-block h-2 w-2 flex-none rounded-full bg-primary/70"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
