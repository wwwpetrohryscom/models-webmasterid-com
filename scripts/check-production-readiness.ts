/**
 * Production readiness QA — runs locally before deploy.
 *
 * Verifies that the routes, endpoints, and configuration the production
 * deployment depends on actually exist in the source tree. This is a
 * pre-flight check, not a live ping; it catches the most common
 * "shipped without the file" class of bugs.
 *
 * Checks:
 *   1. sitemap, robots, llms, rss route files exist
 *   2. /api/health, /api/site route files exist
 *   3. siteConfig.url is the production https URL
 *   4. layout uses buildMetadata so the canonical URL flows through
 *   5. opengraph-image route exists
 *   6. no unauthorized occurrences of the canonical unverified-data label
 *
 * Run with: npm run check:production
 */

import { readFileSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { scanForLabel, formatViolations } from "./lib/scan-label.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

const EXPECTED_DOMAIN = "https://models.webmasterid.com";

interface Check {
  name: string;
  run: () => string | null; // null = pass, string = failure message
}

function fileExists(rel: string): boolean {
  const p = resolve(ROOT, rel);
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

function readRel(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

function requireFile(rel: string, label: string): string | null {
  return fileExists(rel) ? null : `Missing ${label} (${rel}).`;
}

const checks: Check[] = [
  {
    name: "sitemap route exists",
    run: () => requireFile("apps/models/app/sitemap.ts", "/sitemap.xml"),
  },
  {
    name: "robots route exists",
    run: () => requireFile("apps/models/app/robots.ts", "/robots.txt"),
  },
  {
    name: "llms.txt route exists",
    run: () =>
      requireFile("apps/models/app/llms.txt/route.ts", "/llms.txt"),
  },
  {
    name: "rss.xml route exists",
    run: () =>
      requireFile("apps/models/app/rss.xml/route.ts", "/rss.xml"),
  },
  {
    name: "/api/health endpoint exists",
    run: () =>
      requireFile("apps/models/app/api/health/route.ts", "/api/health"),
  },
  {
    name: "/api/site endpoint exists",
    run: () =>
      requireFile("apps/models/app/api/site/route.ts", "/api/site"),
  },
  {
    name: "opengraph-image route exists",
    run: () =>
      requireFile(
        "apps/models/app/opengraph-image.tsx",
        "/opengraph-image"
      ),
  },
  {
    name: `siteConfig.url is ${EXPECTED_DOMAIN}`,
    run: () => {
      const src = readRel("apps/models/lib/site-config.ts");
      const match = src.match(/url:\s*"([^"]+)"/);
      if (!match) return "Could not find siteConfig.url in site-config.ts.";
      if (match[1] !== EXPECTED_DOMAIN) {
        return `siteConfig.url is "${match[1]}" but expected "${EXPECTED_DOMAIN}".`;
      }
      return null;
    },
  },
  {
    name: "siteConfig.domain matches production domain",
    run: () => {
      const src = readRel("apps/models/lib/site-config.ts");
      const match = src.match(/domain:\s*"([^"]+)"/);
      const expected = EXPECTED_DOMAIN.replace(/^https?:\/\//, "");
      if (!match) return "Could not find siteConfig.domain in site-config.ts.";
      if (match[1] !== expected) {
        return `siteConfig.domain is "${match[1]}" but expected "${expected}".`;
      }
      return null;
    },
  },
  {
    name: "root layout wires up buildMetadata (canonical flows through)",
    run: () => {
      const src = readRel("apps/models/app/layout.tsx");
      if (!src.includes("buildMetadata")) {
        return "layout.tsx does not import buildMetadata; canonical URL may be wrong.";
      }
      return null;
    },
  },
  {
    name: "homepage is indexable (no manual noindex on /)",
    run: () => {
      const homepage = readRel("apps/models/app/page.tsx");
      if (/robots:\s*\{\s*index:\s*false/.test(homepage)) {
        return "Homepage declares robots: { index: false } — must be indexable in production.";
      }
      return null;
    },
  },
  {
    name: "no unauthorized occurrences of the unverified-data label",
    run: () => {
      const violations = scanForLabel({ root: ROOT });
      if (!violations.length) return null;
      return formatViolations(violations);
    },
  },
];

function main(): void {
  let failed = 0;
  console.log("check:production — preflight QA\n");
  for (const c of checks) {
    let err: string | null = null;
    try {
      err = c.run();
    } catch (e) {
      err = e instanceof Error ? e.message : String(e);
    }
    if (err === null) {
      console.log(`  ✓ ${c.name}`);
    } else {
      failed++;
      console.error(`  ✗ ${c.name}`);
      for (const line of err.split("\n")) {
        console.error(`      ${line}`);
      }
    }
  }
  if (failed === 0) {
    console.log(`\n✓ check:production — ${checks.length}/${checks.length} checks passed.`);
    return;
  }
  console.error(
    `\n✗ check:production — ${failed} of ${checks.length} checks failed.`
  );
  process.exit(1);
}

main();
