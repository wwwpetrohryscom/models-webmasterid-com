import { siteConfig } from "@/lib/site-config";
import { models } from "@/data/models";
import { comparisons } from "@/data/comparisons";

export const dynamic = "force-static";

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc822(date: string | null | undefined): string {
  const d = date ? new Date(date) : new Date(siteConfig.buildDate);
  return d.toUTCString();
}

export function GET() {
  const items: { title: string; link: string; description: string; pubDate: string }[] = [
    ...models.map((m) => ({
      title: m.name,
      link: `${siteConfig.url}/models/${m.slug}`,
      description: m.description,
      pubDate: rfc822(m.updatedDate),
    })),
    ...comparisons.map((c) => ({
      title: c.name,
      link: `${siteConfig.url}/compare/${c.slug}`,
      description: c.description,
      pubDate: rfc822(c.updatedDate),
    })),
  ];

  const itemsXml = items
    .map(
      (it) => `    <item>
      <title>${escape(it.title)}</title>
      <link>${escape(it.link)}</link>
      <guid isPermaLink="true">${escape(it.link)}</guid>
      <pubDate>${it.pubDate}</pubDate>
      <description>${escape(it.description)}</description>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escape(siteConfig.name)}</title>
    <link>${escape(siteConfig.url)}</link>
    <description>${escape(siteConfig.description)}</description>
    <language>en</language>
    <lastBuildDate>${rfc822(siteConfig.buildDate)}</lastBuildDate>
${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
