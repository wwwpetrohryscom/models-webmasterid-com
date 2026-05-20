import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import { models } from "@/data/models";
import { comparisons } from "@/data/comparisons";

const STATIC_ROUTES = [
  "/",
  "/models",
  "/providers",
  "/compare",
  "/benchmarks",
  "/pricing",
  "/infrastructure",
  "/status",
  "/news",
  "/research",
  "/docs",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date(siteConfig.buildDate);
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${siteConfig.url}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));

  const modelEntries: MetadataRoute.Sitemap = models.map((m) => ({
    url: `${siteConfig.url}/models/${m.slug}`,
    lastModified: m.updatedDate ? new Date(m.updatedDate) : now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const comparisonEntries: MetadataRoute.Sitemap = comparisons.map((c) => ({
    url: `${siteConfig.url}/compare/${c.slug}`,
    lastModified: c.updatedDate ? new Date(c.updatedDate) : now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...modelEntries, ...comparisonEntries];
}
