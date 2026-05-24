#!/usr/bin/env node
/**
 * Indexing QA — checks the HTML markup and machine-readable endpoints
 * that search and AI crawlers actually consume.
 *
 * Usage:
 *   npm run qa:indexing
 *
 * Optional env:
 *   DOMAIN  Base URL (default: https://models.webmasterid.com)
 *
 * Checks for each sampled HTML page:
 *   - HTTP 200, content-type text/html
 *   - <title> present
 *   - <meta name="description"> present
 *   - <link rel="canonical" href="..."> present and absolute
 *   - <meta name="robots"> NOT noindex on indexable pages
 *   - <meta name="robots"> IS noindex on filtered URLs sampled below
 *   - At least one <script type="application/ld+json"> on detail/content pages
 *
 * Machine-readable checks:
 *   - /sitemap.xml — 200, application/xml, references key paths
 *   - /robots.txt — 200, text/plain, references sitemap
 *   - /llms.txt   — 200, text/plain, references research/docs/coverage/sources
 *
 * Plain Node + native fetch, no deps.
 */

const baseUrl = (process.env.DOMAIN ?? "https://models.webmasterid.com").replace(
  /\/$/,
  ""
);
const TIMEOUT_MS = 8_000;

const INDEXABLE_PAGES = [
  { path: "/", expectJsonLd: true, kind: "hub" },
  { path: "/models", expectJsonLd: true, kind: "hub" },
  { path: "/providers", expectJsonLd: true, kind: "hub" },
  { path: "/pricing", expectJsonLd: true, kind: "hub" },
  { path: "/compare", expectJsonLd: true, kind: "hub" },
  { path: "/coverage", expectJsonLd: true, kind: "hub" },
  { path: "/sources", expectJsonLd: true, kind: "hub" },
  { path: "/research", expectJsonLd: true, kind: "hub" },
  { path: "/docs", expectJsonLd: true, kind: "hub" },
  { path: "/models/claude-opus-4-7", expectJsonLd: true, kind: "detail" },
  { path: "/models/gemini-2-5-pro", expectJsonLd: true, kind: "detail" },
  { path: "/models/mistral-large-3", expectJsonLd: true, kind: "detail" },
  { path: "/providers/anthropic", expectJsonLd: true, kind: "detail" },
  { path: "/providers/google", expectJsonLd: true, kind: "detail" },
  {
    path: "/compare/gemini-2-5-pro-vs-claude-opus-4-7",
    expectJsonLd: true,
    kind: "detail",
  },
  {
    path: "/compare/claude-opus-4-7-vs-deepseek-v4-pro",
    expectJsonLd: true,
    kind: "detail",
  },
  { path: "/research/model-selection", expectJsonLd: true, kind: "detail" },
  { path: "/docs/pricing-fields", expectJsonLd: true, kind: "detail" },
  { path: "/reverification", expectJsonLd: true, kind: "hub" },
  { path: "/intelligence", expectJsonLd: true, kind: "hub" },
  { path: "/select", expectJsonLd: true, kind: "hub" },
  { path: "/use-cases", expectJsonLd: true, kind: "hub" },
  {
    path: "/use-cases/long-context-analysis",
    expectJsonLd: true,
    kind: "detail",
  },
  { path: "/compare/build", expectJsonLd: true, kind: "hub" },
  { path: "/docs/decision-workflow", expectJsonLd: true, kind: "detail" },
  { path: "/briefs/build", expectJsonLd: true, kind: "hub" },
  { path: "/docs/decision-briefs", expectJsonLd: true, kind: "detail" },
  { path: "/how-it-works", expectJsonLd: true, kind: "detail" },
  { path: "/demos", expectJsonLd: true, kind: "hub" },
  {
    path: "/demos/long-context-analysis",
    expectJsonLd: true,
    kind: "detail",
  },
  {
    path: "/examples/decision-brief",
    expectJsonLd: true,
    kind: "detail",
  },
  { path: "/learn", expectJsonLd: true, kind: "hub" },
  {
    path: "/learn/how-to-choose-ai-model",
    expectJsonLd: true,
    kind: "detail",
  },
  { path: "/learn/context-window", expectJsonLd: true, kind: "detail" },
  {
    path: "/learn/hosted-vs-first-party",
    expectJsonLd: true,
    kind: "detail",
  },
  { path: "/learn/pricing-references", expectJsonLd: true, kind: "detail" },
  { path: "/learn/model-lifecycle", expectJsonLd: true, kind: "detail" },
  { path: "/learn/testing-ai-models", expectJsonLd: true, kind: "detail" },
  { path: "/learn/multimodal-input", expectJsonLd: true, kind: "detail" },
  { path: "/learn/structured-output", expectJsonLd: true, kind: "detail" },
  {
    path: "/learn/status-aware-selection",
    expectJsonLd: true,
    kind: "detail",
  },
  {
    path: "/learn/benchmark-limitations",
    expectJsonLd: true,
    kind: "detail",
  },
  { path: "/learn/paths", expectJsonLd: true, kind: "hub" },
  { path: "/learn/path/beginner", expectJsonLd: true, kind: "hub" },
  { path: "/learn/path/developer", expectJsonLd: true, kind: "hub" },
  {
    path: "/learn/path/product-manager",
    expectJsonLd: true,
    kind: "hub",
  },
  { path: "/learn/path/governance", expectJsonLd: true, kind: "hub" },
  {
    path: "/learn/path/automation-specialist",
    expectJsonLd: true,
    kind: "hub",
  },
  { path: "/learn/exercises", expectJsonLd: true, kind: "hub" },
  {
    path: "/learn/exercises/build-first-shortlist",
    expectJsonLd: true,
    kind: "detail",
  },
  {
    path: "/learn/exercises/compare-context-windows",
    expectJsonLd: true,
    kind: "detail",
  },
  {
    path: "/learn/exercises/map-hosted-provider",
    expectJsonLd: true,
    kind: "detail",
  },
  {
    path: "/learn/exercises/review-pricing-reference",
    expectJsonLd: true,
    kind: "detail",
  },
  {
    path: "/learn/exercises/inspect-model-lifecycle",
    expectJsonLd: true,
    kind: "detail",
  },
  {
    path: "/learn/exercises/create-decision-brief",
    expectJsonLd: true,
    kind: "detail",
  },
  {
    path: "/learn/exercises/check-source-freshness",
    expectJsonLd: true,
    kind: "detail",
  },
  {
    path: "/learn/exercises/plan-external-model-test",
    expectJsonLd: true,
    kind: "detail",
  },
  { path: "/lab", expectJsonLd: true, kind: "hub" },
  {
    path: "/lab/prompt-testing-basics",
    expectJsonLd: true,
    kind: "detail",
  },
  {
    path: "/lab/structured-output-testing",
    expectJsonLd: true,
    kind: "detail",
  },
  {
    path: "/lab/long-context-testing",
    expectJsonLd: true,
    kind: "detail",
  },
  {
    path: "/lab/multimodal-input-testing",
    expectJsonLd: true,
    kind: "detail",
  },
  {
    path: "/lab/automation-workflow-testing",
    expectJsonLd: true,
    kind: "detail",
  },
  {
    path: "/lab/model-regression-testing",
    expectJsonLd: true,
    kind: "detail",
  },
  { path: "/lab/templates", expectJsonLd: true, kind: "hub" },
  {
    path: "/lab/templates/model-evaluation-plan",
    expectJsonLd: true,
    kind: "detail",
  },
  {
    path: "/lab/templates/prompt-test-matrix",
    expectJsonLd: true,
    kind: "detail",
  },
  {
    path: "/lab/templates/automation-risk-checklist",
    expectJsonLd: true,
    kind: "detail",
  },
  { path: "/lab/prompts", expectJsonLd: true, kind: "hub" },
  {
    path: "/lab/prompts/summarization-quality",
    expectJsonLd: true,
    kind: "detail",
  },
  {
    path: "/lab/prompts/structured-extraction",
    expectJsonLd: true,
    kind: "detail",
  },
  {
    path: "/lab/prompts/long-context-recall",
    expectJsonLd: true,
    kind: "detail",
  },
  {
    path: "/lab/prompts/instruction-following",
    expectJsonLd: true,
    kind: "detail",
  },
  {
    path: "/lab/prompts/refusal-boundary",
    expectJsonLd: true,
    kind: "detail",
  },
  {
    path: "/lab/prompts/automation-robustness",
    expectJsonLd: true,
    kind: "detail",
  },
  { path: "/lab/evaluation", expectJsonLd: true, kind: "detail" },
];

