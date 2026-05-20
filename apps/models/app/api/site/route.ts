import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/site-config";

export const dynamic = "force-static";

const ROUTES = [
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

export function GET() {
  return NextResponse.json(
    {
      name: siteConfig.name,
      description: siteConfig.description,
      url: siteConfig.url,
      domain: siteConfig.domain,
      ecosystem: siteConfig.ecosystem,
      positioning: siteConfig.positioning,
      routes: ROUTES,
      sitemap: `${siteConfig.url}/sitemap.xml`,
      robots: `${siteConfig.url}/robots.txt`,
      llms: `${siteConfig.url}/llms.txt`,
      rss: `${siteConfig.url}/rss.xml`,
      health: `${siteConfig.url}/api/health`,
      updatedDate: siteConfig.buildDate,
      verificationPolicy:
        "Data not verified unless backed by primary source citation.",
    },
    {
      status: 200,
      headers: {
        "Cache-Control":
          "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
