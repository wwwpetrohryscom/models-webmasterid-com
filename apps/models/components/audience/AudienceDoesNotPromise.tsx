/**
 * AudienceDoesNotPromise — the explicit "what this audience page
 * does not promise" callout. Server component, no client JS.
 */
export function AudienceDoesNotPromise({
  items,
  title = "What this audience page does not promise",
}: {
  items: string[];
  title?: string;
}) {
  return (
    <section
      aria-label={title}
      className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {title}
      </p>
      <ul className="ml-5 list-disc space-y-1">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