const FILTERED_NOINDEX_PAGES = [
  "/models?provider=anthropic",
  "/pricing?provider=anthropic",
  "/compare?verification=verified",
  "/sources?provider=anthropic",
  "/reverification?priority=high",
  "/select?useCase=long-context-analysis",
  "/compare/build?useCase=long-context-analysis",
  "/briefs/build?useCase=long-context-analysis",
];

const MACHINE_ENDPOINTS = [
  { path: "/sitemap.xml", contentType: /application\/xml|text\/xml/ },
  { path: "/robots.txt", contentType: /text\/plain/ },
  { path: "/llms.txt", contentType: /text\/plain/ },
];

function fmt(v, w) {
  const s = String(v ?? "");
  return s.length >= w ? s.slice(0, w - 1) + "…" : s.padEnd(w, " ");
}

function printRow(cols, row) {
  process.stdout.write(
    cols.map((c) => fmt(row[c.key], c.width)).join(" | ") + "\n"
  );
}

async function get(url) {
  try {
    const res = await fetch(url, {
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = await res.text();
    return { ok: true, status: res.status, headers: res.headers, body };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function checkHtml({ path, body, expectJsonLd, kind, expectNoindex }) {
  const issues = [];
  const titleMatch = body.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (!titleMatch || !titleMatch[1].trim()) issues.push("no <title>");

  if (
    !/<meta\s+name=["']description["']\s+content=["'][^"']{4,}["']/i.test(body)
  ) {
    issues.push("no meta description");
  }

  const canonical = body.match(
    /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i
  );
  if (!canonical) {
    issues.push("no canonical");
  } else if (!/^https?:\/\//.test(canonical[1])) {
    issues.push("canonical not absolute");
  }

  const robots = body.match(
    /<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i
  );
  const robotsValue = robots ? robots[1].toLowerCase() : null;
  if (expectNoindex && (!robotsValue || !robotsValue.includes("noindex"))) {
    issues.push("expected noindex");
  }
  if (
    !expectNoindex &&
    robotsValue &&
    robotsValue.includes("noindex") &&
    kind !== "noindex-by-design"
  ) {
    issues.push("unexpected noindex");
  }

  if (expectJsonLd) {
    if (!/<script[^>]*type=["']application\/ld\+json["']/i.test(body)) {
      issues.push("no JSON-LD");
    }
  }

  return issues;
}

const rows = [];

// ---------------- HTML pages ----------------
for (const page of INDEXABLE_PAGES) {
  const r = await get(`${baseUrl}${page.path}`);
  if (!r.ok) {
    rows.push({
      path: page.path,
      http: "—",
      contentType: "—",
      result: "fail",
      issues: `fetch failed: ${r.error}`,
    });
    continue;
  }
  const ct = r.headers.get("content-type") ?? "—";
  const issues = [];
  if (r.status !== 200) issues.push(`http ${r.status}`);
  if (!/text\/html/i.test(ct)) issues.push("not text/html");
  if (issues.length === 0) {
    issues.push(...checkHtml({ ...page, body: r.body }));
  }
  rows.push({
    path: page.path,
    http: String(r.status),
    contentType: ct,
    result: issues.length ? "fail" : "pass",
    issues: issues.length ? issues.join("; ") : "",
  });
}

// ---------------- Filtered URLs must be noindex ----------------
for (const fpath of FILTERED_NOINDEX_PAGES) {
  const r = await get(`${baseUrl}${fpath}`);
  if (!r.ok) {
    rows.push({
      path: fpath,
      http: "—",
      contentType: "—",
      result: "fail",
      issues: `fetch failed: ${r.error}`,
    });
    continue;
  }
  const ct = r.headers.get("content-type") ?? "—";
  const issues = [];
  if (r.status !== 200) issues.push(`http ${r.status}`);
  if (!/text\/html/i.test(ct)) issues.push("not text/html");
  if (issues.length === 0) {
    issues.push(
      ...checkHtml({
        path: fpath,
        body: r.body,
        expectJsonLd: false,
        kind: "filtered",
        expectNoindex: true,
      })
    );
  }
  rows.push({
    path: fpath,
    http: String(r.status),
    contentType: ct,
    result: issues.length ? "fail" : "pass",
    issues: issues.length ? issues.join("; ") : "noindex enforced",
  });
}

// ---------------- Machine-readable endpoints ----------------
for (const ep of MACHINE_ENDPOINTS) {
  const r = await get(`${baseUrl}${ep.path}`);
  if (!r.ok) {
    rows.push({
      path: ep.path,
      http: "—",
      contentType: "—",
      result: "fail",
      issues: `fetch failed: ${r.error}`,
    });
    continue;
  }
  const ct = r.headers.get("content-type") ?? "—";
  const issues = [];
  if (r.status !== 200) issues.push(`http ${r.status}`);
  if (!ep.contentType.test(ct)) issues.push(`content-type ${ct}`);

  if (ep.path === "/sitemap.xml") {
    for (const must of [
      "/models",
      "/coverage",
      "/sources",
      "/research",
      "/docs",
    ]) {
      if (!r.body.includes(must)) issues.push(`sitemap missing ${must}`);
    }
  }
  if (ep.path === "/robots.txt") {
    if (!/sitemap/i.test(r.body)) issues.push("robots missing sitemap line");
  }
  if (ep.path === "/llms.txt") {
    for (const must of [
      "/research",
      "/docs",
      "/coverage",
      "/sources",
    ]) {
      if (!r.body.includes(must)) issues.push(`llms.txt missing ${must}`);
    }
  }

  rows.push({
    path: ep.path,
    http: String(r.status),
    contentType: ct,
    result: issues.length ? "fail" : "pass",
    issues: issues.length ? issues.join("; ") : "",
  });
}

// ---------------- Print table + exit ----------------
const cols = [
  { key: "path", label: "PATH", width: 50 },
  { key: "http", label: "HTTP", width: 5 },
  { key: "contentType", label: "CONTENT-TYPE", width: 22 },
  { key: "result", label: "RESULT", width: 6 },
  { key: "issues", label: "ISSUES / NOTE", width: 50 },
];

process.stdout.write(`indexing-qa — base=${baseUrl}\n\n`);
process.stdout.write(
  cols.map((c) => fmt(c.label, c.width)).join(" | ") + "\n"
);
process.stdout.write(
  cols.map((c) => "-".repeat(c.width)).join("-+-") + "\n"
);
for (const r of rows) printRow(cols, r);

const failed = rows.filter((r) => r.result === "fail");
if (failed.length === 0) {
  process.stdout.write(
    `\nindexing-qa — ${rows.length}/${rows.length} checks passed.\n`
  );
  process.exit(0);
} else {
  process.stderr.write(
    `\nindexing-qa — ${failed.length} of ${rows.length} checks failed.\n`
  );
  process.exit(1);
}
