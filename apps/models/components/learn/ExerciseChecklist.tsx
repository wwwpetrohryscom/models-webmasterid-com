/**
 * ExerciseChecklist — Markdown-style checklist of completion criteria.
 *
 * Pure visual element: the bullets render as unchecked boxes. The
 * exercise is complete when the reader has produced the evidence
 * artifact described in the layout — not when the boxes are checked.
 * No client JS, no persisted state.
 */
export function ExerciseChecklist({
  items,
  title = "Completion checklist",
}: {
  items: string[];
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
