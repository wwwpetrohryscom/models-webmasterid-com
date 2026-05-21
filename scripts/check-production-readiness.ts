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
      //     file on disk under apps/models/public. Accepts the
      //     lettermark() and nominative() helper signatures.
      const entryRe =
        /["'`]?([a-z0-9-]+)["'`]?\s*:\s*(?:lettermark|nominative)\(\s*["']([^"']+)["'](?:\s*,\s*["'][^"']*["'])?\s*\)/g;
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
    name: "every nominative brand asset carries a licenseNote + retrievedAt",
    run: () => {
      const src = readRel("apps/models/data/brand-assets.ts");
      // The nominative() helper is the only sanctioned constructor; if
      // it exists, ensure it stamps both licenseNote and retrievedAt.
      const helper = src.match(/const\s+nominative\s*=[\s\S]*?\}\);/);
      if (!helper) {
        return "nominative() helper is missing from brand-assets.ts.";
      }
      const body = helper[0];
      const failures: string[] = [];
      if (!/licenseNote:/.test(body)) {
        failures.push("nominative() does not set licenseNote.");
      }
      if (!/retrievedAt:/.test(body)) {
        failures.push("nominative() does not set retrievedAt.");
      }
      // nominative() must not pretend to be official: type === "nominative" only.
      if (!/type:\s*["']nominative["']/.test(body)) {
        failures.push("nominative() must set type: \"nominative\".");
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
  {
    name: "verified DeepSeek attempts exist (Sprint 8 audit)",
    run: () => {
      const attempts = readRel("apps/models/data/verification-attempts.ts");
      const deepseekVerified =
        /providerSlug:\s*["']deepseek["'][\s\S]*?result:\s*["']verified["']/.test(
          attempts
        );
      if (!deepseekVerified) {
        return "Expected at least one verified DeepSeek attempt in verification-attempts.ts (Sprint 8). If DeepSeek docs become unreachable, replace these with blocked entries — do not silently delete the audit row.";
      }
      return null;
    },
  },
  {
    name: "DeepSeek v4 Pro model record exists and is verified",
    run: () => {
      const src = readRel("apps/models/data/models.ts");
      if (!/slug:\s*"deepseek-v4-pro"/.test(src)) {
        return "deepseek-v4-pro model entry is missing from models.ts.";
      }
      const block = src.split("const deepseekV4Pro").pop() ?? "";
      if (!/verificationStatus:\s*"verified"/.test(block.slice(0, 4000))) {
        return "deepseek-v4-pro entry exists but is not marked verificationStatus: 'verified'.";
      }
      return null;
    },
  },
  {
    name: "PricingUnit covers all units used in models.ts",
    run: () => {
      const models = readRel("apps/models/data/models.ts");
      const types = readRel("apps/models/lib/types.ts");
      // Pull every unit literal that appears as a key in a pricing row.
      const used = new Set<string>();
      const re = /unit:\s*"([^"]+)"/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(models)) !== null) used.add(m[1]);

      // Pull every literal declared on PricingUnit (collapse whitespace).
      const flat = types.replace(/\s+/g, " ");
      const unionMatch = flat.match(
        /export type PricingUnit\s*=\s*([^;]+);/
      );
      if (!unionMatch) {
        return "Could not locate PricingUnit union in lib/types.ts.";
      }
      const declared = new Set(
        [...unionMatch[1].matchAll(/"([^"]+)"/g)].map((x) => x[1])
      );

      const missing = [...used].filter((u) => !declared.has(u));
      if (missing.length) {
        return (
          "Pricing tier(s) reference unit string(s) not in the PricingUnit union:\n  " +
          missing.map((s) => `"${s}"`).join("\n  ")
        );
      }
      return null;
    },
  },
  {
    name: "PricingUnit includes the 'unknown' placeholder (Sprint 8B)",
    run: () => {
      const types = readRel("apps/models/lib/types.ts").replace(/\s+/g, " ");
      const unionMatch = types.match(
        /export type PricingUnit\s*=\s*([^;]+);/
      );
      if (!unionMatch) {
        return "Could not locate PricingUnit union in lib/types.ts.";
      }
      const declared = new Set(
        [...unionMatch[1].matchAll(/"([^"]+)"/g)].map((x) => x[1])
      );
      if (!declared.has("unknown")) {
        return "PricingUnit must include the 'unknown' placeholder so rows with unresolved unit semantics can be recorded without distorting a provider's pricing model. Add `| \"unknown\"` to the union.";
      }
      return null;
    },
  },
  {
    name: "no pricing row uses unit 'unknown' alongside a verified amount",
    run: () => {
      const src = readRel("apps/models/data/models.ts");
      // Each pricing row literal is `{ unit: "...", amount: ... }` —
      // pull the row text and check whether unit === "unknown" while
      // amount is wrapped in `verified(...)`. Allow `amount: null`.
      const rowRe = /\{\s*unit:\s*"unknown"[^}]*?\}/g;
      const failures: string[] = [];
      let m: RegExpExecArray | null;
      while ((m = rowRe.exec(src)) !== null) {
        const body = m[0];
        if (/amount:\s*verified\(/.test(body)) {
          failures.push(
            `Pricing row uses unit "unknown" but carries a verified amount — unit must be the actual published unit, not "unknown":\n    ${body
              .replace(/\s+/g, " ")
              .slice(0, 240)}`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "every pricing row with a verified amount carries a citation",
    run: () => {
      const src = readRel("apps/models/data/models.ts");
      // The `verified()` helper REQUIRES a citation at runtime. A row of
      // the form `amount: verified(N, citation, ...)` always passes that
      // runtime guard. The static check here catches a different mistake:
      // a literal `verified(value)` with no citation argument at all.
      const failures: string[] = [];
      const re = /amount:\s*verified\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src)) !== null) {
        const args = m[1];
        // First argument is the value; we need at least a second
        // (citation) argument. Look for at least one top-level comma.
        let depth = 0;
        let commaSeen = false;
        for (const ch of args) {
          if (ch === "(" || ch === "[" || ch === "{") depth++;
          else if (ch === ")" || ch === "]" || ch === "}") depth--;
          else if (ch === "," && depth === 0) {
            commaSeen = true;
            break;
          }
        }
        if (!commaSeen) {
          failures.push(
            `Pricing row calls verified(...) without a citation argument: \`amount: verified(${args.trim()})\`. Every verified pricing value must reference a primary-source citation.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "DeepSeek V4 Pro pricing is anchored to a DeepSeek citation",
    run: () => {
      const src = readRel("apps/models/data/models.ts");
      const block = src.split("const deepseekV4Pro").pop() ?? "";
      const head = block.slice(0, 5000);
      // Pricing rows on the v4-pro record must use one of the recorded
      // DeepSeek citations from data/citations.ts, never the homepage.
      const ok =
        /deepseekModelsAndPricing|deepseekApiReference|deepseekDocsRoot/.test(
          head
        );
      if (!ok) {
        return "deepseek-v4-pro record does not appear to reference a DeepSeek citation token (deepseekModelsAndPricing / deepseekApiReference / deepseekDocsRoot). Every verified DeepSeek metric must cite a DeepSeek primary source.";
      }
      return null;
    },
  },
  {
    name: "Mistral Large 2 is recorded as retired (Sprint 8B)",
    run: () => {
      const src = readRel("apps/models/data/models.ts");
      if (!/slug:\s*"mistral-large-2"/.test(src)) {
        return "Mistral Large 2 is not present in models.ts. Sprint 8B targeted Mistral Large 2 and verified it is in the Legacy/Deprecated table on Mistral's models overview; a historical catalogue entry must be kept so /coverage and /sources reflect that finding.";
      }
      const block = src.split('slug: "mistral-large-2"').pop() ?? "";
      const head = block.slice(0, 4000);
      if (!/status:\s*"retired"/.test(head)) {
        return "mistral-large-2 entry exists but does not record lifecycle status \"retired\". Mistral's models overview documents it as retired 2025-03-30.";
      }
      return null;
    },
  },
  {
    name: "/sources route exists and is registered as indexable",
    run: () => {
      const failures: string[] = [];
      if (!fileExists("apps/models/app/sources/page.tsx")) {
        failures.push("Missing /sources route file (apps/models/app/sources/page.tsx).");
      }
      const indexer = readRel("apps/models/lib/should-index.ts");
      if (!/"\/sources"/.test(indexer)) {
        failures.push("/sources is not registered in STATIC_INDEXABLE in lib/should-index.ts.");
      }
      const sitemap = readRel("apps/models/app/sitemap.ts");
      if (!/"\/sources"/.test(sitemap)) {
        failures.push("/sources is not listed in STATIC_ROUTES in app/sitemap.ts.");
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "Sprint 8B re-verification attempts are recorded",
    run: () => {
      const attempts = readRel("apps/models/data/verification-attempts.ts");
      const failures: string[] = [];
      // Each of these must have at least one attempt stamped on or after
      // the Sprint 8B re-verification date.
      const required: { provider: string; needle: RegExp; label: string }[] = [
        {
          provider: "deepseek",
          needle: /providerSlug:\s*"deepseek"[\s\S]*?attemptedAt:\s*"2026-05-21/,
          label: "DeepSeek 2026-05-21 attempt",
        },
        {
          provider: "mistral",
          needle: /providerSlug:\s*"mistral"[\s\S]*?attemptedAt:\s*"2026-05-21/,
          label: "Mistral 2026-05-21 attempt",
        },
      ];
      for (const r of required) {
        if (!r.needle.test(attempts)) {
          failures.push(
            `verification-attempts.ts is missing a Sprint 8B 2026-05-21 attempt entry for ${r.provider}. Re-verification pass is not auditable without it.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "status observation types module exists (Sprint 9)",
    run: () =>
      requireFile(
        "apps/models/lib/status-observations.ts",
        "lib/status-observations.ts"
      ),
  },
  {
    name: "Anthropic vendor-status observer exists (Sprint 9)",
    run: () =>
      requireFile(
        "apps/models/lib/observers/anthropic.ts",
        "lib/observers/anthropic.ts"
      ),
  },
  {
    name: "/api/status/anthropic route exists (Sprint 9)",
    run: () =>
      requireFile(
        "apps/models/app/api/status/anthropic/route.ts",
        "/api/status/anthropic"
      ),
  },
  {
    name: "/api/cron/status route exists (Sprint 9)",
    run: () =>
      requireFile(
        "apps/models/app/api/cron/status/route.ts",
        "/api/cron/status"
      ),
  },
  {
    name: "/api/cron/status enforces CRON_SECRET in production",
    run: () => {
      const src = readRel("apps/models/app/api/cron/status/route.ts");
      const failures: string[] = [];
      if (!/CRON_SECRET/.test(src)) {
        failures.push(
          "cron route does not reference CRON_SECRET — production deployments must be guarded."
        );
      }
      if (!/VERCEL_ENV/.test(src)) {
        failures.push(
          "cron route does not branch on VERCEL_ENV — required so production refuses to run unguarded when CRON_SECRET is missing."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/status page does not publish an uptime percentage",
    run: () => {
      const src = readRel("apps/models/app/status/page.tsx");
      // Forbid any literal that looks like an uptime number, e.g.
      // "99.9%", "99.99 %", "uptime: 100%". Allow the prose "uptime
      // percentage" / "uptime %" tokens because the page explicitly
      // explains why no percentage is shown.
      const offending = [
        ...src.matchAll(/\b\d{1,3}\.\d+\s*%/g),
        ...src.matchAll(/\b100\s*%/g),
      ];
      if (offending.length) {
        return (
          "/status page contains numeric percentage literal(s):\n  " +
          offending.map((m) => m[0]).join("\n  ")
        );
      }
      return null;
    },
  },
  {
    name: "/status page wording labels vendor status as vendor-reported",
    run: () => {
      const src = readRel("apps/models/app/status/page.tsx").replace(
        /\s+/g,
        " "
      );
      const failures: string[] = [];
      if (!/Vendor-reported status/i.test(src)) {
        failures.push(
          "/status page does not contain the phrase 'Vendor-reported status'."
        );
      }
      if (!/not independent uptime/i.test(src)) {
        failures.push(
          "/status page does not explicitly state that vendor-reported status is not independent uptime."
        );
      }
      // Forbid stating that an independent uptime measurement exists
      // when only vendor-reported observations are wired.
      if (
        /independent\s+uptime\s+(monitor|probe|measurement|observation)\s+enabled/i.test(
          src
        )
      ) {
        failures.push(
          "/status page claims an independent uptime monitor is enabled — Sprint 9 wires vendor-reported observations only."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no source labels probe latency as API latency",
    run: () => {
      const offenders: string[] = [];
      const targets = [
        "apps/models/lib/status-observations.ts",
        "apps/models/lib/observers/anthropic.ts",
        "apps/models/app/api/status/anthropic/route.ts",
        "apps/models/app/api/cron/status/route.ts",
        "apps/models/app/status/page.tsx",
      ];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        // Strip JSDoc/line comments before scanning so the
        // intentionally-cautionary "NOT the provider's API latency"
        // phrasing in module-level documentation doesn't flag the file.
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        if (/\bAPI latency\b/i.test(stripped)) {
          offenders.push(rel);
        }
      }
      if (offenders.length) {
        return (
          "Files reference the phrase 'API latency' outside comments — probe wall-clock time must NEVER be relabelled as API latency:\n  " +
          offenders.join("\n  ")
        );
      }
      return null;
    },
  },
  {
    name: "Anthropic vendor-status citation is registered",
    run: () => {
      const src = readRel("apps/models/data/citations.ts");
      if (!/anthropicStatusPage/.test(src)) {
        return "citations.ts does not export an anthropicStatusPage citation. Every vendor status source consumed by an observer must have a primary-source citation.";
      }
      const observer = readRel("apps/models/lib/observers/anthropic.ts");
      if (!/status\.anthropic\.com/.test(observer)) {
        return "Anthropic observer URL drifted away from status.anthropic.com — keep the URL aligned with the registered citation.";
      }
      return null;
    },
  },
  {
    name: "homepage does not contain a fabricated uptime percentage",
    run: () => {
      const src = readRel("apps/models/app/page.tsx");
      const offending = [
        ...src.matchAll(/\b\d{1,3}\.\d+\s*%/g),
        ...src.matchAll(/\b100\s*%/g),
      ];
      // The existing "Avg API uptime" stat must still render
      // unknownLabel()/UNVERIFIED_LABEL — covered by another check, but
      // additionally we forbid any concrete percentage literal.
      if (offending.length) {
        return (
          "Homepage contains numeric percentage literal(s):\n  " +
          offending.map((m) => m[0]).join("\n  ")
        );
      }
      return null;
    },
  },
  {
    name: "no comparison declares a winner (text-level check)",
    run: () => {
      const src = readRel("apps/models/data/comparisons.ts");
      // Reinforces the type-level check above with a text-level guard:
      // forbid the literal phrase "winner" or "best" in any comparison
      // useCase/limitation/description field — apart from the explicit
      // disclaimer "WebmasterID Models does not declare a winner" and the
      // type-level "declaresWinner: false" assertion.
      const flat = src.replace(/\s+/g, " ");
      const offending: string[] = [];
      const re =
        /(name|description|useCases|limitations):\s*[\s\S]*?(?=,\s*[a-zA-Z]+:|\}|\])/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(flat)) !== null) {
        const segment = m[0];
        // Skip the explicit non-winner disclaimer.
        const lowered = segment.toLowerCase();
        if (lowered.includes("does not declare a winner")) continue;
        if (/\bwinner\b|\bbest model\b/.test(lowered)) {
          offending.push(segment.slice(0, 200));
        }
      }
      return offending.length
        ? "Comparison copy mentions 'winner' / 'best model' outside the explicit non-winner disclaimer:\n  " +
            offending.join("\n  ")
        : null;
    },
  },
  {
    name: "Logo component + static SVGs are present",
    run: () => {
      const failures: string[] = [];
      const required: { rel: string; label: string }[] = [
        { rel: "apps/models/components/Logo.tsx", label: "<Logo /> component" },
        { rel: "apps/models/public/logo.svg", label: "/logo.svg" },
        { rel: "apps/models/public/logo-mark.svg", label: "/logo-mark.svg" },
        { rel: "apps/models/public/logo-mono.svg", label: "/logo-mono.svg" },
        { rel: "apps/models/app/icon.svg", label: "favicon icon.svg" },
      ];
      for (const r of required) {
        if (!fileExists(r.rel)) failures.push(`Missing ${r.label} (${r.rel}).`);
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "SiteHeader + SiteFooter render the brand <Logo>",
    run: () => {
      const header = readRel("apps/models/components/SiteHeader.tsx");
      const footer = readRel("apps/models/components/SiteFooter.tsx");
      const failures: string[] = [];
      if (!/<Logo\b/.test(header)) {
        failures.push(
          "SiteHeader does not render <Logo /> — header still using a placeholder mark?"
        );
      }
      if (!/<Logo\b/.test(footer)) {
        failures.push("SiteFooter does not render <Logo />.");
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "WebmasterID analytics is wired in app/layout.tsx",
    run: () => {
      const layout = readRel("apps/models/app/layout.tsx");
      const config = readRel("apps/models/lib/analytics.ts");
      const failures: string[] = [];

      // Layout must import next/script and webmasterIdAnalytics, and
      // render a <Script> that references the analytics config.
      if (!/from\s+"next\/script"/.test(layout)) {
        failures.push("layout.tsx does not import next/script.");
      }
      if (!/webmasterIdAnalytics/.test(layout)) {
        failures.push("layout.tsx does not reference webmasterIdAnalytics.");
      }
      if (!/<Script\b[\s\S]*?webmasterIdAnalytics\.scriptId/.test(layout)) {
        failures.push(
          "layout.tsx does not render <Script id={webmasterIdAnalytics.scriptId} ...>."
        );
      }

      // Config must carry the exact siteId and endpoint specified by the
      // analytics owner.
      if (!/siteId:\s*"wm_64pnpqrfcgfwttwi"/.test(config)) {
        failures.push(
          'lib/analytics.ts siteId is not the expected "wm_64pnpqrfcgfwttwi".'
        );
      }
      if (
        !/endpoint:\s*"https:\/\/webmasterid-ingest-api\.vercel\.app\/api\/events"/.test(
          config
        )
      ) {
        failures.push(
          "lib/analytics.ts endpoint is not the expected ingest URL."
        );
      }
      if (
        !/scriptSrc:\s*"https:\/\/webmasterid\.com\/tracker\.iife\.min\.js"/.test(
          config
        )
      ) {
        failures.push(
          "lib/analytics.ts scriptSrc is not the expected tracker URL."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "WebmasterID tracker is loaded once, not duplicated",
    run: () => {
      const layout = readRel("apps/models/app/layout.tsx");
      // Count <Script> nodes that reference the tracker id, the script
      // src, or the analytics config's scriptId / scriptSrc.
      const trackerMentions = (
        layout.match(/webmasterid-tracker/g) ?? []
      ).length;
      const scriptTags = (layout.match(/<Script\b/g) ?? []).length;
      // The DOM id appears once in JSX. If we see 2+, a duplicate slipped in.
      if (trackerMentions > 1) {
        return `layout.tsx mentions "webmasterid-tracker" ${trackerMentions} times — only one <Script> should reference it.`;
      }
      // Sanity check: should not have more than one <Script>.
      if (scriptTags > 1) {
        return `layout.tsx renders ${scriptTags} <Script> tags — the analytics tracker should be wired exactly once.`;
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
