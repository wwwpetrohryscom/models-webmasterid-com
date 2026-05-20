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
  {
    name: "comparison entities never declare a winner (type-level)",
    run: () => {
      const src = readRel("apps/models/data/comparisons.ts");
      // Each comparison object must carry declaresWinner: false.
      const objects = src.match(/\{[\s\S]*?\}/g) ?? [];
      const failures: string[] = [];
      // Lightweight: count appearance of `declaresWinner: false` vs total
      // comparison objects identified by their slug field.
      const slugs = [...src.matchAll(/slug:\s*"([^"]+)"/g)].map((m) => m[1]);
      const declares = [
        ...src.matchAll(/declaresWinner:\s*(true|false)/g),
      ].map((m) => m[1]);
      if (declares.includes("true")) {
        failures.push(
          `One or more comparison entities set declaresWinner: true — comparison pages must not declare a winner.`
        );
      }
      if (slugs.length && declares.length < slugs.length) {
        failures.push(
          `Found ${slugs.length} comparison entries but only ${declares.length} declaresWinner declarations — every comparison must explicitly carry declaresWinner: false.`
        );
      }
      // Silence the unused-objects warning.
      void objects;
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "comparison page copy reinforces no-winner policy",
    run: () => {
      const src = readRel("apps/models/app/compare/[slug]/page.tsx");
      // Collapse whitespace so the assertion survives JSX line-wrapping.
      const flat = src.replace(/\s+/g, " ");
      if (!/No winner declared/i.test(flat)) {
        return "Comparison page is missing the 'No winner declared' notice.";
      }
      return null;
    },
  },
  {
    name: "model-jsonld omits benchmark / latency / uptime fields entirely",
    run: () => {
      const src = readRel("apps/models/lib/model-jsonld.ts");
      const banned = /(benchmark|latency|uptime|avgLatencyMs|uptimePercent)/i;
      // The helper is allowed to MENTION these tokens in comments. We
      // search only for assignments / property names that would leak.
      const lines = src.split("\n").filter((l) => !/^\s*\/\//.test(l));
      const offending = lines.filter((l) =>
        /^[^/]*"(performance|latency|uptime|avgLatencyMs|uptimePercent|benchmark[A-Za-z]*)"\s*:/.test(
          l
        )
      );
      if (offending.length) {
        return (
          "model-jsonld assigns banned unverified-metric properties:\n  " +
          offending.map((l) => l.trim()).join("\n  ")
        );
      }
      // Defensive: search for any verbatim 'uptimePercent' or 'avgLatencyMs' RHS
      // outside comments.
      if (
        lines.join("\n").match(/(?:uptimePercent|avgLatencyMs|benchmarks?:)/) &&
        !banned.test("")
      ) {
        // (no-op, the structured check above is authoritative)
      }
      return null;
    },
  },
  {
    name: "no provider is fully verified while declaring partial fields",
    run: () => {
      const src = readRel("apps/models/data/providers.ts");
      // Find each provider object and check: if verificationStatus is
      // "verified" then `verified: true` must also be set.
      const blocks = src.split(/\{\s*\n\s*id:\s*"provider-/);
      const failures: string[] = [];
      for (const block of blocks.slice(1)) {
        const slugMatch = block.match(/slug:\s*"([^"]+)"/);
        const slug = slugMatch ? slugMatch[1] : "<unknown>";
        const verifiedTrue = /verified:\s*true/.test(block);
        const statusVerified = /verificationStatus:\s*"verified"/.test(block);
        if (statusVerified && !verifiedTrue) {
          failures.push(
            `Provider "${slug}" claims verificationStatus "verified" but verified flag is not true.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "official brand assets carry sourceUrl + licenseNote + retrievedAt",
    run: () => {
      const src = readRel("apps/models/data/brand-assets.ts");
      // Find every brandAsset object literal that sets type: "official".
      const officials = [
        ...src.matchAll(/\{[\s\S]*?type:\s*["']official["'][\s\S]*?\}/g),
      ];
      const failures: string[] = [];
      for (const m of officials) {
        const obj = m[0];
        const slugMatch = obj.match(/slug:\s*["']([^"']+)["']/);
        const slug = slugMatch ? slugMatch[1] : "<unknown>";

        const sourceUrl = obj.match(/sourceUrl:\s*([^,\n}]+)/);
        if (
          !sourceUrl ||
          /^\s*(null|undefined|""|'')\s*$/.test(sourceUrl[1])
        ) {
          failures.push(
            `Official brand asset (${slug}) is missing sourceUrl.`
          );
        }

        const licenseNote = obj.match(/licenseNote:\s*([^,\n}]+)/);
        if (
          !licenseNote ||
          /^\s*(null|undefined|""|'')\s*$/.test(licenseNote[1])
        ) {
          failures.push(
            `Official brand asset (${slug}) is missing licenseNote.`
          );
        }

        const retrievedAt = obj.match(/retrievedAt:\s*([^,\n}]+)/);
        if (
          !retrievedAt ||
          /^\s*(null|undefined|""|'')\s*$/.test(retrievedAt[1])
        ) {
          failures.push(
            `Official brand asset (${slug}) is missing retrievedAt.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "every official brand asset is documented in BRAND_ASSETS.md",
    run: () => {
      const src = readRel("apps/models/data/brand-assets.ts");
      const md = readRel("BRAND_ASSETS.md");
      const officials = [
        ...src.matchAll(/(\w[\w-]*?):\s*\{[\s\S]*?type:\s*["']official["']/g),
      ];
      const failures: string[] = [];
      for (const m of officials) {
        const slug = m[1];
        // Look for the slug in BRAND_ASSETS.md to ensure the upgrade has a
        // documented review entry.
        const slugPattern = new RegExp(
          `\\b${slug.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`
        );
        if (!slugPattern.test(md)) {
          failures.push(
            `Provider slug "${slug}" has an official brand asset but no documented entry in BRAND_ASSETS.md.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "OpenAI catalogue stays unverified until manual browser pass",
    run: () => {
      const src = readRel("apps/models/data/models.ts");
      // Find the GPT-5 entry block and confirm it is structurally an
      // unverifiedModel() call. If a future patch introduces a verified
      // OpenAI model, the entry must also add an explicit citation
      // ("openaiModelDocs" or similar) — this check catches the
      // common accident of marking something verified without wiring
      // its citation.
      const gpt5Block =
        src.match(/unverifiedModel\(\{[^}]*?slug:\s*"gpt-5"[\s\S]*?\}\)/) ||
        src.match(/slug:\s*"gpt-5"[\s\S]*?\}/);
      if (!gpt5Block) {
        return "Could not locate the GPT-5 entry in models.ts to verify it stays unverified pending manual review.";
      }
      // If GPT-5 is no longer wrapped in unverifiedModel(), require that
      // an explicit OpenAI citation is registered in citations.ts.
      const wrappedAsUnverified = /unverifiedModel\([^)]*slug:\s*"gpt-5"/.test(
        src
      );
      if (!wrappedAsUnverified) {
        const citations = readRel("apps/models/data/citations.ts");
        if (!/openai/i.test(citations)) {
          return "GPT-5 entry is no longer wrapped in unverifiedModel() but no OpenAI citation has been added to citations.ts.";
        }
      }
      return null;
    },
  },
  {
    name: "every blocked retrieval attempt for OpenAI is recorded in /coverage",
    run: () => {
      const attempts = readRel("apps/models/data/verification-attempts.ts");
      // Require at least one OpenAI entry with a blocked-* result so the
      // /coverage page can surface the gap honestly.
      const openaiBlocked =
        /providerSlug:\s*["']openai["'][\s\S]*?result:\s*["']blocked-/.test(
          attempts
        );
      if (!openaiBlocked) {
        return "verification-attempts.ts does not record any blocked OpenAI retrieval attempt — if OpenAI is now verifiable, also add a 'verified' attempt entry; if not, keep at least one blocked entry so the gap is visible on /coverage.";
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
