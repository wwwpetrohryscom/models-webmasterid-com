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
    name: "/api/status/[provider] dynamic route exists (Sprint 12)",
    run: () =>
      requireFile(
        "apps/models/app/api/status/[provider]/route.ts",
        "/api/status/[provider]"
      ),
  },
  {
    name: "every observed provider has a literal status route trio (Sprint 12B)",
    run: () => {
      // Sprint 12B restored the literal-segment routes alongside the
      // dynamic `[provider]` route as a deployment-safety belt-and-
      // suspenders. Every provider that has at least one observer
      // registered MUST also have a literal route trio (root + latest +
      // window) so URL consumers do not depend on the dynamic-segment
      // route being deployed correctly.
      //
      // The observer registry lives in lib/observers/index.ts; we read
      // it as a regex (the script can't import TS at build time without
      // tsx). Any slug that appears in a `providerSlug: "..."` literal
      // there must also have route files on disk.
      const registry = readRel("apps/models/lib/observers/index.ts");
      // For each observer file referenced by the registry, look at the
      // observer source to find its providerSlug.
      const observerFiles = [
        "apps/models/lib/observers/anthropic.ts",
        "apps/models/lib/observers/anthropic-probe.ts",
        "apps/models/lib/observers/google.ts",
      ];
      const slugs = new Set<string>();
      for (const rel of observerFiles) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        const matches = src.matchAll(/providerSlug:\s*"([^"]+)"/g);
        for (const m of matches) slugs.add(m[1]);
      }
      void registry; // referenced for future expansion
      const failures: string[] = [];
      for (const slug of slugs) {
        const trio = [
          `apps/models/app/api/status/${slug}/route.ts`,
          `apps/models/app/api/status/${slug}/latest/route.ts`,
          `apps/models/app/api/status/${slug}/window/route.ts`,
        ];
        for (const rel of trio) {
          if (!fileExists(rel)) {
            failures.push(
              `Missing literal status route ${rel} — required for "${slug}" because an observer is registered for that slug.`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "literal status routes forward to shared handler (Sprint 12B)",
    run: () => {
      // Each literal status route must delegate to the shared helper in
      // lib/status-handlers.ts. We do NOT want hand-rolled JSON in each
      // route file — that's how the two route shapes drifted before.
      const literalFiles: string[] = [];
      for (const slug of ["anthropic", "google"]) {
        literalFiles.push(
          `apps/models/app/api/status/${slug}/route.ts`,
          `apps/models/app/api/status/${slug}/latest/route.ts`,
          `apps/models/app/api/status/${slug}/window/route.ts`
        );
      }
      const failures: string[] = [];
      for (const rel of literalFiles) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        if (!/from\s+["']@\/lib\/status-handlers["']/.test(src)) {
          failures.push(
            `${rel} does not import from @/lib/status-handlers — every literal status route must delegate to the shared handler so the dynamic and literal routes cannot drift.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "lib/status-handlers.ts exports the three handler functions (Sprint 12B)",
    run: () => {
      const rel = "apps/models/lib/status-handlers.ts";
      if (!fileExists(rel)) return "lib/status-handlers.ts is missing.";
      const src = readRel(rel);
      const failures: string[] = [];
      for (const name of [
        "handleStatusObservation",
        "handleStatusLatest",
        "handleStatusWindow",
        "parseWindowHours",
      ]) {
        if (!new RegExp(`export (async )?function ${name}\\b`).test(src)) {
          failures.push(
            `${rel} does not export ${name} — required by the literal and dynamic status routes.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
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
        "apps/models/lib/status-handlers.ts",
        "apps/models/lib/observers/anthropic.ts",
        "apps/models/lib/observers/anthropic-probe.ts",
        "apps/models/lib/observers/google.ts",
        "apps/models/lib/observers/http-probe.ts",
        "apps/models/lib/observers/index.ts",
        "apps/models/app/api/status/[provider]/route.ts",
        "apps/models/app/api/status/[provider]/latest/route.ts",
        "apps/models/app/api/status/[provider]/window/route.ts",
        "apps/models/app/api/status/anthropic/route.ts",
        "apps/models/app/api/status/anthropic/latest/route.ts",
        "apps/models/app/api/status/anthropic/window/route.ts",
        "apps/models/app/api/status/google/route.ts",
        "apps/models/app/api/status/google/latest/route.ts",
        "apps/models/app/api/status/google/window/route.ts",
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
    name: "entity-graph helper module exists (Sprint 10)",
    run: () =>
      requireFile(
        "apps/models/lib/entity-graph.ts",
        "lib/entity-graph.ts"
      ),
  },
  {
    name: "Breadcrumbs component exists (Sprint 10)",
    run: () =>
      requireFile(
        "apps/models/components/Breadcrumbs.tsx",
        "components/Breadcrumbs.tsx"
      ),
  },
  {
    name: "isFilteredRoute helper is declared in should-index.ts",
    run: () => {
      const src = readRel("apps/models/lib/should-index.ts");
      if (!/export function isFilteredRoute/.test(src)) {
        return "lib/should-index.ts does not export isFilteredRoute(searchParams).";
      }
      return null;
    },
  },
  {
    name: "/models supports q/provider/verification/lifecycle/modality params",
    run: () => {
      const src = readRel("apps/models/app/models/page.tsx");
      const missing: string[] = [];
      for (const key of [
        "q",
        "provider",
        "verification",
        "lifecycle",
        "modality",
      ]) {
        const namePattern = new RegExp(`name="${key}"`);
        if (!namePattern.test(src)) missing.push(key);
      }
      if (missing.length) {
        return `app/models/page.tsx is missing form field(s) for filter param(s): ${missing.join(", ")}.`;
      }
      if (!/isFilteredRoute\(params\)/.test(src)) {
        return "app/models/page.tsx does not call isFilteredRoute() for noindex policy.";
      }
      return null;
    },
  },
  {
    name: "/pricing supports q/provider/status/unit params",
    run: () => {
      const src = readRel("apps/models/app/pricing/page.tsx");
      const missing: string[] = [];
      for (const key of ["q", "provider", "status", "unit"]) {
        const namePattern = new RegExp(`name="${key}"`);
        if (!namePattern.test(src)) missing.push(key);
      }
      if (missing.length) {
        return `app/pricing/page.tsx is missing form field(s) for filter param(s): ${missing.join(", ")}.`;
      }
      if (!/isFilteredRoute\(params\)/.test(src)) {
        return "app/pricing/page.tsx does not call isFilteredRoute() for noindex policy.";
      }
      return null;
    },
  },
  {
    name: "/compare supports q/provider/verification/indexable params",
    run: () => {
      const src = readRel("apps/models/app/compare/page.tsx");
      const missing: string[] = [];
      for (const key of [
        "q",
        "provider",
        "verification",
        "indexable",
      ]) {
        const namePattern = new RegExp(`name="${key}"`);
        if (!namePattern.test(src)) missing.push(key);
      }
      if (missing.length) {
        return `app/compare/page.tsx is missing form field(s) for filter param(s): ${missing.join(", ")}.`;
      }
      if (!/isFilteredRoute\(params\)/.test(src)) {
        return "app/compare/page.tsx does not call isFilteredRoute() for noindex policy.";
      }
      return null;
    },
  },
  {
    name: "/sources supports provider/sourceType params",
    run: () => {
      const src = readRel("apps/models/app/sources/page.tsx");
      const missing: string[] = [];
      for (const key of ["provider", "sourceType"]) {
        const namePattern = new RegExp(`name="${key}"`);
        if (!namePattern.test(src)) missing.push(key);
      }
      if (missing.length) {
        return `app/sources/page.tsx is missing form field(s) for filter param(s): ${missing.join(", ")}.`;
      }
      if (!/isFilteredRoute\(params\)/.test(src)) {
        return "app/sources/page.tsx does not call isFilteredRoute() for noindex policy.";
      }
      return null;
    },
  },
  {
    name: "filtered hubs emit robotsMetadata(!filtered) (noindex on filter)",
    run: () => {
      const failures: string[] = [];
      const targets = [
        "apps/models/app/models/page.tsx",
        "apps/models/app/pricing/page.tsx",
        "apps/models/app/compare/page.tsx",
        "apps/models/app/sources/page.tsx",
      ];
      for (const rel of targets) {
        const src = readRel(rel);
        if (!/robots:\s*robotsMetadata\(!filtered\)/.test(src)) {
          failures.push(
            `${rel} does not declare robots: robotsMetadata(!filtered) in generateMetadata — filtered URLs would stay indexable.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "detail pages render <Breadcrumbs> (Sprint 10)",
    run: () => {
      const failures: string[] = [];
      const targets: { rel: string; label: string }[] = [
        {
          rel: "apps/models/app/models/[slug]/page.tsx",
          label: "/models/[slug]",
        },
        {
          rel: "apps/models/app/providers/[slug]/page.tsx",
          label: "/providers/[slug]",
        },
        {
          rel: "apps/models/app/compare/[slug]/page.tsx",
          label: "/compare/[slug]",
        },
      ];
      for (const t of targets) {
        const src = readRel(t.rel);
        if (!/<Breadcrumbs\b/.test(src)) {
          failures.push(`${t.label} does not render <Breadcrumbs>.`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "detail pages emit BreadcrumbList JSON-LD (Sprint 10)",
    run: () => {
      const failures: string[] = [];
      const targets: { rel: string; label: string }[] = [
        {
          rel: "apps/models/app/models/[slug]/page.tsx",
          label: "/models/[slug]",
        },
        {
          rel: "apps/models/app/providers/[slug]/page.tsx",
          label: "/providers/[slug]",
        },
        {
          rel: "apps/models/app/compare/[slug]/page.tsx",
          label: "/compare/[slug]",
        },
      ];
      for (const t of targets) {
        const src = readRel(t.rel);
        if (!/breadcrumbJsonLd\(/.test(src)) {
          failures.push(
            `${t.label} does not emit breadcrumbJsonLd() — BreadcrumbList structured data missing.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "status-store module exists (Sprint 11)",
    run: () =>
      requireFile("apps/models/lib/status-store.ts", "lib/status-store.ts"),
  },
  {
    name: "status-store exposes both noop and kv adapters",
    run: () => {
      const src = readRel("apps/models/lib/status-store.ts");
      const failures: string[] = [];
      if (!/export const noopStatusStore/.test(src)) {
        failures.push(
          "lib/status-store.ts does not export `noopStatusStore` — local/no-credentials fallback is required."
        );
      }
      if (!/function makeKvAdapter/.test(src) && !/kvStatusStore/.test(src)) {
        failures.push(
          "lib/status-store.ts does not declare a KV adapter (looked for `makeKvAdapter` or `kvStatusStore`)."
        );
      }
      if (!/export function getStatusStore/.test(src)) {
        failures.push(
          "lib/status-store.ts does not export `getStatusStore()` — the env-aware factory is required."
        );
      }
      if (!/MINIMUM_OBSERVATIONS_FOR_UPTIME/.test(src)) {
        failures.push(
          "lib/status-store.ts does not declare MINIMUM_OBSERVATIONS_FOR_UPTIME — uptime gating policy must be declarative."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "status-store never hardcodes secrets",
    run: () => {
      const src = readRel("apps/models/lib/status-store.ts");
      const failures: string[] = [];
      // The only sanctioned way to obtain credentials is via process.env.
      // Forbid string literals that look like an Upstash URL or token.
      if (/https:\/\/[a-z0-9-]+\.upstash\.io\b/i.test(src)) {
        failures.push(
          "lib/status-store.ts contains a hardcoded Upstash URL literal. Credentials must come from KV_REST_API_URL only."
        );
      }
      // Heuristic: a real Upstash / KV bearer token is a long base64-ish
      // string containing both letters and digits. Pure-letter identifiers
      // and pure-dash JSDoc separators must NOT trip the guard.
      //
      // We scan only string literals (between single or double quotes) so
      // identifier text and comments are excluded by construction.
      const stringLiteralRe = /(["'])([^"'\\]{32,})\1/g;
      let lit: RegExpExecArray | null;
      while ((lit = stringLiteralRe.exec(src)) !== null) {
        const body = lit[2];
        const hasLetter = /[A-Za-z]/.test(body);
        const hasDigit = /[0-9]/.test(body);
        if (
          hasLetter &&
          hasDigit &&
          /^[A-Za-z0-9_/+=-]+$/.test(body)
        ) {
          failures.push(
            `lib/status-store.ts contains a bearer-shaped string literal of length ${body.length}. Tokens must come from KV_REST_API_TOKEN only.`
          );
          break;
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "cron route writes observations through the status store",
    run: () => {
      const src = readRel("apps/models/app/api/cron/status/route.ts");
      const failures: string[] = [];
      if (!/getStatusStore\(\)/.test(src)) {
        failures.push(
          "cron route does not call getStatusStore() — observations are not persisted."
        );
      }
      if (!/writeObservation\(/.test(src)) {
        failures.push(
          "cron route does not call store.writeObservation() — observations are not persisted."
        );
      }
      if (!/storageConfigured/.test(src)) {
        failures.push(
          "cron route does not surface storageConfigured in its response — callers cannot tell whether writes were attempted."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/api/status/[provider]/latest route exists (Sprint 12)",
    run: () =>
      requireFile(
        "apps/models/app/api/status/[provider]/latest/route.ts",
        "/api/status/[provider]/latest"
      ),
  },
  {
    name: "/api/status/[provider]/window route exists (Sprint 12)",
    run: () =>
      requireFile(
        "apps/models/app/api/status/[provider]/window/route.ts",
        "/api/status/[provider]/window"
      ),
  },
  {
    name: "window endpoint gates uptime behind MINIMUM_OBSERVATIONS_FOR_UPTIME",
    run: () => {
      // The threshold lives in lib/status-store.ts. Sprint 12B moved
      // the window endpoint plumbing into the shared
      // lib/status-handlers.ts so every literal and dynamic route uses
      // the same code path. Verify the store + shared handler both
      // reference the gating boolean / call.
      const store = readRel("apps/models/lib/status-store.ts");
      const handlers = readRel("apps/models/lib/status-handlers.ts");
      const failures: string[] = [];
      if (!/uptimeEligible/.test(store)) {
        failures.push(
          "lib/status-store.ts does not declare uptimeEligible on the window result."
        );
      }
      if (!/sampleCount >= MINIMUM_OBSERVATIONS_FOR_UPTIME/.test(store)) {
        failures.push(
          "lib/status-store.ts does not gate uptimePercentage behind sampleCount >= MINIMUM_OBSERVATIONS_FOR_UPTIME."
        );
      }
      if (!/getObservationWindow/.test(handlers)) {
        failures.push(
          "lib/status-handlers.ts does not call store.getObservationWindow() — the window endpoint plumbing has drifted."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/status page does not display an uptime percentage",
    run: () => {
      const src = readRel("apps/models/app/status/page.tsx");
      const offending = [
        ...src.matchAll(/\b\d{1,3}\.\d+\s*%/g),
        ...src.matchAll(/\b100\s*%/g),
      ];
      // Allow the prose word "percentage" — we forbid numeric literals.
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
    name: "/status page surfaces durable-storage state",
    run: () => {
      const src = readRel("apps/models/app/status/page.tsx").replace(
        /\s+/g,
        " "
      );
      const failures: string[] = [];
      if (!/Durable observation storage/i.test(src)) {
        failures.push(
          "/status page does not include the 'Durable observation storage' section."
        );
      }
      if (!/isStatusStorageConfigured\b/.test(src)) {
        failures.push(
          "/status page does not call isStatusStorageConfigured() to report storage state."
        );
      }
      if (!/MINIMUM_OBSERVATIONS_FOR_UPTIME/.test(src)) {
        failures.push(
          "/status page does not name MINIMUM_OBSERVATIONS_FOR_UPTIME in its window-readiness copy."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "status pipeline does not reference user / analytics data",
    run: () => {
      const failures: string[] = [];
      const targets = [
        "apps/models/lib/status-store.ts",
        "apps/models/lib/status-observations.ts",
        "apps/models/lib/status-handlers.ts",
        "apps/models/lib/observers/anthropic.ts",
        "apps/models/lib/observers/anthropic-probe.ts",
        "apps/models/lib/observers/google.ts",
        "apps/models/lib/observers/http-probe.ts",
        "apps/models/lib/observers/index.ts",
        "apps/models/app/api/status/[provider]/route.ts",
        "apps/models/app/api/status/[provider]/latest/route.ts",
        "apps/models/app/api/status/[provider]/window/route.ts",
        "apps/models/app/api/status/anthropic/route.ts",
        "apps/models/app/api/status/anthropic/latest/route.ts",
        "apps/models/app/api/status/anthropic/window/route.ts",
        "apps/models/app/api/status/google/route.ts",
        "apps/models/app/api/status/google/latest/route.ts",
        "apps/models/app/api/status/google/window/route.ts",
        "apps/models/app/api/cron/status/route.ts",
      ];
      const banned = /webmasterIdAnalytics|sendBeacon|userId|sessionId/;
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        if (banned.test(src)) {
          failures.push(
            `${rel} references analytics / user-identifier code — status pipeline must not store user or analytics data.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "HTTP probe factory exists (Sprint 12)",
    run: () =>
      requireFile(
        "apps/models/lib/observers/http-probe.ts",
        "lib/observers/http-probe.ts"
      ),
  },
  {
    name: "Anthropic independent probe is registered (Sprint 12)",
    run: () => {
      if (!fileExists("apps/models/lib/observers/anthropic-probe.ts")) {
        return "lib/observers/anthropic-probe.ts is missing.";
      }
      const registry = readRel("apps/models/lib/observers/index.ts");
      if (!/anthropicIndependentProbe/.test(registry)) {
        return "lib/observers/index.ts does not register anthropicIndependentProbe.";
      }
      return null;
    },
  },
  {
    name: "Google vendor-status observer is registered (Sprint 12)",
    run: () => {
      if (!fileExists("apps/models/lib/observers/google.ts")) {
        return "lib/observers/google.ts is missing.";
      }
      const registry = readRel("apps/models/lib/observers/index.ts");
      if (!/googleStatusObserver/.test(registry)) {
        return "lib/observers/index.ts does not register googleStatusObserver.";
      }
      return null;
    },
  },
  {
    name: "every observer declares a source field (Sprint 12)",
    run: () => {
      const failures: string[] = [];
      const files = [
        "apps/models/lib/observers/anthropic.ts",
        "apps/models/lib/observers/google.ts",
        "apps/models/lib/observers/http-probe.ts",
      ];
      for (const rel of files) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        // Each StatusObserver literal must set `source:`.
        if (!/source:\s*"(vendor_status_api|vendor_status_page|independent_http_probe)"/.test(src)) {
          failures.push(
            `${rel} declares an observer without a typed \`source:\` field.`
          );
        }
      }
      // The StatusObserver interface itself must require source.
      const types = readRel("apps/models/lib/status-observations.ts");
      if (
        !/StatusObserver[\s\S]{0,400}source:\s*StatusObservationSource/.test(
          types
        )
      ) {
        failures.push(
          "StatusObserver interface in lib/status-observations.ts must require a `source: StatusObservationSource` field."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "HTTP probe factory targets a non-inference public surface (Sprint 12)",
    run: () => {
      const src = readRel("apps/models/lib/observers/http-probe.ts");
      const failures: string[] = [];
      // The factory itself must not name any inference endpoint
      // (Messages, generateContent, chat/completions) — that's a policy
      // marker; concrete probes must point at non-inference URLs.
      if (/\/v1\/messages|generateContent|chat\/completions/.test(src)) {
        failures.push(
          "lib/observers/http-probe.ts references an inference endpoint — probes must point at non-inference surfaces only."
        );
      }
      // No Authorization header / API key reference inside the factory.
      if (/Authorization\s*:|api[_-]?key/i.test(src)) {
        failures.push(
          "lib/observers/http-probe.ts references Authorization / api_key — probes must be unauthenticated."
        );
      }
      // Must declare source = independent_http_probe on the returned
      // observer.
      if (
        !/source:\s*"independent_http_probe"/.test(src)
      ) {
        failures.push(
          "lib/observers/http-probe.ts does not stamp source: \"independent_http_probe\" on the returned observer."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no probe target is an inference endpoint (Sprint 12)",
    run: () => {
      const failures: string[] = [];
      // Specific probe modules.
      const probeFiles = [
        "apps/models/lib/observers/anthropic-probe.ts",
      ];
      for (const rel of probeFiles) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        // Strip JSDoc/line comments first — the cautionary "we are NOT
        // calling /v1/messages" lives in module-level documentation
        // and must not trip the policy guard.
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        if (
          /\/v1\/messages\b|generateContent\b|\/chat\/completions\b|\/embeddings\b|\/audio\/(speech|transcriptions)\b|\/images\/(generations|edits)\b/.test(
            stripped
          )
        ) {
          failures.push(
            `${rel} appears to target an inference / billing endpoint. Probe URLs must be public, non-billing surfaces.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/status page never claims probes measure API uptime (Sprint 12)",
    run: () => {
      const src = readRel("apps/models/app/status/page.tsx").replace(
        /\s+/g,
        " "
      );
      const failures: string[] = [];
      // The page must label probes as reachability signals, not uptime
      // measurements. Look for the explicit caveat phrase.
      if (!/reachability signal/i.test(src)) {
        failures.push(
          "/status page must describe probe success as a reachability signal, not API uptime."
        );
      }
      // Forbid the phrase "probe-based uptime" / "probe uptime" as a
      // headline claim (this is the exact relabelling we're guarding).
      if (/probe[- ]?(?:based\s+)?uptime/i.test(src)) {
        failures.push(
          "/status page conflates probe success with API uptime — probe-success rate is not uptime."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "route-contract module exists (Sprint 13)",
    run: () =>
      requireFile(
        "apps/models/lib/route-contract.ts",
        "lib/route-contract.ts"
      ),
  },
  {
    name: "/api/debug/deployment route exists (Sprint 13)",
    run: () =>
      requireFile(
        "apps/models/app/api/debug/deployment/route.ts",
        "/api/debug/deployment"
      ),
  },
  {
    name: "/api/debug/deployment never exposes secret env values (Sprint 13)",
    run: () => {
      const src = readRel("apps/models/app/api/debug/deployment/route.ts");
      const failures: string[] = [];
      // The endpoint may MENTION these names (e.g. in comments) but
      // must not read their values into the response. The
      // `readVercelEnv` helper is restricted to a whitelisted set; we
      // additionally forbid any literal read of the banned envs in this
      // file.
      for (const banned of [
        "CRON_SECRET",
        "KV_REST_API_TOKEN",
        "KV_REST_API_URL",
      ]) {
        // Match `process.env.<name>` or `process.env["<name>"]` or
        // template-string interpolation — all forms that would leak.
        const readPattern = new RegExp(
          `process\\.env\\.${banned}\\b|process\\.env\\[\\s*["']${banned}["']\\s*\\]`
        );
        if (readPattern.test(src)) {
          failures.push(
            `/api/debug/deployment reads ${banned} from process.env — that value must never appear in a debug payload.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/api/site advertises statusEndpoints + routes contract (Sprint 13)",
    run: () => {
      const src = readRel("apps/models/app/api/site/route.ts");
      const failures: string[] = [];
      if (!/STATUS_ENDPOINTS|statusEndpoints/.test(src)) {
        failures.push(
          "/api/site does not surface statusEndpoints — partner integrations rely on this field."
        );
      }
      if (!/DEBUG_ENDPOINTS|debugEndpoints/.test(src)) {
        failures.push(
          "/api/site does not surface debugEndpoints."
        );
      }
      if (!/ROUTE_SET_VERSION|routeSetVersion/.test(src)) {
        failures.push(
          "/api/site does not surface routeSetVersion — smoke tests rely on this for staleness detection."
        );
      }
      // It must use the contract (REQUIRED_PAGE_ROUTES) rather than a
      // hand-rolled array — that's how the routes list drifted last time.
      if (!/REQUIRED_PAGE_ROUTES/.test(src)) {
        failures.push(
          "/api/site does not import REQUIRED_PAGE_ROUTES from lib/route-contract.ts — route lists must come from the contract."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "route contract lists /coverage and /sources as required pages",
    run: () => {
      const src = readRel("apps/models/lib/route-contract.ts");
      const failures: string[] = [];
      for (const path of ["/coverage", "/sources", "/status", "/pricing"]) {
        if (!new RegExp(`"${path}"`).test(src)) {
          failures.push(
            `lib/route-contract.ts does not list "${path}" in REQUIRED_PAGE_ROUTES.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "smoke-production + smoke-local scripts exist (Sprint 13)",
    run: () => {
      const failures: string[] = [];
      for (const rel of [
        "scripts/smoke-production.mjs",
        "scripts/smoke-local.mjs",
        "scripts/lib/smoke.mjs",
      ]) {
        if (!fileExists(rel)) failures.push(`Missing ${rel}`);
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "package.json wires smoke:production + smoke:local",
    run: () => {
      const src = readRel("package.json");
      const failures: string[] = [];
      if (!/"smoke:production":\s*"node scripts\/smoke-production\.mjs"/.test(src)) {
        failures.push(
          "package.json does not declare smoke:production -> node scripts/smoke-production.mjs"
        );
      }
      if (!/"smoke:local":\s*"node scripts\/smoke-local\.mjs"/.test(src)) {
        failures.push(
          "package.json does not declare smoke:local -> node scripts/smoke-local.mjs"
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "smoke script list stays in sync with route contract",
    run: () => {
      // The smoke core (scripts/lib/smoke.mjs) hand-codes the route
      // list because Node can't import the TS contract at runtime.
      // We enforce parity here: every literal API path in the contract
      // must appear in the smoke script's API_ROUTES list, and every
      // page in the contract must appear in PAGE_ROUTES.
      const contract = readRel("apps/models/lib/route-contract.ts");
      const smoke = readRel("scripts/lib/smoke.mjs");
      const failures: string[] = [];

      const pagesBlock = contract.match(/REQUIRED_PAGE_ROUTES[\s\S]*?\]\s*as const/);
      if (!pagesBlock) {
        return "Could not locate REQUIRED_PAGE_ROUTES in lib/route-contract.ts.";
      }
      const pageMatches = [
        ...pagesBlock[0].matchAll(/"(\/[^"]*)"/g),
      ].map((m) => m[1]);
      for (const p of pageMatches) {
        if (!smoke.includes(`"${p}"`)) {
          failures.push(
            `scripts/lib/smoke.mjs PAGE_ROUTES is missing "${p}" (declared in route contract).`
          );
        }
      }

      const apisBlock = contract.match(/REQUIRED_API_ROUTES[\s\S]*?\]\s*as const/);
      if (apisBlock) {
        const apiMatches = [
          ...apisBlock[0].matchAll(/"(\/api\/[^"]*)"/g),
        ].map((m) => m[1]);
        for (const p of apiMatches) {
          // The smoke script may decorate the URL (e.g. ?hours=24),
          // so check the base path is present.
          if (!smoke.includes(`"${p}`)) {
            failures.push(
              `scripts/lib/smoke.mjs API_ROUTES is missing "${p}" (declared in route contract).`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "DEPLOYMENT.md contains the Vercel deployment recovery checklist",
    run: () => {
      const md = readRel("DEPLOYMENT.md");
      const failures: string[] = [];
      if (!/Vercel deployment recovery checklist/i.test(md)) {
        failures.push(
          "DEPLOYMENT.md does not include the 'Vercel deployment recovery checklist' section."
        );
      }
      // Recovery checklist must reference the smoke command.
      if (!/npm run smoke:production/.test(md)) {
        failures.push(
          "DEPLOYMENT.md recovery checklist must mention `npm run smoke:production`."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "content registry module exists (Sprint 14)",
    run: () =>
      requireFile("apps/models/lib/content.ts", "lib/content.ts"),
  },
  {
    name: "ContentPageShell component exists (Sprint 14)",
    run: () =>
      requireFile(
        "apps/models/components/ContentPageShell.tsx",
        "components/ContentPageShell.tsx"
      ),
  },
  {
    name: "all research routes from the content registry have route files",
    run: () => {
      const content = readRel("apps/models/lib/content.ts");
      const failures: string[] = [];
      const slugs = [
        ...content.matchAll(/slug:\s*"(\/research\/[^"]+)"/g),
      ].map((m) => m[1]);
      for (const slug of slugs) {
        const dir = `apps/models/app${slug}/page.tsx`;
        if (!fileExists(dir)) failures.push(`Missing route file ${dir}`);
      }
      // Sanity: 8 research routes expected per the Sprint 14 plan.
      if (slugs.length < 8) {
        failures.push(
          `Content registry lists only ${slugs.length} research routes; Sprint 14 expects 8.`
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "all docs routes from the content registry have route files",
    run: () => {
      const content = readRel("apps/models/lib/content.ts");
      const failures: string[] = [];
      const slugs = [
        ...content.matchAll(/slug:\s*"(\/docs\/[^"]+)"/g),
      ].map((m) => m[1]);
      for (const slug of slugs) {
        const dir = `apps/models/app${slug}/page.tsx`;
        if (!fileExists(dir)) failures.push(`Missing route file ${dir}`);
      }
      if (slugs.length < 6) {
        failures.push(
          `Content registry lists only ${slugs.length} docs routes; Sprint 14 expects 6.`
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/research hub references the content registry",
    run: () => {
      const src = readRel("apps/models/app/research/page.tsx");
      if (!/from\s+["']@\/lib\/content["']/.test(src)) {
        return "/research/page.tsx does not import from @/lib/content — the hub must read from the registry.";
      }
      return null;
    },
  },
  {
    name: "/docs hub references the content registry",
    run: () => {
      const src = readRel("apps/models/app/docs/page.tsx");
      if (!/from\s+["']@\/lib\/content["']/.test(src)) {
        return "/docs/page.tsx does not import from @/lib/content — the hub must read from the registry.";
      }
      return null;
    },
  },
  {
    name: "sitemap surfaces content pages",
    run: () => {
      const src = readRel("apps/models/app/sitemap.ts");
      if (!/from\s+["']@\/lib\/content["']/.test(src)) {
        return "sitemap.ts does not import from @/lib/content — content pages must appear in the sitemap.";
      }
      return null;
    },
  },
  {
    name: "llms.txt enumerates research + docs pages",
    run: () => {
      const src = readRel("apps/models/app/llms.txt/route.ts");
      if (!/from\s+["']@\/lib\/content["']/.test(src)) {
        return "llms.txt route does not import the content registry — research / docs pages will not appear.";
      }
      return null;
    },
  },
  {
    name: "/api/site enumerates research + docs pages",
    run: () => {
      const src = readRel("apps/models/app/api/site/route.ts");
      const failures: string[] = [];
      if (!/researchPages/.test(src)) {
        failures.push(
          "/api/site does not surface a researchPages field. Partner integrations / smoke tests cannot discover the content."
        );
      }
      if (!/docsPages/.test(src)) {
        failures.push("/api/site does not surface a docsPages field.");
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no content page contains forbidden marketing phrasing",
    run: () => {
      // Pages must NOT contain blanket marketing claims. The phrases
      // below are policy violations regardless of context. We scan the
      // /research and /docs route trees only — site-wide phrases like
      // those are allowed in disclaimers / refutation context (see the
      // existing no-winner guard for that pattern).
      const banned: { pattern: RegExp; label: string }[] = [
        { pattern: /\bbest AI model\b/i, label: "best AI model" },
        { pattern: /\bguaranteed uptime\b/i, label: "guaranteed uptime" },
        {
          pattern: /\breal[- ]time uptime percentage\b/i,
          label: "real-time uptime percentage",
        },
        { pattern: /\bofficial partner\b/i, label: "official partner" },
        { pattern: /\btrusted by OpenAI\b/i, label: "trusted by OpenAI" },
      ];
      const failures: string[] = [];
      // Walk research + docs trees.
      const roots = [
        "apps/models/app/research",
        "apps/models/app/docs",
      ];
      const walk = (dir: string, acc: string[]): string[] => {
        const here = resolve(ROOT, dir);
        let entries: string[] = [];
        try {
          entries = readdirSync(here);
        } catch {
          return acc;
        }
        for (const e of entries) {
          const rel = `${dir}/${e}`;
          const abs = resolve(ROOT, rel);
          try {
            const st = statSync(abs);
            if (st.isDirectory()) {
              walk(rel, acc);
            } else if (e === "page.tsx") {
              acc.push(rel);
            }
          } catch {
            /* ignore */
          }
        }
        return acc;
      };
      const files: string[] = [];
      for (const r of roots) walk(r, files);
      for (const rel of files) {
        const src = readRel(rel);
        for (const b of banned) {
          if (b.pattern.test(src)) {
            failures.push(
              `${rel} contains forbidden phrase "${b.label}" — content pages must not assert blanket marketing claims.`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "content components directory exists (Sprint 16)",
    run: () => {
      const failures: string[] = [];
      for (const rel of [
        "apps/models/components/content/MethodologyMatrix.tsx",
        "apps/models/components/content/PricingUnitTable.tsx",
        "apps/models/components/content/StatusSignalTable.tsx",
        "apps/models/components/content/ProviderCoverageMatrix.tsx",
        "apps/models/components/content/ContentStatCard.tsx",
        "apps/models/components/content/FieldDefinitionTable.tsx",
      ]) {
        if (!fileExists(rel)) failures.push(`Missing ${rel}`);
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "every research/docs page uses ContentPageShell (Sprint 16)",
    run: () => {
      const failures: string[] = [];
      const roots = [
        "apps/models/app/research",
        "apps/models/app/docs",
      ];
      const walk = (dir: string, acc: string[]): string[] => {
        const here = resolve(ROOT, dir);
        let entries: string[] = [];
        try {
          entries = readdirSync(here);
        } catch {
          return acc;
        }
        for (const e of entries) {
          const rel = `${dir}/${e}`;
          const abs = resolve(ROOT, rel);
          try {
            const st = statSync(abs);
            if (st.isDirectory()) {
              walk(rel, acc);
            } else if (e === "page.tsx") {
              acc.push(rel);
            }
          } catch {
            /* ignore */
          }
        }
        return acc;
      };
      const files: string[] = [];
      for (const r of roots) walk(r, files);
      // Hub pages (the two index pages) intentionally render their own
      // chrome — skip them.
      const hubs = new Set([
        "apps/models/app/research/page.tsx",
        "apps/models/app/docs/page.tsx",
      ]);
      for (const rel of files) {
        if (hubs.has(rel)) continue;
        const src = readRel(rel);
        if (!/<ContentPageShell\b/.test(src)) {
          failures.push(
            `${rel} does not render <ContentPageShell> — every research/docs detail page must use the shared shell.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "Mistral Large 3 is verified end-to-end (Sprint 16)",
    run: () => {
      const src = readRel("apps/models/data/models.ts");
      const block = src.split('slug: "mistral-large-3"').pop() ?? "";
      const head = block.slice(0, 6000);
      const failures: string[] = [];
      if (!/verificationStatus:\s*"verified"/.test(head)) {
        failures.push(
          "mistral-large-3 entry must carry verificationStatus: 'verified' after the Sprint 16 expansion."
        );
      }
      if (!/canonical:\s*"mistral-large-2512"/.test(head)) {
        failures.push(
          "mistral-large-3 canonical must be the pinned snapshot 'mistral-large-2512'."
        );
      }
      if (!/contextWindow:\s*verified\(256_000/.test(head)) {
        failures.push(
          "mistral-large-3 contextWindow must be verified(256_000) from the v25.12 spec card."
        );
      }
      // Pricing must include both base rows with the verified amounts.
      if (!/verified\(0\.5,\s*mistralLarge3ModelCard/.test(head)) {
        failures.push(
          "mistral-large-3 must have a verified $0.5/M input pricing row sourced from the spec card."
        );
      }
      if (!/verified\(1\.5,\s*mistralLarge3ModelCard/.test(head)) {
        failures.push(
          "mistral-large-3 must have a verified $1.5/M output pricing row sourced from the spec card."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no OpenAI metric appears without an OpenAI citation (Sprint 16)",
    run: () => {
      const src = readRel("apps/models/data/models.ts");
      const citations = readRel("apps/models/data/citations.ts");
      // Allow the GPT-5 entry as long as it's still wrapped in
      // unverifiedModel(); fail if a verified() call is made against an
      // openai-slug model without an OpenAI citation token.
      const gpt5Block = src.match(
        /unverifiedModel\(\{[^}]*?slug:\s*"gpt-5"[\s\S]*?\}\)/
      );
      if (!gpt5Block) {
        // GPT-5 is no longer in the unverified bucket — require an
        // OpenAI citation in citations.ts.
        if (!/openai/i.test(citations)) {
          return "GPT-5 is no longer in unverifiedModel(...) but no openai citation has been added to citations.ts.";
        }
      }
      return null;
    },
  },
  {
    name: "no content page contains a numeric uptime percentage (Sprint 16)",
    run: () => {
      const failures: string[] = [];
      const roots = [
        "apps/models/app/research",
        "apps/models/app/docs",
      ];
      const walk = (dir: string, acc: string[]): string[] => {
        const here = resolve(ROOT, dir);
        let entries: string[] = [];
        try {
          entries = readdirSync(here);
        } catch {
          return acc;
        }
        for (const e of entries) {
          const rel = `${dir}/${e}`;
          const abs = resolve(ROOT, rel);
          try {
            const st = statSync(abs);
            if (st.isDirectory()) {
              walk(rel, acc);
            } else if (e === "page.tsx") {
              acc.push(rel);
            }
          } catch {
            /* ignore */
          }
        }
        return acc;
      };
      const files: string[] = [];
      for (const r of roots) walk(r, files);
      for (const rel of files) {
        const src = readRel(rel);
        // Strip comments so cautionary "no 99.9% claim" prose doesn't trip.
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        const offending = [
          ...stripped.matchAll(/\b\d{1,3}\.\d+\s*%/g),
          ...stripped.matchAll(/\b(?:99|100)\s*%/g),
        ];
        if (offending.length) {
          failures.push(
            `${rel} contains numeric percentage literal(s): ${offending
              .map((m) => `"${m[0]}"`)
              .join(", ")}`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "entity-polish components exist (Sprint 17)",
    run: () => {
      const failures: string[] = [];
      for (const rel of [
        "apps/models/components/entity/EntityActionRail.tsx",
        "apps/models/components/entity/EntityDataGaps.tsx",
        "apps/models/components/entity/EntityMethodologyLinks.tsx",
        "apps/models/components/entity/EntityVerificationChecklist.tsx",
      ]) {
        if (!fileExists(rel)) failures.push(`Missing ${rel}`);
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "every detail page renders the action rail (Sprint 17)",
    run: () => {
      const failures: string[] = [];
      for (const rel of [
        "apps/models/app/models/[slug]/page.tsx",
        "apps/models/app/providers/[slug]/page.tsx",
        "apps/models/app/compare/[slug]/page.tsx",
      ]) {
        const src = readRel(rel);
        if (!/<EntityActionRail\b/.test(src)) {
          failures.push(`${rel} does not render <EntityActionRail>.`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "every detail page renders methodology links (Sprint 17)",
    run: () => {
      const failures: string[] = [];
      for (const rel of [
        "apps/models/app/models/[slug]/page.tsx",
        "apps/models/app/providers/[slug]/page.tsx",
        "apps/models/app/compare/[slug]/page.tsx",
      ]) {
        const src = readRel(rel);
        if (!/<EntityMethodologyLinks\b/.test(src)) {
          failures.push(`${rel} does not render <EntityMethodologyLinks>.`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "model + provider detail pages render data gaps panel (Sprint 17)",
    run: () => {
      const failures: string[] = [];
      for (const rel of [
        "apps/models/app/models/[slug]/page.tsx",
        "apps/models/app/providers/[slug]/page.tsx",
      ]) {
        const src = readRel(rel);
        if (!/<EntityDataGaps\b/.test(src)) {
          failures.push(`${rel} does not render <EntityDataGaps>.`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "indexing-qa script + npm task exist (Sprint 17)",
    run: () => {
      const failures: string[] = [];
      if (!fileExists("scripts/indexing-qa.mjs")) {
        failures.push("Missing scripts/indexing-qa.mjs");
      }
      const pkg = readRel("package.json");
      if (!/"qa:indexing":\s*"node scripts\/indexing-qa\.mjs"/.test(pkg)) {
        failures.push(
          "package.json missing the qa:indexing → node scripts/indexing-qa.mjs script."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no detail page uses salesy CTA copy (Sprint 17)",
    run: () => {
      const failures: string[] = [];
      const targets = [
        "apps/models/app/models/[slug]/page.tsx",
        "apps/models/app/providers/[slug]/page.tsx",
        "apps/models/app/compare/[slug]/page.tsx",
        "apps/models/app/page.tsx",
      ];
      // Forbid these exact strings (case-insensitive). Same disciplines
      // we apply to research/docs pages — see the content-pages guard.
      const banned: { pattern: RegExp; label: string }[] = [
        { pattern: /\bGet started\b/i, label: "Get started" },
        { pattern: /\bStart now\b/i, label: "Start now" },
        { pattern: /\bBest model\b/i, label: "Best model" },
        { pattern: /\bChoose winner\b/i, label: "Choose winner" },
        { pattern: /\bOfficial partner\b/i, label: "Official partner" },
        { pattern: /\bTrusted by OpenAI\b/i, label: "Trusted by OpenAI" },
        {
          pattern: /\bMaximi[sz]e AI performance\b/i,
          label: "Maximize AI performance",
        },
      ];
      for (const rel of targets) {
        const src = readRel(rel);
        // Strip JSDoc + line comments so cautionary phrasing in
        // maintainer notes (e.g. "// no 'Get started' here") does
        // not trip the guard.
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        for (const b of banned) {
          if (b.pattern.test(stripped)) {
            failures.push(
              `${rel} contains banned CTA phrase "${b.label}".`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "Meta Llama 4 records cite the Meta model card (Sprint 18)",
    run: () => {
      const src = readRel("apps/models/data/models.ts");
      const failures: string[] = [];
      for (const slug of ["llama-4-scout", "llama-4-maverick"]) {
        const block = src.split(`slug: "${slug}"`).pop() ?? "";
        const head = block.slice(0, 6000);
        if (!/verificationStatus:\s*"verified"/.test(head)) {
          failures.push(
            `${slug} must carry verificationStatus: "verified" after the Sprint 18 expansion.`
          );
        }
        if (!/metaLlama4ModelCard/.test(head)) {
          failures.push(
            `${slug} must cite metaLlama4ModelCard from data/citations.ts.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no Meta pricing without an official Meta pricing citation",
    run: () => {
      const src = readRel("apps/models/data/models.ts");
      const failures: string[] = [];
      for (const slug of ["llama-4-scout", "llama-4-maverick"]) {
        const block = src.split(`slug: "${slug}"`).pop() ?? "";
        const head = block.slice(0, 6000);
        // pricing must be empty []. Meta has no first-party hosted API
        // price. If anyone adds a verified() pricing row to a Llama
        // record, the entry must also reference a metaLlama*Pricing
        // citation that currently does not exist — block the build.
        const pricingMatch = head.match(/pricing:\s*\[([\s\S]*?)\]/);
        if (pricingMatch && /verified\(/.test(pricingMatch[1])) {
          failures.push(
            `${slug} carries a verified pricing row. Meta does not run a first-party hosted API for Llama — pricing must remain empty on Llama records unless a metaLlama*Pricing citation is added to data/citations.ts.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "Groq + Together verification covers provider only, not third-party model attribution",
    run: () => {
      const src = readRel("apps/models/data/models.ts");
      const failures: string[] = [];
      // No ModelEntity should declare providerSlug "groq" or "together-ai"
      // for a model that is actually created by Meta/DeepSeek/Qwen/etc.
      // Today we have ZERO models attributed to either platform — and
      // that's the correct state. Block any future drift.
      for (const slug of ["groq", "together-ai"]) {
        const re = new RegExp(`providerSlug:\\s*"${slug}"`);
        if (re.test(src)) {
          failures.push(
            `Found ModelEntity with providerSlug: "${slug}". Hosted-platform providers should not own per-model entries — those would misattribute the model's origin.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no \"fastest model\" or \"best model\" copy on data records (Sprint 18)",
    run: () => {
      const failures: string[] = [];
      const dataFiles = [
        "apps/models/data/models.ts",
        "apps/models/data/providers.ts",
        "apps/models/data/comparisons.ts",
        "apps/models/data/citations.ts",
      ];
      const banned = /\bbest\s+(?:ai\s+)?model\b|\bfastest\s+(?:ai\s+)?model\b|\bfastest\s+inference\b/i;
      for (const rel of dataFiles) {
        const src = readRel(rel);
        // Strip comments first; cautionary mentions are OK.
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        if (banned.test(stripped)) {
          failures.push(
            `${rel} contains "best model" / "fastest model" / "fastest inference" copy outside comments.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "Mistral × Anthropic comparison is two-sided verified (Sprint 18)",
    run: () => {
      const src = readRel("apps/models/data/comparisons.ts");
      const block = src
        .split('slug: "mistral-large-3-vs-claude-sonnet-4-6"')
        .pop() ?? "";
      const head = block.slice(0, 3000);
      if (!/verificationStatus:\s*"verified"/.test(head)) {
        return "mistral-large-3-vs-claude-sonnet-4-6 must be verificationStatus: \"verified\" now that both sides are verified end-to-end.";
      }
      return null;
    },
  },
  {
    name: "entity-graph helpers do not perform network fetches",
    run: () => {
      const src = readRel("apps/models/lib/entity-graph.ts");
      // The helpers should be pure local reads. Forbid `fetch(`,
      // `process.env`, and dynamic imports of network clients.
      const banned = [/\bfetch\s*\(/, /\bprocess\.env\b/];
      const failures: string[] = [];
      for (const re of banned) {
        if (re.test(src)) {
          failures.push(
            `lib/entity-graph.ts references ${re} — helpers must be pure local reads.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
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
  // ---------------------------------------------------------------------
  // Sprint 19 — hosted-provider pricing schema guards.
  //
  // The schema in lib/types.ts defines PricingRecord with explicit
  // modelCreatorProviderSlug + billingProviderSlug + pricingContext
  // fields; hosted-pricing rows live in data/hosted-pricing.ts. These
  // guards make sure:
  //   - the schema literals stay present
  //   - every hosted row separates creator from billing provider
  //   - hosted rows never claim model-creator attribution from a
  //     hosting platform (Groq/Together) — the creator slug must point
  //     at the actual model creator (meta, deepseek, …)
  //   - every hosted price has a citation
  //   - hosted rows cite the billing provider's own pricing page
  //   - Meta first-party Llama pricing remains empty unless a
  //     metaLlama*Pricing citation appears in data/citations.ts
  //   - /pricing renders both sections and the methodology note
  //   - docs/pricing-fields and research/api-pricing-methodology
  //     document the hosted distinction
  // ---------------------------------------------------------------------
  {
    name: "PricingContext literal union exists in lib/types.ts (Sprint 19)",
    run: () => {
      const src = readRel("apps/models/lib/types.ts");
      const required = [
        '"model_creator_first_party_api"',
        '"hosted_provider_api"',
        '"cloud_marketplace"',
      ];
      const missing = required.filter((lit) => !src.includes(lit));
      if (missing.length) {
        return `PricingContext union in lib/types.ts is missing literal(s): ${missing.join(
          ", "
        )}.`;
      }
      if (!/export type PricingContext\s*=/.test(src)) {
        return "Could not locate `export type PricingContext = ...` in lib/types.ts.";
      }
      return null;
    },
  },
  {
    name: "PricingRecord schema declares creator + billing + context fields (Sprint 19)",
    run: () => {
      const src = readRel("apps/models/lib/types.ts");
      const required = [
        "modelCreatorProviderSlug",
        "billingProviderSlug",
        "pricingContext",
      ];
      const missing = required.filter((f) => !new RegExp(`\\b${f}\\b`).test(src));
      if (missing.length) {
        return `PricingRecord shape in lib/types.ts is missing field(s): ${missing.join(
          ", "
        )}.`;
      }
      return null;
    },
  },
  {
    name: "hosted-pricing.ts exists and only declares hosted_provider_api rows",
    run: () => {
      const rel = "apps/models/data/hosted-pricing.ts";
      if (!fileExists(rel)) {
        return "Missing data/hosted-pricing.ts — Sprint 19 introduced this file.";
      }
      const src = readRel(rel);
      // Strip block + line comments before scanning context literals so
      // explanatory copy doesn't false-positive.
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      // Every PricingRecord literal must declare
      // pricingContext: "hosted_provider_api". Anything else under this
      // file is the wrong context.
      const contexts = Array.from(
        stripped.matchAll(/pricingContext:\s*"([^"]+)"/g)
      ).map((m) => m[1]);
      if (contexts.length === 0) {
        return "data/hosted-pricing.ts contains no pricingContext literal — at least one hosted row is required.";
      }
      const bad = contexts.filter((c) => c !== "hosted_provider_api");
      if (bad.length) {
        return `data/hosted-pricing.ts declares non-hosted pricingContext literal(s): ${bad.join(
          ", "
        )}. Move first-party rows back to model.pricing.`;
      }
      return null;
    },
  },
  {
    name: "every hosted-pricing row separates creator from billing provider (Sprint 19)",
    run: () => {
      const rel = "apps/models/data/hosted-pricing.ts";
      const src = readRel(rel);
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      // Split into record blocks by id: "...". A row block is roughly
      // from one `id: "hosted-pricing-..."` to the next.
      const recordRe = /id:\s*"hosted-pricing-[^"]+"[\s\S]*?(?=id:\s*"hosted-pricing-|\];|\n\];)/g;
      const blocks = Array.from(stripped.matchAll(recordRe)).map((m) => m[0]);
      if (blocks.length === 0) {
        return "Could not locate any hosted-pricing record blocks in data/hosted-pricing.ts.";
      }
      const failures: string[] = [];
      for (const block of blocks) {
        const idMatch = block.match(/id:\s*"([^"]+)"/);
        const id = idMatch?.[1] ?? "<unknown row>";
        const creator = block.match(
          /modelCreatorProviderSlug:\s*"([^"]+)"/
        )?.[1];
        const billing = block.match(
          /billingProviderSlug:\s*"([^"]+)"/
        )?.[1];
        if (!creator || !billing) {
          failures.push(
            `${id}: missing modelCreatorProviderSlug or billingProviderSlug.`
          );
          continue;
        }
        if (creator === billing) {
          failures.push(
            `${id}: modelCreatorProviderSlug and billingProviderSlug are both "${creator}" — hosted rows must split the two. Move this row back to a model record's pricing array.`
          );
        }
        // Hosted-platform providers (groq, together-ai) must never sit
        // on the creator side — that would misattribute the model.
        if (creator === "groq" || creator === "together-ai") {
          failures.push(
            `${id}: modelCreatorProviderSlug is "${creator}" but Groq / Together AI are hosting platforms, not model creators.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "every hosted-pricing tier has a verified citation (Sprint 19)",
    run: () => {
      const rel = "apps/models/data/hosted-pricing.ts";
      const src = readRel(rel);
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      // Every `amount: verified(...)` call must include a citation
      // argument (the verified() helper enforces this at runtime; we
      // also re-check at the source level so a malformed row never
      // ships).
      const re = /amount:\s*verified\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g;
      const failures: string[] = [];
      let m: RegExpExecArray | null;
      while ((m = re.exec(stripped)) !== null) {
        const args = m[1];
        // verified(value, citation, opts?). At minimum we need two
        // top-level comma-separated arguments.
        const depth = (s: string) => {
          let d = 0;
          const parts: string[] = [];
          let cur = "";
          for (const ch of s) {
            if (ch === "(") d++;
            else if (ch === ")") d--;
            if (ch === "," && d === 0) {
              parts.push(cur);
              cur = "";
            } else {
              cur += ch;
            }
          }
          if (cur.length) parts.push(cur);
          return parts;
        };
        const parts = depth(args);
        if (parts.length < 2) {
          failures.push(
            `hosted-pricing row tier calls verified(...) without a citation argument: \`amount: verified(${args.trim()})\``
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "Groq hosted-pricing rows cite the Groq pricing page",
    run: () => {
      const rel = "apps/models/data/hosted-pricing.ts";
      const src = readRel(rel);
      // If a row sets billingProviderSlug: "groq", the surrounding
      // record must reference the groqPricing citation token.
      const re = /\{[^{}]*billingProviderSlug:\s*"groq"[\s\S]*?\}/g;
      const blocks = src.match(re) ?? [];
      const failures: string[] = [];
      for (const b of blocks) {
        if (!/groqPricing/.test(b)) {
          failures.push(
            "A hosted-pricing row with billingProviderSlug='groq' does not reference the groqPricing citation. Groq prices must cite Groq's own pricing page."
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "Together hosted-pricing rows cite the Together pricing page",
    run: () => {
      const rel = "apps/models/data/hosted-pricing.ts";
      const src = readRel(rel);
      const re = /\{[^{}]*billingProviderSlug:\s*"together-ai"[\s\S]*?\}/g;
      const blocks = src.match(re) ?? [];
      const failures: string[] = [];
      for (const b of blocks) {
        if (!/togetherPricing/.test(b)) {
          failures.push(
            "A hosted-pricing row with billingProviderSlug='together-ai' does not reference the togetherPricing citation. Together prices must cite Together's own pricing page."
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "Sprint 19 hosted-pricing citations are registered",
    run: () => {
      const src = readRel("apps/models/data/citations.ts");
      const failures: string[] = [];
      if (!/export const groqPricing:/.test(src)) {
        failures.push(
          "data/citations.ts must export `groqPricing` — Sprint 19 sourced Groq hosted pricing from groq.com/pricing."
        );
      }
      if (!/export const togetherPricing:/.test(src)) {
        failures.push(
          "data/citations.ts must export `togetherPricing` — Sprint 19 sourced Together hosted pricing from together.ai/pricing."
        );
      }
      // Pricing citations must be official-vendor-pricing source type.
      for (const token of ["groqPricing", "togetherPricing"]) {
        const block = src.split(`export const ${token}`).pop() ?? "";
        const head = block.slice(0, 800);
        if (!/type:\s*"official-vendor-pricing"/.test(head)) {
          failures.push(
            `${token} must be source type "official-vendor-pricing".`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "Meta first-party Llama pricing remains empty without an official Meta pricing citation (Sprint 19 re-check)",
    run: () => {
      const citations = readRel("apps/models/data/citations.ts");
      const models = readRel("apps/models/data/models.ts");
      // If no metaLlama*Pricing citation exists, neither Llama 4 record
      // may carry a verified first-party pricing row. This re-checks the
      // Sprint 18 guard against drift now that Sprint 19 has added
      // hosted-pricing rows in a separate file.
      const hasMetaPricingCitation = /export const metaLlama[^:]*Pricing:/.test(
        citations
      );
      if (hasMetaPricingCitation) return null;
      for (const slug of ["llama-4-scout", "llama-4-maverick"]) {
        const block = models.split(`slug: "${slug}"`).pop() ?? "";
        const head = block.slice(0, 6000);
        const pricingMatch = head.match(/pricing:\s*\[([\s\S]*?)\]/);
        if (pricingMatch && /verified\(/.test(pricingMatch[1])) {
          return `${slug} carries a verified first-party pricing row but no metaLlama*Pricing citation exists in data/citations.ts. Hosted-provider pricing lives in data/hosted-pricing.ts, not on the model record.`;
        }
      }
      return null;
    },
  },
  {
    name: "data/pricing.ts exports unified records derived from both sources (Sprint 19)",
    run: () => {
      const src = readRel("apps/models/data/pricing.ts");
      const failures: string[] = [];
      if (!/export const firstPartyPricing:/.test(src)) {
        failures.push(
          "data/pricing.ts must export `firstPartyPricing` derived from models[].pricing."
        );
      }
      if (!/export const allPricingRecords:/.test(src)) {
        failures.push(
          "data/pricing.ts must export `allPricingRecords` merging first-party + hosted records."
        );
      }
      if (!/from "\.\/hosted-pricing"/.test(src)) {
        failures.push(
          "data/pricing.ts must import from ./hosted-pricing so hosted rows flow into allPricingRecords."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/pricing renders a hosted-provider section and explanatory note (Sprint 19)",
    run: () => {
      const src = readRel("apps/models/app/pricing/page.tsx");
      const failures: string[] = [];
      if (!/Hosted provider API pricing/.test(src)) {
        failures.push(
          "/pricing must render a 'Hosted provider API pricing' section header."
        );
      }
      if (!/First-party model API pricing/.test(src)) {
        failures.push(
          "/pricing must rename the verified section to 'First-party model API pricing' so the two contexts are explicit."
        );
      }
      if (!/Hosted-provider pricing is not the same as model-creator pricing/i.test(src)) {
        failures.push(
          "/pricing must include the explanatory note distinguishing hosted-provider pricing from model-creator pricing."
        );
      }
      if (!/from "@\/data\/hosted-pricing"/.test(src)) {
        failures.push(
          "/pricing must import hostedPricing from data/hosted-pricing."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "docs/pricing-fields documents pricingContext (Sprint 19)",
    run: () => {
      const src = readRel(
        "apps/models/app/docs/pricing-fields/page.tsx"
      );
      const failures: string[] = [];
      if (!/PricingContext: creator vs host/i.test(src)) {
        failures.push(
          "docs/pricing-fields must document `PricingContext` (Sprint 19) with a section header titled 'PricingContext: creator vs host'."
        );
      }
      for (const literal of [
        "model_creator_first_party_api",
        "hosted_provider_api",
      ]) {
        if (!src.includes(literal)) {
          failures.push(
            `docs/pricing-fields must mention the literal \`${literal}\`.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "research/api-pricing-methodology covers hosted-provider distinction (Sprint 19)",
    run: () => {
      const src = readRel(
        "apps/models/app/research/api-pricing-methodology/page.tsx"
      );
      if (!/Model creator vs hosted provider/i.test(src)) {
        return "research/api-pricing-methodology must include a 'Model creator vs hosted provider' section (Sprint 19).";
      }
      if (!/hosted_provider_api/.test(src)) {
        return "research/api-pricing-methodology must reference the `hosted_provider_api` pricingContext literal.";
      }
      return null;
    },
  },
  {
    name: "model-jsonld does not leak hosted pricing into creator Offer (Sprint 19)",
    run: () => {
      const src = readRel("apps/models/lib/model-jsonld.ts");
      // The JSON-LD helper reads from the model entity's own
      // `pricing` array, which is first-party. It must NOT import
      // hostedPricing — that would risk emitting Groq/Together rates
      // under the model creator's schema.org Organization block.
      if (/hostedPricing|from "@\/data\/hosted-pricing"/.test(src)) {
        return "lib/model-jsonld.ts references hostedPricing — JSON-LD must only emit first-party pricing under the model creator's Offer block.";
      }
      return null;
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
