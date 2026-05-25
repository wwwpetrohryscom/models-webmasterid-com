import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { ResourceFilterBar } from "@/components/resources/ResourceFilterBar";
import { ResourceStageMap } from "@/components/resources/ResourceStageMap";
import { NextStepPanel } from "@/components/resources/NextStepPanel";
import { ResourceSummaryCards } from "@/components/resources/ResourceSummaryCards";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { isFilteredRoute, robotsMetadata } from "@/lib/should-index";
import {
  filterResources,
  getNextStepGroups,
  getResourceFinderSummary,
  RESOURCE_ARTIFACTS,
  RESOURCE_AUDIENCES,
  RESOURCE_GOALS,
  RESOURCE_LABELS,
  RESOURCE_STAGES,
  RESOURCE_TYPES,
  type ResourceArtifact,
  type ResourceAudience,
  type ResourceFilters,
  type ResourceGoal,
  type ResourceNode,
  type ResourceStage,
  type ResourceType,
} from "@/lib/resource-graph";

type SearchParams = Record<string, string | string[] | undefined>;

interface PageProps {
  searchParams: Promise<SearchParams>;
}

function readParam<T extends string>(
  params: SearchParams,
  key: string,
  allowed: readonly T[]
): T | undefined {
  const v = params[key];
  if (typeof v !== "string") return undefined;
  return (allowed as readonly string[]).includes(v) ? (v as T) : undefined;
}

function readFilters(params: SearchParams): ResourceFilters {
  return {
    audience: readParam<ResourceAudience>(params, "audience", RESOURCE_AUDIENCES),
    goal: readParam<ResourceGoal>(params, "goal", RESOURCE_GOALS),
    resourceType: readParam<ResourceType>(
      params,
      "resourceType",
      RESOURCE_TYPES
    ),
    stage: readParam<ResourceStage>(params, "stage", RESOURCE_STAGES),
    artifact: readParam<ResourceArtifact>(
      params,
      "artifact",
      RESOURCE_ARTIFACTS
    ),
    difficulty: readParam<"beginner" | "intermediate">(
      params,
      "difficulty",
      ["beginner", "intermediate"] as const
    ),
  };
}

function describeFilters(filters: ResourceFilters): string[] {
  const parts: string[] = [];
  if (filters.audience)
    parts.push(`audience: ${RESOURCE_LABELS.audiences[filters.audience]}`);
  if (filters.goal)
    parts.push(`goal: ${RESOURCE_LABELS.goals[filters.goal]}`);
  if (filters.stage)
    parts.push(`stage: ${RESOURCE_LABELS.stages[filters.stage]}`);
  if (filters.resourceType)
    parts.push(`type: ${RESOURCE_LABELS.types[filters.resourceType]}`);
  if (filters.artifact)
    parts.push(
      `artifact: ${RESOURCE_LABELS.artifacts[filters.artifact]}`
    );
  if (filters.difficulty)
    parts.push(`difficulty: ${filters.difficulty}`);
  return parts;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const filtered = isFilteredRoute(params);
  return {
    ...buildMetadata({
      title: "Resource finder",
      description:
        "Find the lesson, exercise, lab playbook, prompt set, kit, or evidence workflow that matches your role and task. Server-rendered link filters; no recommendations, no rankings, no client-side state.",
      path: "/resources",
      keywords: [
        "ai model resource finder",
        "model evaluation resources",
        "learning resources",
        "resource map",
      ],
    }),
    robots: robotsMetadata(!filtered),
  };
}

function groupByStage(
  resources: ResourceNode[]
): Map<ResourceStage, ResourceNode[]> {
  const out = new Map<ResourceStage, ResourceNode[]>();
  for (const s of RESOURCE_STAGES) out.set(s, []);
  for (const r of resources) {
    out.get(r.stage)!.push(r);
  }
  return out;
}

