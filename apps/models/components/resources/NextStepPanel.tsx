import Link from "next/link";
import type { NextStepGroup } from "@/lib/resource-graph";

/**
 * NextStepPanel — "I want to..." cards that each link to a
 * pre-filtered /resources view. Server component, all GET links.
 */
export function NextStepPanel({
  groups,
  title = 'I want to…',
}: {
  groups: NextStepGroup[];
  title?: string;
}) {
  return (
    <section
      aria-label={title}
      className="card-surface space-y-4 p-5 text-sm not-prose"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Next step
        </p>
        <p className="mt-1 text-base font-semibold text-foreground">
          {title}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Each card opens a filtered view of the resource finder —
          the canonical URL stays{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
            /resources
          </code>{" "}
          and filtered URLs are noindex,follow.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <li key={g.href}>
            <Link
              href={g.href}
              className="card-surface block h-full space-y-1 p-3 transition hover:border-primary/30"
            >
              <p className="text-sm font-semibold text-foreground">
                {g.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {g.description}
              </p>
              <p className="text-[11px] font-medium text-primary">
                Open filtered view →
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
