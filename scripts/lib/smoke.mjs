/**
 * Shared HTTP smoke-test core for production + local checks.
 *
 * Plain Node, no runtime dependencies. Uses the native `fetch` API
 * (Node 18+). Each script (smoke-production.mjs, smoke-local.mjs)
 * imports `runSmoke({ baseUrl, cronSecret })` and gets a pass/fail
 * exit code plus a compact ASCII table.
 *
 * The list of routes to check comes from this module, NOT from the
 * route-contract.ts TypeScript module — Node can't import TS at
 * runtime without a loader, and the scripts must be ergonomic. The
 * integrity guard suite verifies the two lists stay in sync.
 */

const PAGE_ROUTES = [
  "/",
  "/models",
  "/providers",
  "/compare",
  "/pricing",
  "/status",
  "/coverage",
  "/sources",
  "/research",
  "/docs",
  "/reverification",
  "/intelligence",
  "/select",
  "/use-cases",
  "/use-cases/long-context-analysis",
  "/use-cases/multimodal-input",
  "/use-cases/hosted-inference",
  "/use-cases/governance-review",
  "/compare/build",
  "/docs/decision-workflow",
  "/briefs/build",
  "/docs/decision-briefs",
  "/how-it-works",
  "/demos",
  "/demos/long-context-analysis",
  "/demos/hosted-inference",
  "/demos/governance-review",
  "/examples/decision-brief",
  "/learn",
  "/learn/how-to-choose-ai-model",
  "/learn/context-window",
  "/learn/hosted-vs-first-party",
  "/learn/pricing-references",
  "/learn/model-lifecycle",
  "/learn/testing-ai-models",
  "/learn/multimodal-input",
  "/learn/structured-output",
  "/learn/status-aware-selection",
  "/learn/benchmark-limitations",
  "/learn/paths",
  "/learn/path/beginner",
  "/learn/path/developer",
  "/learn/path/product-manager",
  "/learn/path/governance",
  "/learn/path/automation-specialist",
  "/learn/exercises",
  "/learn/exercises/build-first-shortlist",
  "/learn/exercises/compare-context-windows",
  "/learn/exercises/map-hosted-provider",
  "/learn/exercises/review-pricing-reference",
  "/learn/exercises/inspect-model-lifecycle",
  "/learn/exercises/create-decision-brief",
  "/learn/exercises/check-source-freshness",
  "/learn/exercises/plan-external-model-test",
  "/lab",
  "/lab/prompt-testing-basics",
  "/lab/structured-output-testing",
  "/lab/long-context-testing",
  "/lab/multimodal-input-testing",
  "/lab/automation-workflow-testing",
  "/lab/model-regression-testing",
  "/lab/templates",
  "/lab/templates/model-evaluation-plan",
  "/lab/templates/prompt-test-matrix",
  "/lab/templates/automation-risk-checklist",
  "/lab/prompts",
  "/lab/prompts/summarization-quality",
  "/lab/prompts/structured-extraction",
  "/lab/prompts/long-context-recall",
  "/lab/prompts/instruction-following",
  "/lab/prompts/refusal-boundary",
  "/lab/prompts/automation-robustness",
  "/lab/evaluation",
  "/for",
  "/for/developers",
  "/for/product-teams",
  "/for/automation-specialists",
  "/for/governance-teams",
  "/docs/platform-positioning",
  "/kits",
  "/kits/developer-model-evaluation",
  "/kits/automation-workflow-testing",
  "/kits/product-model-selection",
  "/kits/governance-review",
];

const API_ROUTES = [
  "/api/health",
  "/api/site",
  "/api/debug/deployment",
  "/api/status/anthropic",
  "/api/status/google",
  "/api/status/anthropic/latest",
  "/api/status/google/latest",
  "/api/status/anthropic/window?hours=24",
  "/api/status/google/window?hours=24",
  "/api/cron/status",
  "/api/reverification",
  "/api/reverification/checklist?format=json",
  "/api/intelligence",
  "/api/briefs/decision?format=json",
  "/api/lab/templates/model-evaluation-plan",
  "/api/lab/templates/prompt-test-matrix",
  "/api/lab/templates/automation-risk-checklist",
  "/api/lab/prompts/summarization-quality",
  "/api/lab/prompts/structured-extraction",
  "/api/lab/prompts/long-context-recall",
  "/api/lab/prompts/instruction-following",
  "/api/lab/prompts/refusal-boundary",
  "/api/lab/prompts/automation-robustness",
  "/api/kits/developer-model-evaluation",
  "/api/kits/automation-workflow-testing",
  "/api/kits/product-model-selection",
  "/api/kits/governance-review",
];

