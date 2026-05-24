/**
 * PromptObservationChecklist — renders the observation-checklist /
 * comparison-notes lists on a prompt set detail page. Pure server
 * component, no client JS.
 */
export function PromptObservationChecklist({
  title,
  caption,
  items,
}: {
  title: string;
  caption?: string;
  items: string[];
}) {
  if (!items.length) return null;
  return (
    <section
      aria-label={title}
      className="card-surface space-y-2 p-5 text-sm not-prose"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {title}
      </p>
      {caption ? (
        <p className="text-xs text-muted-foreground">{caption}</p>
      ) : null}
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-muted-foreground"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 inline-grid h-4 w-4 flex-none place-items-center rounded border border-border bg-card text-[10px] text-muted-foreground"
            >
              ☐
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
