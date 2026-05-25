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
    { label: "Audience hub (Who this is for)", path: "/for" },
    { label: "For developers", path: "/for/developers" },
    { label: "For product teams", path: "/for/product-teams" },
    {
      label: "For automation specialists",
      path: "/for/automation-specialists",
    },
    { label: "For governance teams", path: "/for/governance-teams" },
    {
      label: "Platform positioning (what this is / is not)",
      path: "/docs/platform-positioning",
    },
    { label: "Workflow kits (hub)", path: "/kits" },
    {
      label: "Kit — developer model evaluation",
      path: "/kits/developer-model-evaluation",
    },
    {
      label: "Kit — automation workflow testing",
      path: "/kits/automation-workflow-testing",
    },
    {
      label: "Kit — product model selection",
      path: "/kits/product-model-selection",
    },
    {
      label: "Kit — governance review",
      path: "/kits/governance-review",
    },
    { label: "Learn AI model selection (hub)", path: "/learn" },
    { label: "All learning paths", path: "/learn/paths" },
    { label: "Beginner learning path", path: "/learn/path/beginner" },
    { label: "Developer learning path", path: "/learn/path/developer" },
    {
      label: "Product manager learning path",
      path: "/learn/path/product-manager",
    },
    {
      label: "Governance learning path",
      path: "/learn/path/governance",
    },
    {
      label: "Automation specialist learning path",
      path: "/learn/path/automation-specialist",
    },
    {
      label: "Practical exercises (hub)",
      path: "/learn/exercises",
    },
    {
      label: "Exercise — build first shortlist",
      path: "/learn/exercises/build-first-shortlist",
    },
    {
      label: "Exercise — compare context windows",
      path: "/learn/exercises/compare-context-windows",
    },
    {
      label: "Exercise — map hosted provider",
      path: "/learn/exercises/map-hosted-provider",
    },
    {
      label: "Exercise — review pricing reference",
      path: "/learn/exercises/review-pricing-reference",
    },
    {
      label: "Exercise — inspect model lifecycle",
      path: "/learn/exercises/inspect-model-lifecycle",
    },
    {
      label: "Exercise — create decision brief",
      path: "/learn/exercises/create-decision-brief",
    },
    {
      label: "Exercise — check source freshness",
      path: "/learn/exercises/check-source-freshness",
    },
    {
      label: "Exercise — plan external model test",
      path: "/learn/exercises/plan-external-model-test",
    },
    {
      label: "Lesson — how to choose an AI model",
      path: "/learn/how-to-choose-ai-model",
    },
    { label: "Lesson — context windows", path: "/learn/context-window" },
    {
      label: "Lesson — hosted vs first-party",
      path: "/learn/hosted-vs-first-party",
    },
    {
      label: "Lesson — pricing references",
      path: "/learn/pricing-references",
    },
    { label: "Lesson — model lifecycle", path: "/learn/model-lifecycle" },
    { label: "Lesson — testing AI models", path: "/learn/testing-ai-models" },
    { label: "Lesson — multimodal input", path: "/learn/multimodal-input" },
    {
      label: "Lesson — structured output",
      path: "/learn/structured-output",
    },
    {
      label: "Lesson — status-aware selection",
      path: "/learn/status-aware-selection",
    },
    {
      label: "Lesson — benchmark limitations",
      path: "/learn/benchmark-limitations",
    },
    { label: "AI Usage Lab (hub)", path: "/lab" },
    {
      label: "Lab playbook — prompt testing basics",
      path: "/lab/prompt-testing-basics",
    },
    {
      label: "Lab playbook — structured output testing",
      path: "/lab/structured-output-testing",
    },
    {
      label: "Lab playbook — long-context testing",
      path: "/lab/long-context-testing",
    },
    {
      label: "Lab playbook — multimodal input testing",
      path: "/lab/multimodal-input-testing",
    },
    {
      label: "Lab playbook — automation workflow testing",
      path: "/lab/automation-workflow-testing",
    },
    {
      label: "Lab playbook — model regression testing",
      path: "/lab/model-regression-testing",
    },
    { label: "Lab templates (hub)", path: "/lab/templates" },
    {
      label: "Lab template — model evaluation plan",
      path: "/lab/templates/model-evaluation-plan",
    },
    {
      label: "Lab template — prompt test matrix",
      path: "/lab/templates/prompt-test-matrix",
    },
    {
      label: "Lab template — automation risk checklist",
      path: "/lab/templates/automation-risk-checklist",
    },
    {
      label: "Evaluation prompt library (hub)",
      path: "/lab/prompts",
    },
    {
      label: "Prompt set — summarization quality",
      path: "/lab/prompts/summarization-quality",
    },
    {
      label: "Prompt set — structured extraction",
      path: "/lab/prompts/structured-extraction",
    },
    {
      label: "Prompt set — long-context recall",
      path: "/lab/prompts/long-context-recall",
    },
    {
      label: "Prompt set — instruction following",
      path: "/lab/prompts/instruction-following",
    },
    {
      label: "Prompt set — refusal boundary",
      path: "/lab/prompts/refusal-boundary",
    },
    {
      label: "Prompt set — automation robustness",
      path: "/lab/prompts/automation-robustness",
    },
    {
      label: "Lab evaluation guide",
      path: "/lab/evaluation",
    },
    { label: "How it works (walkthrough)", path: "/how-it-works" },
    { label: "Guided demos", path: "/demos" },
    {
      label: "Example decision brief",
      path: "/examples/decision-brief",
    },
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
    { label: "Decision brief builder", path: "/briefs/build" },
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
