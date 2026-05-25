import { ResourceCard } from "@/components/resources/ResourceCard";
import { getResourceNode } from "@/lib/resource-graph";

/**
 * RelatedResourceGrid — render a grid of related resources by
 * resolving each id from the resource graph. Pass any number of
 * resource ids; unknown ids are silently dropped so this is safe
 * to reuse on other surfaces. Server component.
 */
export function RelatedResourceGrid({
  ids,
  title = "Related resources",
  description,
}: {
  ids: string[];
  title?: string;
  description?: string;
}) {
  const resources = ids
    .map((id) => getResourceNode(id))
    .filter((n): n is NonNullable<typeof n> => Boolean(n));
  if (!resources.length) return null;
  return (
    <section
      aria-label={title}
      className="card-surface space-y-3 p-5 text-sm not-prose"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {title}
      </p>
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((r) => (
          <li key={r.id}>
            <ResourceCard resource={r} />
          </li>
        ))}
      </ul>
    </section>
  );
}