export default async function ResourcesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = readFilters(params);
  const filtered = isFilteredRoute(params);
  const summary = getResourceFinderSummary();
  const matched = filterResources(filters);
  const grouped = groupByStage(matched);
  const activeDescriptions = describeFilters(filters);

  return (
    <PageShell
      eyebrow="Find"
      title="Resource finder"
      intro="Find the lesson, exercise, lab playbook, prompt set, kit, or evidence workflow that matches your role and task. Every link below opens an existing surface — the finder routes you in, it does not recommend a model."
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Resources", href: "/resources" },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Resources", href: "/resources" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Resource finder",
            url: `${siteConfig.url}/resources`,
            description:
              "Server-rendered finder across every product surface — lessons, exercises, lab playbooks, prompt sets, workflow kits, outcomes, audiences, demos, and evidence workspaces.",
            dateModified: siteConfig.buildDate,
            isPartOf: { "@type": "WebSite", url: siteConfig.url },
          },
        ]}
      />

      <ResourceSummaryCards summary={summary} />

      <NextStepPanel groups={getNextStepGroups()} />

      <ResourceStageMap summary={summary} />

      <ResourceFilterBar current={filters} />

      <section
        aria-label="Filtered resource results"
        className="space-y-4"
      >
        <SectionHeader
          eyebrow="Results"
          title={`${matched.length} resources`}
          description={
            filtered
              ? `Filtered view: ${activeDescriptions.join(" · ")}. Canonical URL stays /resources; this filtered URL is noindex,follow.`
              : "Showing every resource in the graph. Apply filters above to narrow the view."
          }
          as="h2"
        />
        {matched.length === 0 ? (
          <aside
            className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
            aria-label="No resources match"
          >
            <p className="font-medium text-foreground">
              No resources match the current filter combination.
            </p>
            <p>
              Try a different combination, or start from one of the
              audience entry points:
            </p>
            <ul className="ml-5 list-disc space-y-1">
              <li>
                <Link
                  href="/for"
                  className="text-primary hover:underline"
                >
                  /for — pick the audience that matches your role.
                </Link>
              </li>
              <li>
                <Link
                  href="/learn"
                  className="text-primary hover:underline"
                >
                  /learn — concept lessons + role-based paths.
                </Link>
              </li>
              <li>
                <Link
                  href="/lab"
                  className="text-primary hover:underline"
                >
                  /lab — testing playbooks + evaluation prompts.
                </Link>
              </li>
            </ul>
          </aside>
        ) : (
          <div className="space-y-6">
            {RESOURCE_STAGES.map((stage) => {
              const items = grouped.get(stage)!;
              if (!items.length) return null;
              return (
                <section
                  key={stage}
                  aria-label={`${RESOURCE_LABELS.stages[stage]} resources`}
                  className="space-y-2"
                >
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                    {RESOURCE_LABELS.stages[stage]} ·{" "}
                    <span className="text-muted-foreground">
                      {items.length} resources
                    </span>
                  </h3>
                  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((r) => (
                      <li key={r.id}>
                        <ResourceCard resource={r} />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </section>

      <aside
        role="note"
        aria-label="Resource finder policy"
        className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          What the resource finder does not do
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            No model recommendations, no rankings, no winner claims.
            Resources route to workflows and evidence artifacts; the
            reader decides which model fits their workload.
          </li>
          <li>
            No live pricing, no live status, no fabricated benchmark
            scores or latency numbers.
          </li>
          <li>
            No production-readiness guarantee, no compliance
            certification, no SEO ranking guarantee, no automation
            reliability guarantee.
          </li>
          <li>
            No accounts, no client-side state, no progress tracking.
            Every filter is a GET link; filtered URLs are{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
              noindex, follow
            </code>{" "}
            with canonical{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
              /resources
            </code>
            .
          </li>
        </ul>
      </aside>

      <aside
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="Related routes"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Related routes
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <Link
              href="/docs/resource-map"
              className="text-primary hover:underline"
            >
              /docs/resource-map
            </Link>{" "}
            — how all resources fit together.
          </li>
          <li>
            <Link href="/for" className="text-primary hover:underline">
              /for
            </Link>{" "}
            — audience entry points.
          </li>
          <li>
            <Link
              href="/learn/paths"
              className="text-primary hover:underline"
            >
              /learn/paths
            </Link>{" "}
            — role-based learning paths.
          </li>
          <li>
            <Link href="/kits" className="text-primary hover:underline">
              /kits
            </Link>{" "}
            — workflow kits.
          </li>
          <li>
            <Link
              href="/use-cases"
              className="text-primary hover:underline"
            >
              /use-cases
            </Link>{" "}
            — outcome-driven entry points.
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