const FETCH_TIMEOUT_MS = 8_000;

/**
 * @param {{ baseUrl: string, cronSecret?: string|null, mode: "production"|"local" }} opts
 */
export async function runSmoke(opts) {
  const { baseUrl, cronSecret, mode } = opts;
  const base = baseUrl.replace(/\/$/, "");
  const rows = [];

  for (const path of PAGE_ROUTES) {
    rows.push(await checkRoute({ base, path, kind: "page", mode }));
  }
  for (const path of API_ROUTES) {
    const isCron = path.startsWith("/api/cron/");
    const headers =
      isCron && cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {};
    rows.push(await checkRoute({ base, path, kind: "api", mode, headers }));
  }

  // Optional contract verification — fetch /api/site and confirm the
  // statusEndpoints + routes fields are present.
  rows.push(await verifySiteContract({ base, mode }));
  // And /api/debug/deployment must carry routeSetVersion.
  rows.push(await verifyDebugDeployment({ base, mode }));

  printTable(rows);

  const failed = rows.filter((r) => r.status === "fail");
  if (failed.length === 0) {
    process.stdout.write(
      `\nsmoke:${mode} — ${rows.length}/${rows.length} checks passed.\n`
    );
    process.exit(0);
  } else {
    process.stderr.write(
      `\nsmoke:${mode} — ${failed.length} of ${rows.length} checks failed.\n`
    );
    process.exit(1);
  }
}

async function checkRoute({ base, path, kind, mode, headers = {} }) {
  const url = `${base}${path}`;
  let res;
  try {
    res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      headers,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    return {
      path,
      http: "—",
      contentType: "—",
      status: "fail",
      note: `fetch failed: ${err instanceof Error ? err.message : "unknown"}`,
    };
  }

  const http = res.status;
  const contentType = res.headers.get("content-type") || "—";
  const isHtml = /text\/html/i.test(contentType);
  const isJson = /application\/json/i.test(contentType);
  const isPlain = /text\/plain/i.test(contentType);
  const isMarkdown = /text\/markdown/i.test(contentType);
  const note = [];

  if (kind === "api") {
    // API endpoints must NEVER respond with text/html.
    if (isHtml) {
      return {
        path,
        http,
        contentType,
        status: "fail",
        note: "API endpoint returned text/html — stale deployment.",
      };
    }
    if (path === "/api/cron/status") {
      // Allowed: 200 (unguarded local), 401 (bearer required, missing),
      // 503 (CRON_SECRET missing in production).
      const ok = [200, 401, 503].includes(http);
      return {
        path,
        http,
        contentType,
        status: ok ? "pass" : "fail",
        note: ok ? "cron auth path" : `unexpected http ${http} for cron`,
      };
    }
    if (path.startsWith("/api/status/")) {
      // Status routes must respond JSON, but a missing observer for a
      // slug is allowed to 404.
      if (!isJson) {
        return {
          path,
          http,
          contentType,
          status: "fail",
          note: "expected application/json",
        };
      }
      // 200 ideal; 404 acceptable only with JSON body (means slug has
      // no observer registered — not a deployment problem).
      if (http !== 200 && http !== 404) {
        return {
          path,
          http,
          contentType,
          status: "fail",
          note: `unexpected http ${http}`,
        };
      }
      if (http === 404) note.push("no observer for slug (acceptable)");
      return {
        path,
        http,
        contentType,
        status: "pass",
        note: note.join("; ") || "",
      };
    }
    // Generic API: 2xx + json / plain / markdown.
    if (
      http >= 200 &&
      http < 300 &&
      (isJson || isPlain || isMarkdown)
    ) {
      return { path, http, contentType, status: "pass", note: "" };
    }
    return {
      path,
      http,
      contentType,
      status: "fail",
      note: `expected 2xx JSON / Markdown, got ${http} ${contentType}`,
    };
  }

  // Pages
  if (http >= 200 && http < 400 && (isHtml || isPlain)) {
    return { path, http, contentType, status: "pass", note: "" };
  }
  return {
    path,
    http,
    contentType,
    status: "fail",
    note: `expected 2xx/3xx HTML, got ${http} ${contentType}`,
  };
}

