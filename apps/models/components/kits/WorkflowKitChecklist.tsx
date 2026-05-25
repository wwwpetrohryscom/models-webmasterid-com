/**
 * WorkflowKitChecklist — non-interactive "final checklist" for a
 * workflow kit. Renders as unchecked boxes; no persistence, no
 * client state.
 */
export function WorkflowKitChecklist({
  items,
  title = "Final checklist",
  caution,
}: {
  items: string[];
  title?: string;
  caution?: string;
}) {
  if (!items.length) return null;
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
      {caution ? (
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Caution:</span>{" "}
          {caution}
        </p>
      ) : null}
    </section>
  );
}
