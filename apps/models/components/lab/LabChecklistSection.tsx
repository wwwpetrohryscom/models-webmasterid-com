/**
 * LabChecklistSection — generic bullet-list section used to render
 * the playbook fields (test setup, observations, failure modes, etc.)
 * with consistent visual treatment. Server component, no client JS.
 */
export function LabChecklistSection({
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
              className="mt-1 inline-block h-2 w-2 flex-none rounded-full bg-primary/70"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
