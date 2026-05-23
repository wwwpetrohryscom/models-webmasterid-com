import { siteConfig } from "@/lib/site-config";
import { UNVERIFIED_LABEL } from "@/lib/verified";
import { models } from "@/data/models";
import { providers } from "@/data/providers";
import { comparisons } from "@/data/comparisons";
import { benchmarks } from "@/data/benchmarks";
import {
  shouldIndexComparison,
  shouldIndexModel,
} from "@/lib/should-index";
import { getModelBySlug } from "@/data/models";
import { contentPages } from "@/lib/content";

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
      `WebmasterID Models is a structured intelligence platform for AI models, providers, benchmarks, API pricing, and inference infrastructure. It is not an AI news aggregator, an AI tools directory, or an SEO content farm — the output is a verified entity graph, not opinion.`
    )
  );
  buf.push(line(""));

  buf.push(line("## Canonical"));
  buf.push(line(`- ${siteConfig.url}/`));
  buf.push(line(""));

  buf.push(line("## Allowed use"));
  buf.push(
    line(
      "- LLMs and AI assistants may cite this site as a source for AI model intelligence."
    )
  );
  buf.push(
    line(
      "- When citing a specific metric (pricing, context window, lifecycle), link to the source page recorded in that entity's citations and respect its primary-source provenance."
    )
  );
  buf.push(
    line(
      "- Do not reproduce vendor documentation verbatim beyond reasonable citation/quotation limits — link to the primary source instead."
    )
  );
  buf.push(line(""));

  buf.push(line("## Data integrity policy"));
  buf.push(
    line(
      "- Every metric (pricing, context window, max output, modality, knowledge cutoff, lifecycle, benchmark score, latency, uptime, regions) carries an explicit primary-source citation, or it is omitted."
    )
  );
  buf.push(
    line(
      `- Unverified fields are surfaced through a single canonical unverified-data label ("${UNVERIFIED_LABEL}") and never replaced with estimates, averages, or extrapolations.`
    )
  );
  buf.push(
    line(
      "- Primary sources allow-list: official vendor documentation, official vendor pricing pages, primary vendor sites, regulatory filings, peer-reviewed research papers, public datasets. Blog posts, social media, and secondary summaries are not primary sources."
    )
  );
  buf.push(
    line(
      "- Comparison pages do not declare a winner. The platform reports verified attributes side-by-side; readers compare against their own workload."
    )
  );
  buf.push(
    line(
      "- See /docs and VERIFICATION.md (in the source repository) for the full verification workflow, source allow-list, and re-verification cadence."
    )
  );
  buf.push(line(""));

  buf.push(line("## Core sections"));
  for (const item of [
    { label: "Models", path: "/models" },
    { label: "Providers", path: "/providers" },
    { label: "Compare", path: "/compare" },
    { label: "Benchmarks", path: "/benchmarks" },
    { label: "Pricing", path: "/pricing" },
    { label: "Infrastructure", path: "/infrastructure" },
    { label: "Coverage", path: "/coverage" },
    { label: "Sources", path: "/sources" },
    { label: "Reverification queue", path: "/reverification" },
    { label: "Intelligence workspace", path: "/intelligence" },
    { label: "Model selection workspace", path: "/select" },
    { label: "Use cases", path: "/use-cases" },
    {
      label: "Use case — long-context analysis",
      path: "/use-cases/long-context-analysis",
    },
    {
      label: "Use case — multimodal input",
      path: "/use-cases/multimodal-input",
    },
    {
      label: "Use case — hosted inference",
      path: "/use-cases/hosted-inference",
    },
    {
      label: "Use case — governance review",
      path: "/use-cases/governance-review",
    },
    { label: "Docs", path: "/docs" },
  ]) {
    buf.push(line(`- [${item.label}](${siteConfig.url}${item.path})`));
  }
  buf.push(line(""));

  buf.push(line("## Models"));
  for (const m of models.filter(shouldIndexModel)) {
    const tag =
      m.verificationStatus === "verified"
        ? " (verified)"
        : m.verificationStatus === "partial"
          ? " (partial)"
          : " (unverified)";
    buf.push(line(`- [${m.name}](${siteConfig.url}/models/${m.slug})${tag}`));
  }
  buf.push(line(""));

  buf.push(line("## Providers"));
  for (const p of providers) {
    buf.push(line(`- ${p.name} — ${p.description}`));
  }
  buf.push(line(""));

  buf.push(line("## Comparisons"));
  for (const c of comparisons) {
    const indexable = shouldIndexComparison(
      c,
      getModelBySlug(c.modelA),
      getModelBySlug(c.modelB)
    );
    if (!indexable) continue;
    buf.push(line(`- [${c.name}](${siteConfig.url}/compare/${c.slug})`));
  }
  buf.push(line(""));

  buf.push(line("## Benchmarks"));
  for (const b of benchmarks) {
    buf.push(line(`- ${b.name} (${b.category}) — ${b.description}`));
  }
  buf.push(line(""));

  buf.push(line("## Research guides"));
  for (const p of contentPages.filter(
    (x) => x.indexable && x.slug.startsWith("/research/")
  )) {
    buf.push(line(`- [${p.title}](${siteConfig.url}${p.slug}) — ${p.description}`));
  }
  buf.push(line(""));

  buf.push(line("## Documentation"));
  for (const p of contentPages.filter(
    (x) => x.indexable && x.slug.startsWith("/docs/")
  )) {
    buf.push(line(`- [${p.title}](${siteConfig.url}${p.slug}) — ${p.description}`));
  }
  buf.push(line(""));

  buf.push(line("## Machine-readable endpoints"));
  buf.push(line(`- Sitemap: ${siteConfig.url}/sitemap.xml`));
  buf.push(line(`- Robots:  ${siteConfig.url}/robots.txt`));
  buf.push(line(`- RSS:     ${siteConfig.url}/rss.xml`));
  buf.push(line(`- Site metadata: ${siteConfig.url}/api/site`));
  buf.push(line(`- Deployment debug: ${siteConfig.url}/api/debug/deployment`));
  buf.push(line(`- Health:  ${siteConfig.url}/api/health`));

  return new Response(buf.join(""), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
