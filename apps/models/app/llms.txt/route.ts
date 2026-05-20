import { siteConfig } from "@/lib/site-config";
import { UNVERIFIED_LABEL } from "@/lib/verified";
import { models } from "@/data/models";
import { providers } from "@/data/providers";
import { comparisons } from "@/data/comparisons";
import { benchmarks } from "@/data/benchmarks";

export const dynamic = "force-static";

function line(s: string): string {
  return `${s}\n`;
}

export function GET() {
  const buf: string[] = [];
  buf.push(line(`# ${siteConfig.name}`));
  buf.push(line(""));
  buf.push(line(`> ${siteConfig.positioning}.`));
  buf.push(line(""));
  buf.push(
    line(
      `WebmasterID Models is a structured intelligence platform for AI models, providers, benchmarks, API pricing, and inference infrastructure. Unverified metric values are explicitly marked with the canonical label "${UNVERIFIED_LABEL}" rather than estimated.`
    )
  );
  buf.push(line(""));

  buf.push(line("## Canonical"));
  buf.push(line(`- ${siteConfig.url}/`));
  buf.push(line(""));

  buf.push(line("## Core sections"));
  for (const item of [
    { label: "Models", path: "/models" },
    { label: "Providers", path: "/providers" },
    { label: "Compare", path: "/compare" },
    { label: "Benchmarks", path: "/benchmarks" },
    { label: "Pricing", path: "/pricing" },
    { label: "Infrastructure", path: "/infrastructure" },
    { label: "Status", path: "/status" },
    { label: "News", path: "/news" },
    { label: "Research", path: "/research" },
    { label: "Docs", path: "/docs" },
  ]) {
    buf.push(line(`- [${item.label}](${siteConfig.url}${item.path})`));
  }
  buf.push(line(""));

  buf.push(line("## Models"));
  for (const m of models) {
    buf.push(line(`- [${m.name}](${siteConfig.url}/models/${m.slug})`));
  }
  buf.push(line(""));

  buf.push(line("## Providers"));
  for (const p of providers) {
    buf.push(line(`- ${p.name} — ${p.description}`));
  }
  buf.push(line(""));

  buf.push(line("## Comparisons"));
  for (const c of comparisons) {
    buf.push(line(`- [${c.name}](${siteConfig.url}/compare/${c.slug})`));
  }
  buf.push(line(""));

  buf.push(line("## Benchmarks"));
  for (const b of benchmarks) {
    buf.push(line(`- ${b.name} (${b.category}) — ${b.description}`));
  }
  buf.push(line(""));

  buf.push(line("## Verification policy"));
  buf.push(
    line(
      `- Where a metric is not yet verified against an official primary source, this site displays the canonical label "${UNVERIFIED_LABEL}" rather than an estimate.`
    )
  );
  buf.push(
    line(
      "- Each entity carries verification metadata: sourceUrl, sourceName, sourceType, verificationStatus, lastCheckedAt, confidenceLevel."
    )
  );

  return new Response(buf.join(""), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
