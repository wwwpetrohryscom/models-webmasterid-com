import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import { models } from "@/data/models";
import { comparisons } from "@/data/comparisons";
import { getModelBySlug } from "@/data/models";
import {
  shouldIndexComparison,
  shouldIndexModel,
  shouldIndexStaticRoute,
} from "@/lib/should-index";
import { contentPages } from "@/lib/content";

interface StaticRoute {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}

const STATIC_ROUTES: StaticRoute[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.9 },
  { path: "/demos", changeFrequency: "monthly", priority: 0.8 },
  {
    path: "/demos/long-context-analysis",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/demos/hosted-inference",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/demos/governance-review",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/examples/decision-brief",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  { path: "/models", changeFrequency: "weekly", priority: 0.9 },
  { path: "/providers", changeFrequency: "weekly", priority: 0.8 },
  { path: "/compare", changeFrequency: "weekly", priority: 0.8 },
  { path: "/benchmarks", changeFrequency: "weekly", priority: 0.7 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.8 },
  { path: "/infrastructure", changeFrequency: "weekly", priority: 0.6 },
  { path: "/coverage", changeFrequency: "weekly", priority: 0.7 },
  { path: "/sources", changeFrequency: "weekly", priority: 0.7 },
  { path: "/reverification", changeFrequency: "weekly", priority: 0.6 },
  { path: "/intelligence", changeFrequency: "weekly", priority: 0.8 },
  { path: "/select", changeFrequency: "weekly", priority: 0.8 },
  { path: "/use-cases", changeFrequency: "weekly", priority: 0.7 },
  { path: "/compare/build", changeFrequency: "weekly", priority: 0.7 },
  { path: "/briefs/build", changeFrequency: "weekly", priority: 0.7 },
  {
    path: "/use-cases/long-context-analysis",
    changeFrequency: "weekly",
    priority: 0.6,
  },
  {
    path: "/use-cases/multimodal-input",
    changeFrequency: "weekly",
    priority: 0.6,
  },
  {
    path: "/use-cases/hosted-inference",
    changeFrequency: "weekly",
    priority: 0.6,
  },
  {
    path: "/use-cases/governance-review",
    changeFrequency: "weekly",
    priority: 0.6,
  },
  { path: "/research", changeFrequency: "weekly", priority: 0.7 },
  { path: "/docs", changeFrequency: "monthly", priority: 0.5 },
  { path: "/learn", changeFrequency: "monthly", priority: 0.85 },
  {
    path: "/learn/how-to-choose-ai-model",
    changeFrequency: "monthly",
    priority: 0.75,
  },
  {
    path: "/learn/context-window",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/learn/hosted-vs-first-party",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/learn/pricing-references",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/learn/model-lifecycle",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/learn/testing-ai-models",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/learn/multimodal-input",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/learn/structured-output",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/learn/status-aware-selection",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/learn/benchmark-limitations",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/learn/paths",
    changeFrequency: "monthly",
    priority: 0.85,
  },
  {
    path: "/learn/path/beginner",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/learn/path/developer",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/learn/path/product-manager",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/learn/path/governance",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/learn/path/automation-specialist",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/learn/exercises",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/learn/exercises/build-first-shortlist",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/learn/exercises/compare-context-windows",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/learn/exercises/map-hosted-provider",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/learn/exercises/review-pricing-reference",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/learn/exercises/inspect-model-lifecycle",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/learn/exercises/create-decision-brief",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/learn/exercises/check-source-freshness",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/learn/exercises/plan-external-model-test",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  { path: "/lab", changeFrequency: "monthly", priority: 0.85 },
  {
    path: "/lab/prompt-testing-basics",
    changeFrequency: "monthly",
    priority: 0.75,
  },
  {
    path: "/lab/structured-output-testing",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/lab/long-context-testing",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/lab/multimodal-input-testing",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/lab/automation-workflow-testing",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/lab/model-regression-testing",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/lab/templates",
    changeFrequency: "monthly",
    priority: 0.75,
  },
  {
    path: "/lab/templates/model-evaluation-plan",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/lab/templates/prompt-test-matrix",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/lab/templates/automation-risk-checklist",
    changeFrequency: "monthly",
    priority: 0.7,
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const buildTime = new Date(siteConfig.buildDate);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.filter((r) =>
    shouldIndexStaticRoute(r.path)
  ).map((r) => ({
    url: `${siteConfig.url}${r.path === "/" ? "" : r.path}`,
    lastModified: buildTime,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const modelEntries: MetadataRoute.Sitemap = models
    .filter(shouldIndexModel)
    .map((m) => {
      const updated = m.updatedDate ? new Date(m.updatedDate) : buildTime;
      const verifiedBoost = m.verificationStatus === "verified" ? 0.1 : 0;
      return {
        url: `${siteConfig.url}/models/${m.slug}`,
        lastModified: updated,
        changeFrequency: "weekly" as const,
        priority: 0.6 + verifiedBoost,
      };
    });

  const comparisonEntries: MetadataRoute.Sitemap = comparisons
    .filter((c) =>
      shouldIndexComparison(
        c,
        getModelBySlug(c.modelA),
        getModelBySlug(c.modelB)
      )
    )
    .map((c) => ({
      url: `${siteConfig.url}/compare/${c.slug}`,
      lastModified: c.updatedDate ? new Date(c.updatedDate) : buildTime,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

  // Static routes always win — anything in STATIC_ROUTES is removed
  // from the content-registry pass so the sitemap never has a
  // duplicate URL entry. Top-level content pages (e.g.
  // `/how-it-works`) get their priority from STATIC_ROUTES.
  const staticPaths = new Set(STATIC_ROUTES.map((r) => r.path));
  const contentEntries: MetadataRoute.Sitemap = contentPages
    .filter((p) => p.indexable && !staticPaths.has(p.slug))
    .map((p) => ({
      url: `${siteConfig.url}${p.slug}`,
      lastModified: new Date(p.updatedDate),
      changeFrequency: "monthly" as const,
      priority: p.slug.startsWith("/research/") ? 0.6 : 0.55,
    }));

  return [
    ...staticEntries,
    ...modelEntries,
    ...comparisonEntries,
    ...contentEntries,
  ];
}
