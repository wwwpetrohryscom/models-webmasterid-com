import Link from "next/link";
import type { ResourceNode } from "@/lib/resource-graph";
import { RESOURCE_LABELS } from "@/lib/resource-graph";

/**
 * ResourceCard — server-rendered summary card for a single resource
 * graph node. Eyebrow shows resource type + stage; body shows the
 * title + description + artifact chips + audience chips. No client JS.
 */
export function ResourceCard({ resource }: { resource: ResourceNode }) {
  return (
    <Link
      href={resource.href}
      className="card-surface block h-full space-y-2 p-4 transition hover:border-primary/30 hover:shadow-elevated"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
        {RESOURCE_LABELS.types[resource.type]} ·{" "}
        {RESOURCE_LABELS.stages[resource.stage]}
      </p>
      <p className="text-base font-semibold text-foreground">
        {resource.title}
      </p>
      <p className="text-sm text-muted-foreground">{resource.description}</p>
      {resource.audiences.length ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {resource.audiences.slice(0, 3).map((a) => (
            <span
              key={a}
              className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-foreground"
            >
              {RESOURCE_LABELS.audiences[a]}
            </span>
          ))}
        </div>
      ) : null}
      {resource.artifacts.length ? (
        <div className="flex flex-wrap gap-1.5">
          {resource.artifacts.slice(0, 3).map((a) => (
            <span
              key={a}
              className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] text-primary"
            >
              {RESOURCE_LABELS.artifacts[a]}
            </span>
          ))}
        </div>
      ) : null}
      <p className="text-xs font-medium text-primary">Open →</p>
    </Link>
  );
}
