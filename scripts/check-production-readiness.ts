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

import { readFileSync, readdirSync, statSync } from "node:fs";
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
  {
    name: "brand asset metadata is internally consistent",
    run: () => {
      const src = readRel("apps/models/data/brand-assets.ts");
      const failures: string[] = [];

      // (a) every brandAssets entry that registers a path must have a
      //     file on disk under apps/models/public.
      // Match objects of the form: <slug>: { ... path: "/brands/...", ... }
      const entryRe =
        /["'`]?([a-z0-9-]+)["'`]?\s*:\s*lettermark\(\s*["']([^"']+)["']\s*\)/g;
      let m: RegExpExecArray | null;
      while ((m = entryRe.exec(src)) !== null) {
        const path = m[2];
        if (!path.startsWith("/")) continue;
        const onDisk = `apps/models/public${path}`;
        if (!fileExists(onDisk)) {
          failures.push(
            `Brand asset registered at ${path} but file ${onDisk} is missing.`
          );
        }
      }

      // (b) when an entry asserts type === "official", a sourceUrl must
      //     be present. Match { type: "official", ..., sourceUrl: null|"..." }
      const officialBlockRe =
        /\{\s*type:\s*["']official["'][^}]*\bsourceUrl:\s*([^,\n}]+)/g;
      while ((m = officialBlockRe.exec(src)) !== null) {
        const value = m[1].trim();
        if (value === "null" || value === "undefined" || value === "''" || value === '""') {
          failures.push(
            `Brand asset declared type "official" but sourceUrl is missing/null.`
          );
        }
      }

      // (c) every file in /public/brands must be registered in brand-assets.ts
      const brandsDir = resolve(ROOT, "apps/models/public/brands");
      let files: string[] = [];
      try {
        files = readdirSync(brandsDir);
      } catch {
        files = [];
      }
      for (const f of files) {
        if (!f.endsWith(".svg")) continue;
        if (!src.includes(`/brands/${f}`)) {
          failures.push(
            `Brand file public/brands/${f} exists but is not registered in brand-assets.ts.`
          );
        }
      }

      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "model-json-ld helper guards unverified metric emission",
    run: () => {
      const src = readRel("apps/models/lib/model-jsonld.ts");
      if (!src.includes("isVerified(")) {
        return "lib/model-jsonld.ts does not appear to use isVerified() — unverified metrics could leak into schema.org markup.";
      }
      return null;
    },
  },
  {
    name: "footer carries the trademark / non-affiliation disclaimer",
    run: () => {
      // Footer JSX may wrap the phrase across lines; collapse whitespace
      // before matching to match the rendered string, not the source.
      const src = readRel("apps/models/components/SiteFooter.tsx").replace(
        /\s+/g,
        " "
      );
      if (!/trademarks of their respective owners/i.test(src)) {
        return "SiteFooter does not include the trademark / non-affiliation disclaimer.";
      }
      if (!/not affiliated/i.test(src)) {
        return "SiteFooter is missing the 'not affiliated' clause.";
      }
      return null;
    },
  },
  {
    name: "homepage stats do not assert a fabricated uptime number",
    run: () => {
      const src = readRel("apps/models/app/page.tsx");
      const m = src.match(/label="Avg API uptime"\s*\n\s*value=\{([^}]+)\}/);
      if (!m) return null;
      const v = m[1].trim();
      if (v !== "unknownLabel()" && !v.includes("UNVERIFIED_LABEL")) {
        return `Homepage 'Avg API uptime' stat must render the unverified label (current expression: ${v}).`;
      }
      return null;
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
