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

  const contentEntries: MetadataRoute.Sitemap = contentPages
    .filter((p) => p.indexable)
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
