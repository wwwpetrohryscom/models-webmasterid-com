import Link from "next/link";
import type {
  ResourceArtifact,
  ResourceAudience,
  ResourceFilters,
  ResourceGoal,
  ResourceStage,
  ResourceType,
} from "@/lib/resource-graph";
import {
  RESOURCE_ARTIFACTS,
  RESOURCE_AUDIENCES,
  RESOURCE_GOALS,
  RESOURCE_LABELS,
  RESOURCE_STAGES,
  RESOURCE_TYPES,
} from "@/lib/resource-graph";

function buildHref(
  current: ResourceFilters,
  key: keyof ResourceFilters,
  value: string | undefined
): string {
  const next: Record<string, string> = {};
  for (const k of Object.keys(current) as (keyof ResourceFilters)[]) {
    const v = current[k];
    if (v) next[k] = v;
  }
  if (value === undefined) {
    delete next[key];
  } else {
    next[key] = value;
  }
  const qs = new URLSearchParams(next).toString();
  return qs ? `/resources?${qs}` : "/resources";
}

function FilterChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "rounded-full border border-primary/40 bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary"
          : "rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-foreground transition hover:border-primary/30"
      }
    >
      {label}
    </Link>
  );
}

function FilterGroup<T extends string>({
  title,
  param,
  values,
  labels,
  current,
}: {
  title: string;
  param: keyof ResourceFilters;
  values: readonly T[];
  labels: Record<T, string>;
  current: ResourceFilters;
}) {
  const active = current[param] as T | undefined;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <FilterChip
          href={buildHref(current, param, undefined)}
          label="Any"
          active={!active}
        />
        {values.map((v) => (
          <FilterChip
            key={v}
            href={buildHref(current, param, v)}
            label={labels[v]}
            active={active === v}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * ResourceFilterBar — link-driven filter UI for the /resources page.
 * Every chip is a GET link; there is no client state. Selecting one
 * filter rebuilds the URL with the new query param; "Any" removes
 * the filter.
 */
export function ResourceFilterBar({
  current,
}: {
  current: ResourceFilters;
}) {
  const activeKeys = (Object.keys(current) as (keyof ResourceFilters)[])
    .filter((k) => Boolean(current[k]));
  return (
    <section
      aria-label="Resource filters"
      className="card-surface space-y-4 p-5 text-sm"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Filters
        </p>
        {activeKeys.length ? (
          <Link
            href="/resources"
            className="text-xs text-primary hover:underline"
          >
            Reset all filters →
          </Link>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Every filter is a link — no client state, no accounts, no
        progress tracking. Filtered pages are noindex,follow; the
        canonical URL is{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
          /resources
        </code>
        .
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <FilterGroup<ResourceAudience>
          title="Audience"
          param="audience"
          values={RESOURCE_AUDIENCES}
          labels={RESOURCE_LABELS.audiences}
          current={current}
        />
        <FilterGroup<ResourceGoal>
          title="Goal"
          param="goal"
          values={RESOURCE_GOALS}
          labels={RESOURCE_LABELS.goals}
          current={current}
        />
        <FilterGroup<ResourceStage>
          title="Stage"
          param="stage"
          values={RESOURCE_STAGES}
          labels={RESOURCE_LABELS.stages}
          current={current}
        />
        <FilterGroup<ResourceType>
          title="Resource type"
          param="resourceType"
          values={RESOURCE_TYPES}
          labels={RESOURCE_LABELS.types}
          current={current}
        />
        <FilterGroup<ResourceArtifact>
          title="Evidence artifact"
          param="artifact"
          values={RESOURCE_ARTIFACTS}
          labels={RESOURCE_LABELS.artifacts}
          current={current}
        />
        <FilterGroup<"beginner" | "intermediate">
          title="Difficulty"
          param="difficulty"
          values={["beginner", "intermediate"] as const}
          labels={{ beginner: "Beginner", intermediate: "Intermediate" }}
          current={current}
        />
      </div>
    </section>
  );
}