async function verifySiteContract({ base, mode }) {
  const url = `${base}/api/site`;
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const ct = res.headers.get("content-type") || "—";
    if (!/application\/json/i.test(ct)) {
      return {
        path: "/api/site (contract)",
        http: res.status,
        contentType: ct,
        status: "fail",
        note: "not JSON",
      };
    }
    const body = await res.json();
    const failures = [];
    if (!Array.isArray(body.statusEndpoints) || body.statusEndpoints.length === 0) {
      failures.push("missing statusEndpoints");
    }
    if (!Array.isArray(body.debugEndpoints) || body.debugEndpoints.length === 0) {
      failures.push("missing debugEndpoints");
    }
    if (!Array.isArray(body.routes) || !body.routes.includes("/coverage")) {
      failures.push("routes missing /coverage");
    }
    if (!Array.isArray(body.routes) || !body.routes.includes("/sources")) {
      failures.push("routes missing /sources");
    }
    if (typeof body.routeSetVersion !== "string") {
      failures.push("missing routeSetVersion");
    }
    return {
      path: "/api/site (contract)",
      http: res.status,
      contentType: ct,
      status: failures.length ? "fail" : "pass",
      note: failures.length ? failures.join("; ") : `v=${body.routeSetVersion}`,
    };
  } catch (err) {
    return {
      path: "/api/site (contract)",
      http: "—",
      contentType: "—",
      status: "fail",
      note: `fetch failed: ${err instanceof Error ? err.message : "unknown"}`,
    };
  } finally {
    void mode;
  }
}

async function verifyDebugDeployment({ base, mode }) {
  const url = `${base}/api/debug/deployment`;
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const ct = res.headers.get("content-type") || "—";
    if (!/application\/json/i.test(ct)) {
      return {
        path: "/api/debug/deployment (contract)",
        http: res.status,
        contentType: ct,
        status: "fail",
        note: "not JSON",
      };
    }
    const body = await res.json();
    const failures = [];
    if (typeof body?.build?.routeSetVersion !== "string") {
      failures.push("missing build.routeSetVersion");
    }
    // Secrets must never leak.
    for (const banned of ["CRON_SECRET", "KV_REST_API_TOKEN"]) {
      if (JSON.stringify(body).includes(banned + '":"')) {
        failures.push(`leaks ${banned}`);
      }
    }
    return {
      path: "/api/debug/deployment (contract)",
      http: res.status,
      contentType: ct,
      status: failures.length ? "fail" : "pass",
      note: failures.length
        ? failures.join("; ")
        : `v=${body.build.routeSetVersion}`,
    };
  } catch (err) {
    return {
      path: "/api/debug/deployment (contract)",
      http: "—",
      contentType: "—",
      status: "fail",
      note: `fetch failed: ${err instanceof Error ? err.message : "unknown"}`,
    };
  } finally {
    void mode;
  }
}

function printTable(rows) {
  const cols = [
    { key: "path", label: "PATH", width: 42 },
    { key: "http", label: "HTTP", width: 5 },
    { key: "contentType", label: "CONTENT-TYPE", width: 28 },
    { key: "status", label: "RESULT", width: 6 },
    { key: "note", label: "NOTE", width: 40 },
  ];
  const fmt = (v, w) => {
    const s = String(v ?? "");
    return s.length >= w ? s.slice(0, w - 1) + "…" : s.padEnd(w, " ");
  };
  process.stdout.write(
    cols.map((c) => fmt(c.label, c.width)).join(" | ") + "\n"
  );
  process.stdout.write(
    cols.map((c) => "-".repeat(c.width)).join("-+-") + "\n"
  );
  for (const r of rows) {
    process.stdout.write(
      cols.map((c) => fmt(r[c.key], c.width)).join(" | ") + "\n"
    );
  }
}
