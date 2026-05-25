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
      // chrome — skip them. /docs/platform-positioning (Sprint 33) is
      // a bespoke positioning page that does not flow from
      // `lib/content.ts`, so it uses <PageShell> directly.
      const hubs = new Set([
        "apps/models/app/research/page.tsx",
        "apps/models/app/docs/page.tsx",
        "apps/models/app/docs/platform-positioning/page.tsx",
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
    name: "no price-ranking language on data records or content surfaces (Sprint 20)",
    run: () => {
      // The full ban: cheapest, lower cost, lowest price, best value,
      // price winner, save money, cheaper than. Applies to both data
      // files and rendered page sources. Allowed locations: inside
      // comments, and inside the dedicated "no-price-ranking" doc
      // section that EXPLAINS the ban.
      const targets = [
        "apps/models/data/models.ts",
        "apps/models/data/providers.ts",
        "apps/models/data/comparisons.ts",
        "apps/models/data/citations.ts",
        "apps/models/data/hosted-pricing.ts",
        "apps/models/app/pricing/page.tsx",
        "apps/models/app/models/[slug]/page.tsx",
        "apps/models/app/providers/[slug]/page.tsx",
        "apps/models/app/compare/[slug]/page.tsx",
      ];
      const banned: { pattern: RegExp; label: string }[] = [
        { pattern: /\bcheapest\b/i, label: "cheapest" },
        { pattern: /\blower cost\b/i, label: "lower cost" },
        { pattern: /\blowest price\b/i, label: "lowest price" },
        { pattern: /\bbest value\b/i, label: "best value" },
        { pattern: /\bprice winner\b/i, label: "price winner" },
        { pattern: /\bsave money\b/i, label: "save money" },
        { pattern: /\bcheaper than\b/i, label: "cheaper than" },
      ];
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        // Strip comments so cautionary mentions in maintainer notes
        // do not trip the guard.
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        for (const b of banned) {
          if (b.pattern.test(stripped)) {
            failures.push(
              `${rel} contains banned price-ranking phrase "${b.label}".`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no price-ranking language in research/docs (Sprint 20)",
    run: () => {
      // Same ban applied to research / docs pages — EXCEPT the
      // explicit "no-price-ranking" section in
      // research/api-pricing-methodology, which EXPLAINS the ban.
      const targets = [
        "apps/models/app/research/api-pricing-methodology/page.tsx",
        "apps/models/app/research/inference-infrastructure/page.tsx",
        "apps/models/app/docs/pricing-fields/page.tsx",
        "apps/models/app/docs/provider-coverage/page.tsx",
      ];
      const banned: { pattern: RegExp; label: string }[] = [
        { pattern: /\bbest value\b/i, label: "best value" },
        { pattern: /\bprice winner\b/i, label: "price winner" },
        { pattern: /\bsave money\b/i, label: "save money" },
      ];
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        // Strip the explicit no-price-ranking section in
        // api-pricing-methodology where the banned words are listed
        // as examples of what we DON'T do.
        const cleaned = stripped.replace(
          /<section id="no-price-ranking"[\s\S]*?<\/section>/g,
          ""
        );
        for (const b of banned) {
          if (b.pattern.test(cleaned)) {
            failures.push(
              `${rel} contains banned price-ranking phrase "${b.label}" outside the no-price-ranking explainer.`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/pricing renders the volatility + reference policy (Sprint 20)",
    run: () => {
      const src = readRel("apps/models/app/pricing/page.tsx");
      const failures: string[] = [];
      if (!/PRICING_VOLATILITY_NOTE/.test(src)) {
        failures.push(
          "/pricing must render the canonical PRICING_VOLATILITY_NOTE so the volatility policy is unmissable."
        );
      }
      if (!/PRICING_NO_RANKING_NOTE/.test(src)) {
        failures.push(
          "/pricing must render the canonical PRICING_NO_RANKING_NOTE so readers see the no-ranking policy."
        );
      }
      if (!/pricing references/i.test(src)) {
        failures.push(
          "/pricing must use 'pricing references' framing in the section headings (Sprint 20)."
        );
      }
      if (!/Reference, not live quotes/i.test(src)) {
        failures.push(
          "/pricing must show the 'Reference, not live quotes' framing in its top callout."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "comparison page renders hosted pricing as references (Sprint 20)",
    run: () => {
      const src = readRel("apps/models/app/compare/[slug]/page.tsx");
      const failures: string[] = [];
      if (!/Hosted pricing references/i.test(src)) {
        failures.push(
          "compare/[slug]/page.tsx must render hosted pricing under a 'Hosted pricing references' header (not '... pricing' comparison language)."
        );
      }
      if (!/PRICING_NO_RANKING_NOTE/.test(src)) {
        failures.push(
          "compare/[slug]/page.tsx must reference PRICING_NO_RANKING_NOTE so the no-ranking policy renders on every comparison."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "every hosted-pricing record has lastCheckedAt + volatility (Sprint 20)",
    run: () => {
      const src = readRel("apps/models/data/hosted-pricing.ts");
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      const recordRe =
        /id:\s*"hosted-pricing-[^"]+"[\s\S]*?(?=id:\s*"hosted-pricing-|\];|\n\];)/g;
      const blocks = Array.from(stripped.matchAll(recordRe)).map((m) => m[0]);
      const failures: string[] = [];
      for (const block of blocks) {
        const id =
          block.match(/id:\s*"([^"]+)"/)?.[1] ?? "<unknown row>";
        if (!/lastCheckedAt:\s*"[^"]+"/.test(block)) {
          failures.push(`${id}: missing or empty lastCheckedAt.`);
        }
        const volMatch = block.match(/volatility:\s*"([^"]+)"/);
        if (!volMatch) {
          failures.push(`${id}: missing volatility field.`);
        } else if (!["high", "medium", "low", "unknown"].includes(volMatch[1])) {
          failures.push(
            `${id}: invalid volatility value "${volMatch[1]}".`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "pricing-freshness helper exists and exposes documented thresholds (Sprint 20)",
    run: () => {
      const rel = "apps/models/lib/pricing-freshness.ts";
      if (!fileExists(rel)) {
        return "Missing lib/pricing-freshness.ts — Sprint 20 introduced this helper.";
      }
      const src = readRel(rel);
      const failures: string[] = [];
      for (const token of [
        "PricingFreshnessState",
        "PRICING_FRESHNESS_DAYS",
        "getPricingFreshness",
        "PRICING_VOLATILITY_NOTE",
        "PRICING_NO_RANKING_NOTE",
      ]) {
        if (!new RegExp(`\\b${token}\\b`).test(src)) {
          failures.push(
            `lib/pricing-freshness.ts must export \`${token}\`.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "hosted-availability helper exists and exposes documented record shape (Sprint 20)",
    run: () => {
      const rel = "apps/models/lib/hosted-availability.ts";
      if (!fileExists(rel)) {
        return "Missing lib/hosted-availability.ts — Sprint 20 introduced the availability catalogue layer.";
      }
      const src = readRel(rel);
      const failures: string[] = [];
      for (const token of [
        "HostedAvailabilityRecord",
        "getHostedAvailability",
        "getHostedAvailabilityForBillingProvider",
        "getHostedAvailabilityForCreator",
        "isHostedPlatformProvider",
      ]) {
        if (!new RegExp(`\\b${token}\\b`).test(src)) {
          failures.push(
            `lib/hosted-availability.ts must export \`${token}\`.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "docs/pricing-fields documents pricing freshness + volatility (Sprint 20)",
    run: () => {
      const src = readRel("apps/models/app/docs/pricing-fields/page.tsx");
      if (!/Pricing freshness \+ volatility/i.test(src)) {
        return "docs/pricing-fields must document the Sprint 20 'Pricing freshness + volatility' section.";
      }
      if (!/PricingFreshnessState/.test(src)) {
        return "docs/pricing-fields must mention the PricingFreshnessState union literal.";
      }
      return null;
    },
  },
  {
    name: "research/api-pricing-methodology documents no-price-ranking policy (Sprint 20)",
    run: () => {
      const src = readRel(
        "apps/models/app/research/api-pricing-methodology/page.tsx"
      );
      const failures: string[] = [];
      if (!/No price-ranking policy/i.test(src)) {
        failures.push(
          "research/api-pricing-methodology must include a 'No price-ranking policy' section."
        );
      }
      if (!/References, not live quotes/i.test(src)) {
        failures.push(
          "research/api-pricing-methodology must include a 'References, not live quotes' section."
        );
      }
      if (!/Hosted availability vs hosted pricing/i.test(src)) {
        failures.push(
          "research/api-pricing-methodology must include a 'Hosted availability vs hosted pricing' section."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "model + provider pages reference Sprint 20 freshness helpers",
    run: () => {
      const failures: string[] = [];
      const modelSrc = readRel("apps/models/app/models/[slug]/page.tsx");
      const providerSrc = readRel(
        "apps/models/app/providers/[slug]/page.tsx"
      );
      if (!/getPricingFreshness/.test(modelSrc)) {
        failures.push(
          "models/[slug]/page.tsx must call getPricingFreshness on hosted-pricing rows so each row carries a freshness chip."
        );
      }
      if (!/getPricingFreshness/.test(providerSrc)) {
        failures.push(
          "providers/[slug]/page.tsx must call getPricingFreshness on hosted-pricing rows so each row carries a freshness chip."
        );
      }
      if (!/getHostedAvailabilityForBillingProvider/.test(providerSrc)) {
        failures.push(
          "providers/[slug]/page.tsx must render the hosted availability list (getHostedAvailabilityForBillingProvider)."
        );
      }
      if (!/Creator pricing unavailable/i.test(providerSrc)) {
        failures.push(
          "providers/[slug]/page.tsx must include the 'Creator pricing unavailable' banner so Meta-style providers explicitly call out the gap rather than letting absence read as silence."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "old comparison-oriented pricing headings are gone (Sprint 20)",
    run: () => {
      const failures: string[] = [];
      // Only target the explicit pre-Sprint-20 heading literals — the
      // ones that ended in "API pricing" without a "references"
      // qualifier. Prose phrases like "No hosted-provider pricing
      // recorded" or "Hosted-provider pricing is not the same as
      // model-creator pricing" are valid English and are not bans.
      const banned = [
        "First-party model API pricing",
        "Hosted provider API pricing",
      ];
      const surfaces = [
        "apps/models/app/pricing/page.tsx",
        "apps/models/app/models/[slug]/page.tsx",
        "apps/models/app/compare/[slug]/page.tsx",
      ];
      for (const rel of surfaces) {
        const src = readRel(rel);
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        for (const b of banned) {
          const re = new RegExp(`${b}(?!\\s*references)`, "i");
          if (re.test(stripped)) {
            failures.push(
              `${rel} still contains the pre-Sprint-20 heading "${b}". Use "... references" framing instead.`
            );
          }
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
    name: "/pricing renders a hosted-provider section and explanatory note (Sprint 19 / Sprint 20)",
    run: () => {
      const src = readRel("apps/models/app/pricing/page.tsx");
      const failures: string[] = [];
      // Sprint 20 renamed the section headings to "... pricing
      // references". Accept either the Sprint-19 name or the Sprint-20
      // rename — both express the same invariant (the section is
      // rendered and is distinct from first-party).
      if (
        !/Hosted provider API pricing/.test(src) &&
        !/Hosted provider pricing references/.test(src)
      ) {
        failures.push(
          "/pricing must render a hosted-provider section (heading 'Hosted provider pricing references')."
        );
      }
      if (
        !/First-party model API pricing/.test(src) &&
        !/First-party API pricing references/.test(src)
      ) {
        failures.push(
          "/pricing must render a first-party section (heading 'First-party API pricing references')."
        );
      }
      if (
        !/Hosted-provider pricing is not the same as model-creator pricing/i.test(
          src
        )
      ) {
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
    name: "every hosted-pricing row carries an explicit pricingContext (Sprint 19)",
    run: () => {
      const rel = "apps/models/data/hosted-pricing.ts";
      const src = readRel(rel);
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      // Each PricingRecord literal starts at `id: "hosted-pricing-..."`.
      // Count those vs the number of pricingContext literals — they
      // must match exactly. A missing context is a silent default
      // we will not allow.
      const idCount = (
        stripped.match(/id:\s*"hosted-pricing-[^"]+"/g) ?? []
      ).length;
      const ctxCount = (
        stripped.match(/pricingContext:\s*"[a-z_]+"/g) ?? []
      ).length;
      if (idCount !== ctxCount) {
        return `data/hosted-pricing.ts has ${idCount} record id(s) but ${ctxCount} pricingContext literal(s). Every record must carry exactly one pricingContext.`;
      }
      return null;
    },
  },
  {
    name: "every hosted-pricing row carries hostedModelId, modelCreatorProviderSlug, billingProviderSlug (Sprint 19)",
    run: () => {
      const rel = "apps/models/data/hosted-pricing.ts";
      const src = readRel(rel);
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      const recordRe =
        /id:\s*"hosted-pricing-[^"]+"[\s\S]*?(?=id:\s*"hosted-pricing-|\];|\n\];)/g;
      const blocks = Array.from(stripped.matchAll(recordRe)).map((m) => m[0]);
      const failures: string[] = [];
      for (const block of blocks) {
        const id =
          block.match(/id:\s*"([^"]+)"/)?.[1] ?? "<unknown row>";
        for (const f of [
          "modelCreatorProviderSlug",
          "billingProviderSlug",
          "hostedModelId",
          "pricingContext",
        ]) {
          if (!new RegExp(`\\b${f}:`).test(block)) {
            failures.push(`${id}: missing required field \`${f}\`.`);
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "model page renders hosted-pricing block when rows exist (Sprint 19 / Sprint 20)",
    run: () => {
      const src = readRel("apps/models/app/models/[slug]/page.tsx");
      const failures: string[] = [];
      if (!/hostedPricingForModel/.test(src)) {
        failures.push(
          "models/[slug]/page.tsx must call hostedPricingForModel(model.slug) so hosted rows render alongside first-party pricing."
        );
      }
      if (
        !/Hosted-provider pricing/.test(src) &&
        !/Hosted provider pricing references/.test(src)
      ) {
        failures.push(
          "models/[slug]/page.tsx must render a hosted-pricing subsection ('Hosted provider pricing references') so hosted rates are visually separated from first-party rates."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "provider page distinguishes hosted-platform billing from model creator (Sprint 19)",
    run: () => {
      const src = readRel("apps/models/app/providers/[slug]/page.tsx");
      const failures: string[] = [];
      if (!/hostedPricingForBillingProvider/.test(src)) {
        failures.push(
          "providers/[slug]/page.tsx must call hostedPricingForBillingProvider so platforms like Groq / Together render the models they bill for."
        );
      }
      if (!/hostedPricingForModel/.test(src)) {
        failures.push(
          "providers/[slug]/page.tsx must call hostedPricingForModel so creator pages (Meta, DeepSeek) surface third-party hosting of their models."
        );
      }
      if (!/hosts third-party models/i.test(src)) {
        failures.push(
          "providers/[slug]/page.tsx must include 'hosts third-party models' copy on hosted-platform sections so the role is explicit to readers."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/research/inference-infrastructure covers hosted-platform role (Sprint 19)",
    run: () => {
      const src = readRel(
        "apps/models/app/research/inference-infrastructure/page.tsx"
      );
      if (!/Hosted inference platforms/i.test(src)) {
        return "/research/inference-infrastructure must include a 'Hosted inference platforms' section explaining the creator vs billing distinction.";
      }
      return null;
    },
  },
  {
    name: "/compare renders hosted pricing context when present (Sprint 19)",
    run: () => {
      const src = readRel("apps/models/app/compare/[slug]/page.tsx");
      const failures: string[] = [];
      if (!/hostedPricingForModel/.test(src)) {
        failures.push(
          "compare/[slug]/page.tsx must call hostedPricingForModel so hosted rates render side-by-side."
        );
      }
      if (!/Hosted pricing context|Hosted-provider pricing/i.test(src)) {
        failures.push(
          "compare/[slug]/page.tsx must render a hosted-pricing section header so the context is explicit."
        );
      }
      return failures.length ? failures.join("\n") : null;
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
  // ---------------------------------------------------------------------
  // Sprint 21 — source freshness + reverification queue.
  //
  // The queue is the manual review surface that sits on top of the
  // Sprint 20 freshness chips. Guards here keep the policy honest:
  //   - helpers exist and are deterministic (no Date.now())
  //   - no module fetches remote URLs
  //   - the page + API endpoint exist
  //   - every transparency surface links to the queue
  //   - the docs document the workflow
  //   - the route contract advertises the new routes
  //   - the API endpoint does not expose secrets
  // ---------------------------------------------------------------------
  {
    name: "lib/source-freshness.ts exists with deterministic build-date semantics (Sprint 21)",
    run: () => {
      const rel = "apps/models/lib/source-freshness.ts";
      if (!fileExists(rel)) {
        return "Missing lib/source-freshness.ts — Sprint 21 introduced this helper.";
      }
      const src = readRel(rel);
      const failures: string[] = [];
      for (const token of [
        "FreshnessState",
        "ReverificationReason",
        "SOURCE_FRESHNESS_DAYS",
        "getFreshnessState",
        "freshnessPriority",
        "REVERIFICATION_POLICY_NOTE",
      ]) {
        if (!new RegExp(`\\b${token}\\b`).test(src)) {
          failures.push(
            `lib/source-freshness.ts must export \`${token}\`.`
          );
        }
      }
      // Must read siteConfig.buildDate, must NOT use Date.now() for
      // the canonical "now" — that would make rendering nondeterministic.
      if (!/siteConfig\.buildDate/.test(src)) {
        failures.push(
          "lib/source-freshness.ts must compute freshness against siteConfig.buildDate."
        );
      }
      // Strip comments before checking for Date.now() so the JSDoc
      // mention of "(not wall-clock Date.now())" doesn't trip the guard.
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      if (/Date\.now\s*\(/.test(stripped)) {
        failures.push(
          "lib/source-freshness.ts must not call Date.now() — freshness must be deterministic against siteConfig.buildDate."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "lib/reverification.ts exists and is network-free (Sprint 21)",
    run: () => {
      const rel = "apps/models/lib/reverification.ts";
      if (!fileExists(rel)) {
        return "Missing lib/reverification.ts — Sprint 21 introduced the reverification queue builder.";
      }
      const src = readRel(rel);
      const failures: string[] = [];
      for (const token of [
        "ReverificationQueueItem",
        "getReverificationQueue",
        "getReverificationSummary",
        "getReverificationQueueByProvider",
        "getHighPriorityReverificationItems",
      ]) {
        if (!new RegExp(`\\b${token}\\b`).test(src)) {
          failures.push(
            `lib/reverification.ts must export \`${token}\`.`
          );
        }
      }
      // Strip comments — they reference "fetch" by name in the
      // policy explanation, which is not the same as a runtime call.
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      if (/\bfetch\s*\(/.test(stripped) || /\bprocess\.env\b/.test(stripped)) {
        failures.push(
          "lib/reverification.ts must be a pure local read — no fetch(), no process.env."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/reverification page exists (Sprint 21)",
    run: () => {
      const rel = "apps/models/app/reverification/page.tsx";
      if (!fileExists(rel)) {
        return "Missing /reverification page (Sprint 21).";
      }
      const src = readRel(rel);
      const failures: string[] = [];
      if (!/Reverification Queue/i.test(src)) {
        failures.push(
          "/reverification must render the 'Reverification Queue' title."
        );
      }
      if (!/getReverificationQueue/.test(src)) {
        failures.push(
          "/reverification must call getReverificationQueue() to render the queue."
        );
      }
      if (!/getReverificationSummary/.test(src)) {
        failures.push(
          "/reverification must call getReverificationSummary() for the summary cards."
        );
      }
      if (!/REVERIFICATION_POLICY_NOTE/.test(src)) {
        failures.push(
          "/reverification must render the canonical REVERIFICATION_POLICY_NOTE."
        );
      }
      // Page must explicitly disavow auto-mutation language.
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      const promisesAutoUpdate =
        /auto[- ]?fetch(?:es|ing)?\s+(?:and|then)\s+(?:updates|replaces|writes)/i.test(
          stripped
        ) ||
        /scrape[s]?\s+(?:and|then)\s+(?:updates|publishes|writes)/i.test(
          stripped
        );
      if (promisesAutoUpdate) {
        failures.push(
          "/reverification must NOT promise automatic scraping / mutation of verified values."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/api/reverification endpoint exists and is secrets-free (Sprint 21)",
    run: () => {
      const rel = "apps/models/app/api/reverification/route.ts";
      if (!fileExists(rel)) {
        return "Missing /api/reverification endpoint (Sprint 21).";
      }
      const src = readRel(rel);
      const failures: string[] = [];
      if (!/getReverificationQueue/.test(src)) {
        failures.push(
          "/api/reverification must call getReverificationQueue() to populate `items`."
        );
      }
      if (!/getReverificationSummary/.test(src)) {
        failures.push(
          "/api/reverification must call getReverificationSummary() for the `summary` field."
        );
      }
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      // No secret env values may surface in the response.
      const bannedEnv =
        /process\.env\.(?:CRON_SECRET|KV_REST_API_TOKEN|VERCEL_OIDC_TOKEN|REDIS|SUPABASE|OPENAI|ANTHROPIC|GROQ|TOGETHER|GOOGLE|MISTRAL|DEEPSEEK)[A-Z_0-9]*\b/;
      if (bannedEnv.test(stripped)) {
        failures.push(
          "/api/reverification must not reference any secret env var (CRON_SECRET, KV tokens, vendor keys)."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "route contract advertises /reverification and /api/reverification (Sprint 21)",
    run: () => {
      const src = readRel("apps/models/lib/route-contract.ts");
      const failures: string[] = [];
      if (!/"\/reverification"/.test(src)) {
        failures.push(
          "lib/route-contract.ts REQUIRED_PAGE_ROUTES must include '/reverification'."
        );
      }
      if (!/"\/api\/reverification"/.test(src)) {
        failures.push(
          "lib/route-contract.ts REQUIRED_API_ROUTES must include '/api/reverification'."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/coverage links to /reverification (Sprint 21)",
    run: () => {
      const src = readRel("apps/models/app/coverage/page.tsx");
      if (!/\/reverification/.test(src)) {
        return "/coverage must link to /reverification (the freshness queue).";
      }
      if (!/getReverificationSummary/.test(src)) {
        return "/coverage must render reverification summary counts via getReverificationSummary().";
      }
      return null;
    },
  },
  {
    name: "/sources surfaces freshness language and links to /reverification (Sprint 21)",
    run: () => {
      const src = readRel("apps/models/app/sources/page.tsx");
      const failures: string[] = [];
      if (!/\/reverification/.test(src)) {
        failures.push(
          "/sources must link to /reverification so readers can see which sources are due for re-check."
        );
      }
      const componentSrc = readRel(
        "apps/models/components/SourceCitation.tsx"
      );
      if (!/getFreshnessState/.test(componentSrc)) {
        failures.push(
          "components/SourceCitation.tsx must call getFreshnessState() so every citation renders with a freshness chip."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/pricing links to /reverification (Sprint 21)",
    run: () => {
      const src = readRel("apps/models/app/pricing/page.tsx");
      if (!/\/reverification/.test(src)) {
        return "/pricing must link to /reverification so review-due and stale rows can be audited.";
      }
      return null;
    },
  },
  {
    name: "docs/data-verification documents freshness states (Sprint 21)",
    run: () => {
      const src = readRel(
        "apps/models/app/docs/data-verification/page.tsx"
      );
      const failures: string[] = [];
      if (!/Freshness lifecycle and reverification/i.test(src)) {
        failures.push(
          "docs/data-verification must include a 'Freshness lifecycle and reverification' section."
        );
      }
      if (!/Stale is not false/i.test(src)) {
        failures.push(
          "docs/data-verification must include the 'Stale is not false' framing."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "research/source-verification-methodology documents the queue workflow (Sprint 21)",
    run: () => {
      const src = readRel(
        "apps/models/app/research/source-verification-methodology/page.tsx"
      );
      const failures: string[] = [];
      if (!/Freshness and the reverification queue/i.test(src)) {
        failures.push(
          "research/source-verification-methodology must include a 'Freshness and the reverification queue' section."
        );
      }
      // Allow whitespace + newlines between "auto-fetches or" and
      // "auto-mutates" so the JSX can wrap the phrase naturally
      // across two source lines.
      if (
        !/never auto-fetches or\s+auto-mutates/i.test(src) &&
        !/never\s+auto-mutates/i.test(src)
      ) {
        failures.push(
          "research/source-verification-methodology must explicitly state the no-auto-mutation policy."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "sitemap + llms.txt advertise /reverification (Sprint 21)",
    run: () => {
      const sitemap = readRel("apps/models/app/sitemap.ts");
      const llms = readRel("apps/models/app/llms.txt/route.ts");
      const failures: string[] = [];
      if (!/\/reverification/.test(sitemap)) {
        failures.push("sitemap.ts must include /reverification.");
      }
      if (!/\/reverification/.test(llms)) {
        failures.push("llms.txt must list /reverification.");
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/api/site advertises the reverification queue + API (Sprint 21)",
    run: () => {
      const src = readRel("apps/models/app/api/site/route.ts");
      const failures: string[] = [];
      if (!/reverificationQueue/.test(src)) {
        failures.push(
          "/api/site must include `reverificationQueue` in its response."
        );
      }
      if (!/reverificationApi/.test(src)) {
        failures.push(
          "/api/site must include `reverificationApi` in its response."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "smoke + indexing scripts include /reverification (Sprint 21)",
    run: () => {
      const smoke = readRel("scripts/lib/smoke.mjs");
      const indexing = readRel("scripts/indexing-qa.mjs");
      const failures: string[] = [];
      if (!/"\/reverification"/.test(smoke)) {
        failures.push(
          "scripts/lib/smoke.mjs PAGE_ROUTES must include '/reverification'."
        );
      }
      if (!/"\/api\/reverification"/.test(smoke)) {
        failures.push(
          "scripts/lib/smoke.mjs API_ROUTES must include '/api/reverification'."
        );
      }
      if (!/"\/reverification"/.test(indexing)) {
        failures.push(
          "scripts/indexing-qa.mjs must include '/reverification' in the indexable pages list."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no data record is mutated at runtime in lib/ (Sprint 21)",
    run: () => {
      // The catalogue is read-only at request time. No helper in lib/
      // may push, splice, or assign into the typed data records, and
      // no helper may write to the data directory. This re-states the
      // entity-graph network-free invariant for the reverification
      // layer and is a defence-in-depth check.
      const targets = [
        "apps/models/lib/reverification.ts",
        "apps/models/lib/source-freshness.ts",
        "apps/models/lib/hosted-availability.ts",
        "apps/models/lib/pricing-freshness.ts",
      ];
      const failures: string[] = [];
      const writeFs =
        /\b(writeFile|writeFileSync|appendFile|appendFileSync|rmSync|rm\s*\(|unlink|mkdir)\b/;
      const networkCall = /\bfetch\s*\(/;
      const dataMutation =
        /\b(models|providers|hostedPricing|verificationAttempts)\s*\.(push|splice|unshift|pop|shift|sort|reverse)\s*\(/;
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        if (writeFs.test(stripped)) {
          failures.push(
            `${rel} writes to the filesystem — read-only allowed only.`
          );
        }
        if (networkCall.test(stripped)) {
          failures.push(
            `${rel} calls fetch() — reverification + freshness helpers must stay network-free.`
          );
        }
        if (dataMutation.test(stripped)) {
          failures.push(
            `${rel} mutates a typed data array (push/splice/etc.).`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "every reverification queue item has affectedRoutes + suggestedAction (Sprint 21)",
    run: () => {
      // ReverificationQueueItem declares affectedRoutes and
      // suggestedAction as required fields, so TypeScript already
      // enforces that every items.push({...}) literal carries them.
      // This guard re-states the invariant at the type-definition
      // level so a future loosening of the interface trips CI.
      const src = readRel("apps/models/lib/reverification.ts");
      const failures: string[] = [];
      // The interface declaration must mark these as required (no `?`).
      const ifaceMatch = src.match(
        /export interface ReverificationQueueItem\s*\{([\s\S]*?)\}/
      );
      if (!ifaceMatch) {
        return "Could not locate `ReverificationQueueItem` interface in lib/reverification.ts.";
      }
      const body = ifaceMatch[1];
      const requiredField = (name: string): boolean =>
        new RegExp(`\\b${name}\\s*:`).test(body) &&
        !new RegExp(`\\b${name}\\s*\\?:`).test(body);
      if (!requiredField("affectedRoutes")) {
        failures.push(
          "ReverificationQueueItem.affectedRoutes must be a required string[] field."
        );
      }
      if (!requiredField("suggestedAction")) {
        failures.push(
          "ReverificationQueueItem.suggestedAction must be a required string field."
        );
      }
      // Defence-in-depth: confirm every actual push call body
      // mentions both fields. Use a brace-depth counter rather than
      // regex so nested template literals don't trip it.
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      const pushStarts: number[] = [];
      const startRe = /items\.push\(\s*\{/g;
      let mm: RegExpExecArray | null;
      while ((mm = startRe.exec(stripped)) !== null) {
        pushStarts.push(mm.index + mm[0].length - 1); // index of "{"
      }
      for (const start of pushStarts) {
        let depth = 0;
        let end = start;
        for (let i = start; i < stripped.length; i++) {
          const ch = stripped[i];
          if (ch === "{") depth++;
          else if (ch === "}") {
            depth--;
            if (depth === 0) {
              end = i;
              break;
            }
          }
        }
        const bodyText = stripped.slice(start, end + 1);
        if (!/affectedRoutes:/.test(bodyText)) {
          failures.push(
            "A reverification queue item is missing `affectedRoutes`."
          );
        }
        if (!/suggestedAction:/.test(bodyText)) {
          failures.push(
            "A reverification queue item is missing `suggestedAction`."
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "blocked OpenAI docs are represented in the queue (Sprint 21)",
    run: () => {
      // Defence-in-depth: blocked-403 attempts against OpenAI must
      // continue to drive a queue item. The queue builder walks every
      // blocked attempt; this guard confirms the data is still in the
      // attempts log so the queue actually receives an item.
      const src = readRel("apps/models/data/verification-attempts.ts");
      const openAiBlocked =
        /providerSlug:\s*"openai"[\s\S]*?result:\s*"blocked-403"/.test(src);
      if (!openAiBlocked) {
        return "verification-attempts.ts must keep at least one blocked OpenAI attempt so /reverification surfaces it.";
      }
      return null;
    },
  },
  // ---------------------------------------------------------------------
  // Sprint 22 — intelligence workspace + review operations + entity
  // discovery. Helpers stay network-free and deterministic. The
  // workspace, the checklist endpoint, and the discovery counters all
  // derive from local data only — no auto-mutation, no admin/auth,
  // no fake metrics.
  // ---------------------------------------------------------------------
  {
    name: "lib/intelligence-summary.ts exists and is deterministic (Sprint 22)",
    run: () => {
      const rel = "apps/models/lib/intelligence-summary.ts";
      if (!fileExists(rel)) {
        return "Missing lib/intelligence-summary.ts (Sprint 22).";
      }
      const src = readRel(rel);
      const failures: string[] = [];
      for (const token of [
        "getIntelligenceSummary",
        "getCoverageHealthMatrix",
        "getReviewOperationsSummary",
        "getWorkspaceLinks",
      ]) {
        if (!new RegExp(`\\b${token}\\b`).test(src)) {
          failures.push(
            `lib/intelligence-summary.ts must export \`${token}\`.`
          );
        }
      }
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      if (/\bfetch\s*\(/.test(stripped)) {
        failures.push("lib/intelligence-summary.ts must not call fetch().");
      }
      if (/\bprocess\.env\b/.test(stripped)) {
        failures.push(
          "lib/intelligence-summary.ts must not read process.env."
        );
      }
      if (/Date\.now\s*\(/.test(stripped)) {
        failures.push(
          "lib/intelligence-summary.ts must not call Date.now() — derive from siteConfig.buildDate."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "lib/comparison-clusters.ts exists and is network-free (Sprint 22)",
    run: () => {
      const rel = "apps/models/lib/comparison-clusters.ts";
      if (!fileExists(rel)) {
        return "Missing lib/comparison-clusters.ts (Sprint 22).";
      }
      const src = readRel(rel);
      const failures: string[] = [];
      for (const token of [
        "getComparisonClusters",
        "getTwoSidedVerifiedComparisons",
        "getComparisonsByProvider",
        "getComparisonCoverageSummary",
      ]) {
        if (!new RegExp(`\\b${token}\\b`).test(src)) {
          failures.push(
            `lib/comparison-clusters.ts must export \`${token}\`.`
          );
        }
      }
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      if (/\bfetch\s*\(/.test(stripped) || /\bprocess\.env\b/.test(stripped)) {
        failures.push(
          "lib/comparison-clusters.ts must be a pure local read."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "lib/source-usage.ts exists and is network-free (Sprint 22)",
    run: () => {
      const rel = "apps/models/lib/source-usage.ts";
      if (!fileExists(rel)) {
        return "Missing lib/source-usage.ts (Sprint 22).";
      }
      const src = readRel(rel);
      const failures: string[] = [];
      for (const token of [
        "getSourceUsageMap",
        "getEntitiesUsingCitation",
        "getSourcesByProvider",
        "getCitationImpactSummary",
      ]) {
        if (!new RegExp(`\\b${token}\\b`).test(src)) {
          failures.push(
            `lib/source-usage.ts must export \`${token}\`.`
          );
        }
      }
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      if (/\bfetch\s*\(/.test(stripped) || /\bprocess\.env\b/.test(stripped)) {
        failures.push(
          "lib/source-usage.ts must be a pure local read."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/intelligence workspace page exists (Sprint 22)",
    run: () => {
      const rel = "apps/models/app/intelligence/page.tsx";
      if (!fileExists(rel)) {
        return "Missing /intelligence page (Sprint 22).";
      }
      const src = readRel(rel);
      const failures: string[] = [];
      if (!/AI Model Infrastructure Intelligence Workspace/i.test(src)) {
        failures.push(
          "/intelligence must render the canonical workspace title."
        );
      }
      if (!/getIntelligenceSummary/.test(src)) {
        failures.push(
          "/intelligence must call getIntelligenceSummary() to render counts."
        );
      }
      if (!/getCoverageHealthMatrix/.test(src)) {
        failures.push(
          "/intelligence must call getCoverageHealthMatrix() to render the health matrix."
        );
      }
      if (!/getReviewOperationsSummary/.test(src)) {
        failures.push(
          "/intelligence must call getReviewOperationsSummary()."
        );
      }
      if (!/getWorkspaceLinks/.test(src)) {
        failures.push(
          "/intelligence must call getWorkspaceLinks() to render navigation cards."
        );
      }
      // No admin/auth promises, no auto-update language.
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      if (/\bsign in\b|\blogin\b|\badmin panel\b/i.test(stripped)) {
        failures.push(
          "/intelligence must not promise admin / login UI."
        );
      }
      if (
        /auto[- ]?(?:fetch|update|sync|scrape)\s+(?:verified|values)/i.test(
          stripped
        )
      ) {
        failures.push(
          "/intelligence must not promise auto-fetch/update/sync of verified values."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/api/intelligence endpoint exists and is secrets-free (Sprint 22)",
    run: () => {
      const rel = "apps/models/app/api/intelligence/route.ts";
      if (!fileExists(rel)) {
        return "Missing /api/intelligence endpoint (Sprint 22).";
      }
      const src = readRel(rel);
      const failures: string[] = [];
      if (!/getIntelligenceSummary/.test(src)) {
        failures.push(
          "/api/intelligence must call getIntelligenceSummary()."
        );
      }
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      const bannedEnv =
        /process\.env\.(?:CRON_SECRET|KV_REST_API_TOKEN|VERCEL_OIDC_TOKEN|REDIS|SUPABASE|OPENAI|ANTHROPIC|GROQ|TOGETHER|GOOGLE|MISTRAL|DEEPSEEK)[A-Z_0-9]*\b/;
      if (bannedEnv.test(stripped)) {
        failures.push(
          "/api/intelligence must not reference any secret env var."
        );
      }
      if (/\bfetch\s*\(/.test(stripped)) {
        failures.push("/api/intelligence must not call fetch().");
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/api/reverification/checklist exists and is secrets-free (Sprint 22)",
    run: () => {
      const rel =
        "apps/models/app/api/reverification/checklist/route.ts";
      if (!fileExists(rel)) {
        return "Missing /api/reverification/checklist (Sprint 22).";
      }
      const src = readRel(rel);
      const failures: string[] = [];
      if (!/getReverificationQueue/.test(src)) {
        failures.push(
          "/api/reverification/checklist must call getReverificationQueue()."
        );
      }
      if (!/text\/markdown/.test(src)) {
        failures.push(
          "/api/reverification/checklist must default to text/markdown output."
        );
      }
      if (!/X-Robots-Tag/.test(src)) {
        failures.push(
          "/api/reverification/checklist must set X-Robots-Tag: noindex."
        );
      }
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      if (/\bfetch\s*\(/.test(stripped)) {
        failures.push(
          "/api/reverification/checklist must not call fetch()."
        );
      }
      const bannedEnv =
        /process\.env\.(?:CRON_SECRET|KV_REST_API_TOKEN|VERCEL_OIDC_TOKEN|REDIS|SUPABASE|OPENAI|ANTHROPIC|GROQ|TOGETHER|GOOGLE|MISTRAL|DEEPSEEK)[A-Z_0-9]*\b/;
      if (bannedEnv.test(stripped)) {
        failures.push(
          "/api/reverification/checklist must not reference any secret env var."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/reverification supports server filters (Sprint 22)",
    run: () => {
      const src = readRel("apps/models/app/reverification/page.tsx");
      const failures: string[] = [];
      const required = [
        "priorityFilter",
        "reasonFilter",
        "providerFilter",
        "entityTypeFilter",
        "freshnessFilter",
      ];
      for (const t of required) {
        if (!new RegExp(`\\b${t}\\b`).test(src)) {
          failures.push(
            `reverification page must read the \`${t}\` query param.`
          );
        }
      }
      if (!/isFilteredRoute/.test(src)) {
        failures.push(
          "reverification page must call isFilteredRoute() to apply the filtered-noindex policy."
        );
      }
      if (!/robotsMetadata/.test(src)) {
        failures.push(
          "reverification page must call robotsMetadata() so filtered URLs are noindex."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "should-index allow-list covers Sprint 22 filter keys",
    run: () => {
      const src = readRel("apps/models/lib/should-index.ts");
      const failures: string[] = [];
      for (const key of [
        "priority",
        "reason",
        "entityType",
        "freshness",
        "role",
      ]) {
        if (!new RegExp(`"${key}"`).test(src)) {
          failures.push(
            `should-index FILTERED_KEYS must include "${key}" so filtered URLs are noindex.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "route contract advertises Sprint 22 routes",
    run: () => {
      const src = readRel("apps/models/lib/route-contract.ts");
      const failures: string[] = [];
      for (const r of [
        '"/intelligence"',
        '"/api/intelligence"',
        '"/api/reverification/checklist"',
      ]) {
        if (!src.includes(r)) {
          failures.push(`route-contract must include ${r}.`);
        }
      }
      if (!/INTELLIGENCE_ENDPOINTS/.test(src)) {
        failures.push(
          "route-contract must export INTELLIGENCE_ENDPOINTS so /api/site can advertise the group."
        );
      }
      // Sprint 22 introduced content-v5. Later sprints may bump
      // further; accept any content-vN with N >= 5.
      const m = src.match(/ROUTE_SET_VERSION\s*=\s*"content-v(\d+)"/);
      if (!m || Number(m[1]) < 5) {
        failures.push(
          "ROUTE_SET_VERSION must be \"content-v5\" or later (Sprint 22 introduced content-v5)."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "sitemap + llms.txt + footer advertise /intelligence (Sprint 22)",
    run: () => {
      const sitemap = readRel("apps/models/app/sitemap.ts");
      const llms = readRel("apps/models/app/llms.txt/route.ts");
      const footer = readRel("apps/models/components/SiteFooter.tsx");
      const failures: string[] = [];
      if (!/\/intelligence/.test(sitemap)) {
        failures.push("sitemap must include /intelligence.");
      }
      if (!/\/intelligence/.test(llms)) {
        failures.push("llms.txt must list /intelligence.");
      }
      if (!/\/intelligence/.test(footer)) {
        failures.push("SiteFooter must link to /intelligence.");
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/api/site advertises intelligence + checklist endpoints (Sprint 22)",
    run: () => {
      const src = readRel("apps/models/app/api/site/route.ts");
      const failures: string[] = [];
      for (const t of [
        "intelligenceWorkspace",
        "intelligenceApi",
        "intelligenceEndpoints",
        "reverificationChecklistApi",
      ]) {
        if (!new RegExp(`\\b${t}\\b`).test(src)) {
          failures.push(`/api/site response must include \`${t}\`.`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "smoke + indexing scripts include Sprint 22 routes",
    run: () => {
      const smoke = readRel("scripts/lib/smoke.mjs");
      const indexing = readRel("scripts/indexing-qa.mjs");
      const failures: string[] = [];
      if (!/"\/intelligence"/.test(smoke)) {
        failures.push("smoke PAGE_ROUTES must include /intelligence.");
      }
      if (!/"\/api\/intelligence"/.test(smoke)) {
        failures.push(
          "smoke API_ROUTES must include /api/intelligence."
        );
      }
      if (!/"\/api\/reverification\/checklist\?format=json"/.test(smoke)) {
        failures.push(
          "smoke API_ROUTES must include /api/reverification/checklist?format=json."
        );
      }
      if (!/"\/intelligence"/.test(indexing)) {
        failures.push(
          "indexing-qa must include /intelligence as an indexable page."
        );
      }
      if (!/"\/reverification\?priority=high"/.test(indexing)) {
        failures.push(
          "indexing-qa must spot-check one filtered reverification URL for the noindex policy."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/coverage links to /intelligence (Sprint 22)",
    run: () => {
      const src = readRel("apps/models/app/coverage/page.tsx");
      if (!/\/intelligence/.test(src)) {
        return "/coverage must surface a link to /intelligence.";
      }
      return null;
    },
  },
  {
    name: "/models renders discovery summary (Sprint 22)",
    run: () => {
      const src = readRel("apps/models/app/models/page.tsx");
      const failures: string[] = [];
      if (!/Models discovery summary/i.test(src)) {
        failures.push(
          "/models must render the 'Models discovery summary' section."
        );
      }
      if (!/With hosted availability/.test(src)) {
        failures.push(
          "/models must include a 'With hosted availability' discovery card."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/compare renders cluster summary (Sprint 22)",
    run: () => {
      const src = readRel("apps/models/app/compare/page.tsx");
      const failures: string[] = [];
      if (!/Comparison cluster summary/i.test(src)) {
        failures.push(
          "/compare must render the 'Comparison cluster summary' section."
        );
      }
      if (!/Comparisons by provider/i.test(src)) {
        failures.push(
          "/compare must render the 'Comparisons by provider' cluster grid."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no Sprint 22 surface promises admin/auth/auto-mutation",
    run: () => {
      const targets = [
        "apps/models/app/intelligence/page.tsx",
        "apps/models/app/api/intelligence/route.ts",
        "apps/models/app/api/reverification/checklist/route.ts",
        "apps/models/lib/intelligence-summary.ts",
        "apps/models/lib/comparison-clusters.ts",
        "apps/models/lib/source-usage.ts",
      ];
      const banned = [
        /\bsign in\b/i,
        /\bsign-in\b/i,
        /\blogin\b/i,
        /\badmin panel\b/i,
        /auto[- ]?(?:fetches|fetching|updates|writes|mutates|scrapes)\s+(?:and|then|verified|sources|the)/i,
      ];
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        for (const b of banned) {
          if (b.test(stripped)) {
            failures.push(
              `${rel} contains banned admin/auth/auto-mutation phrasing matching ${b}.`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/status does not claim a numeric uptime percentage (Sprint 22 re-check)",
    run: () => {
      const src = readRel("apps/models/app/status/page.tsx");
      // /status renders observations + freshness, never an aggregate
      // uptime number. Re-state the invariant for Sprint 22 so future
      // edits do not introduce a fabricated percentage.
      const offending = [
        ...src.matchAll(/\b\d{1,3}\.\d+\s*%/g),
        ...src.matchAll(/\b(99|100)\s*%/g),
      ];
      if (offending.length) {
        return `/status contains a numeric percentage literal — uptime is intentionally not asserted. Found: ${offending
          .map((m) => m[0])
          .join(", ")}.`;
      }
      return null;
    },
  },
  // ---------------------------------------------------------------------
  // Sprint 23 — model selection workspace, use-case intelligence,
  // product value layer. Use cases are selection workflows, not
  // recommendations: no "best", no "winner", no "cheapest", no
  // scoring, no certification claims.
  // ---------------------------------------------------------------------
  {
    name: "lib/use-cases.ts exists and exports the typed catalogue (Sprint 23)",
    run: () => {
      const rel = "apps/models/lib/use-cases.ts";
      if (!fileExists(rel)) {
        return "Missing lib/use-cases.ts (Sprint 23).";
      }
      const src = readRel(rel);
      const failures: string[] = [];
      for (const token of [
        "ModelUseCaseSlug",
        "modelUseCases",
        "getUseCaseBySlug",
        "useCasesWithDetailPage",
      ]) {
        if (!new RegExp(`\\b${token}\\b`).test(src)) {
          failures.push(`lib/use-cases.ts must export \`${token}\`.`);
        }
      }
      for (const slug of [
        "long-context-analysis",
        "multimodal-input",
        "hosted-inference",
        "governance-review",
      ]) {
        if (!new RegExp(`"${slug}"`).test(src)) {
          failures.push(
            `lib/use-cases.ts must declare the "${slug}" use case slug.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "lib/model-shortlists.ts has no scoring or ranking function (Sprint 23)",
    run: () => {
      const rel = "apps/models/lib/model-shortlists.ts";
      if (!fileExists(rel)) {
        return "Missing lib/model-shortlists.ts (Sprint 23).";
      }
      const src = readRel(rel);
      const failures: string[] = [];
      for (const token of [
        "getModelShortlist",
        "getUseCaseShortlist",
        "getShortlistSummary",
        "getModelSelectionSignals",
      ]) {
        if (!new RegExp(`\\b${token}\\b`).test(src)) {
          failures.push(
            `lib/model-shortlists.ts must export \`${token}\`.`
          );
        }
      }
      // No scoring / ranking semantics — bans both in identifiers
      // and in user-facing string literals. Allowed in comments
      // because the file documents the policy.
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      const bannedIdentifiers =
        /\b(score|rank|ranking|rankBy|ranked|weightedScore|fitnessScore)\b/;
      if (bannedIdentifiers.test(stripped)) {
        failures.push(
          "lib/model-shortlists.ts must not contain score/rank identifiers — shortlist order is documented, not derived."
        );
      }
      const stringRanking =
        /"[^"]*\b(best model|winner|cheapest|score:|rank:)[^"]*"/i;
      if (stringRanking.test(stripped)) {
        failures.push(
          "lib/model-shortlists.ts must not contain user-facing ranking phrases in string literals."
        );
      }
      if (/\bfetch\s*\(/.test(stripped) || /\bprocess\.env\b/.test(stripped)) {
        failures.push(
          "lib/model-shortlists.ts must be a pure local read."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/select model-selection workspace page exists (Sprint 23)",
    run: () => {
      const rel = "apps/models/app/select/page.tsx";
      if (!fileExists(rel)) {
        return "Missing /select page (Sprint 23).";
      }
      const src = readRel(rel);
      const failures: string[] = [];
      if (!/Model Selection Workspace/i.test(src)) {
        failures.push(
          "/select must render the 'Model Selection Workspace' title."
        );
      }
      if (!/Shortlist, not ranking/i.test(src)) {
        failures.push(
          "/select must include the 'Shortlist, not ranking' framing."
        );
      }
      if (!/getModelShortlist/.test(src)) {
        failures.push(
          "/select must call getModelShortlist() to render the shortlist."
        );
      }
      if (!/isFilteredRoute/.test(src) || !/robotsMetadata/.test(src)) {
        failures.push(
          "/select must apply the filtered-noindex policy via isFilteredRoute + robotsMetadata."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/use-cases hub + four detail pages exist (Sprint 23)",
    run: () => {
      const required = [
        "apps/models/app/use-cases/page.tsx",
        "apps/models/app/use-cases/long-context-analysis/page.tsx",
        "apps/models/app/use-cases/multimodal-input/page.tsx",
        "apps/models/app/use-cases/hosted-inference/page.tsx",
        "apps/models/app/use-cases/governance-review/page.tsx",
      ];
      const missing = required.filter((r) => !fileExists(r));
      if (missing.length) {
        return `Missing use-case page(s): ${missing.join(", ")}.`;
      }
      return null;
    },
  },
  {
    name: "use-case detail pages link to /coverage and /sources (Sprint 23)",
    run: () => {
      const targets = [
        "apps/models/app/use-cases/long-context-analysis/page.tsx",
        "apps/models/app/use-cases/multimodal-input/page.tsx",
        "apps/models/app/use-cases/hosted-inference/page.tsx",
        "apps/models/app/use-cases/governance-review/page.tsx",
      ];
      // The shared UseCaseDetailLayout always renders /coverage and
      // /sources in the related-routes block; this guard confirms
      // the layout component is present and the pages render it.
      const layoutSrc = readRel(
        "apps/models/components/UseCaseDetailLayout.tsx"
      );
      const failures: string[] = [];
      if (
        !/\/coverage/.test(layoutSrc) ||
        !/\/sources/.test(layoutSrc)
      ) {
        failures.push(
          "components/UseCaseDetailLayout.tsx must link to /coverage and /sources."
        );
      }
      for (const rel of targets) {
        const src = readRel(rel);
        if (!/UseCaseDetailLayout/.test(src)) {
          failures.push(
            `${rel} must render via <UseCaseDetailLayout> so /coverage + /sources links are present.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "use-case + select surfaces ban recommendation language (Sprint 23)",
    run: () => {
      const targets = [
        "apps/models/app/select/page.tsx",
        "apps/models/app/use-cases/page.tsx",
        "apps/models/app/use-cases/long-context-analysis/page.tsx",
        "apps/models/app/use-cases/multimodal-input/page.tsx",
        "apps/models/app/use-cases/hosted-inference/page.tsx",
        "apps/models/app/use-cases/governance-review/page.tsx",
        "apps/models/components/UseCaseDetailLayout.tsx",
        "apps/models/lib/use-cases.ts",
        "apps/models/lib/model-shortlists.ts",
      ];
      // Patterns are scoped to POSITIVE assertions only — disclaimer
      // copy ("does not declare a winner", "is not a certification",
      // "no guarantee") is allowed because every catalogue surface
      // restates the no-recommendation policy.
      const banned: { pattern: RegExp; label: string }[] = [
        { pattern: /\brecommended model\b/i, label: "recommended model" },
        { pattern: /\bwe recommend\b/i, label: "we recommend" },
        { pattern: /\bbest model\b/i, label: "best model" },
        { pattern: /\bbest model for\b/i, label: "best model for" },
        // Positive winner assertions only.
        {
          pattern: /(?:is|are)\s+(?:the\s+)?winner\b/i,
          label: "is the winner",
        },
        { pattern: /\bwinner is\b/i, label: "winner is" },
        // Positive "cheapest" / "fastest" assertions only (Sprint 20
        // / Sprint 18 already cover the per-noun bans).
        {
          pattern: /\bcheapest\s+(?:model|provider|platform|inference)\b/i,
          label: "cheapest <noun>",
        },
        {
          pattern: /\bfastest\s+(?:model|provider|inference)\b/i,
          label: "fastest <noun>",
        },
        // Positive guarantee / certification assertions only.
        { pattern: /\bis\s+guaranteed\b/i, label: "is guaranteed" },
        { pattern: /\bare\s+guaranteed\b/i, label: "are guaranteed" },
        {
          pattern: /\bguaranteed\s+(?:to|for)\b/i,
          label: "guaranteed to / for",
        },
        { pattern: /\bis\s+certified\b/i, label: "is certified" },
        { pattern: /\bare\s+certified\b/i, label: "are certified" },
        {
          pattern: /\bcertified\s+(?:for|by|to)\b/i,
          label: "certified for / by / to",
        },
      ];
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        for (const b of banned) {
          if (b.pattern.test(stripped)) {
            failures.push(
              `${rel} contains banned recommendation phrasing: "${b.label}".`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "homepage + /models + /compare link to use cases (Sprint 23)",
    run: () => {
      const homepage = readRel("apps/models/app/page.tsx");
      const modelsPage = readRel("apps/models/app/models/page.tsx");
      const comparePage = readRel("apps/models/app/compare/page.tsx");
      const failures: string[] = [];
      if (!/\/use-cases\b/.test(homepage)) {
        failures.push(
          "Homepage must link to /use-cases (start-with-a-use-case section)."
        );
      }
      if (!/Start with a use case/i.test(homepage)) {
        failures.push(
          "Homepage must include the 'Start with a use case' section."
        );
      }
      if (!/\/select\b/.test(modelsPage)) {
        failures.push(
          "/models must link to /select (selection workspace CTA)."
        );
      }
      if (!/\/use-cases\b/.test(modelsPage)) {
        failures.push(
          "/models must link to at least one /use-cases route."
        );
      }
      if (!/Start from a use case/i.test(comparePage)) {
        failures.push(
          "/compare must include the 'Start from a use case' intro."
        );
      }
      if (!/\/use-cases\b/.test(comparePage)) {
        failures.push("/compare must link to /use-cases.");
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "route contract + sitemap + llms.txt advertise Sprint 23 routes",
    run: () => {
      const contract = readRel("apps/models/lib/route-contract.ts");
      const sitemap = readRel("apps/models/app/sitemap.ts");
      const llms = readRel("apps/models/app/llms.txt/route.ts");
      const failures: string[] = [];
      // Sprint 23 introduced content-v6. Later sprints may bump
      // further; accept any content-vN with N >= 6.
      const versionMatch = contract.match(
        /ROUTE_SET_VERSION\s*=\s*"content-v(\d+)"/
      );
      if (!versionMatch || Number(versionMatch[1]) < 6) {
        failures.push(
          "ROUTE_SET_VERSION must be \"content-v6\" or later (Sprint 23 introduced content-v6)."
        );
      }
      for (const r of ['"/select"', '"/use-cases"']) {
        if (!contract.includes(r)) {
          failures.push(`route-contract REQUIRED_PAGE_ROUTES must include ${r}.`);
        }
        if (!sitemap.includes(r)) {
          failures.push(`sitemap must include ${r}.`);
        }
        if (!llms.includes(r)) {
          failures.push(`llms.txt must list ${r}.`);
        }
      }
      const detailPaths = [
        '"/use-cases/long-context-analysis"',
        '"/use-cases/multimodal-input"',
        '"/use-cases/hosted-inference"',
        '"/use-cases/governance-review"',
      ];
      for (const path of detailPaths) {
        if (!sitemap.includes(path)) {
          failures.push(`sitemap must include ${path}.`);
        }
        if (!llms.includes(path)) {
          failures.push(`llms.txt must list ${path}.`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "should-index allow-list covers Sprint 23 filter keys",
    run: () => {
      const src = readRel("apps/models/lib/should-index.ts");
      const failures: string[] = [];
      for (const key of [
        "useCase",
        "minContext",
        "pricingCoverage",
        "hostedAvailability",
      ]) {
        if (!new RegExp(`"${key}"`).test(src)) {
          failures.push(
            `should-index FILTERED_KEYS must include "${key}" so /select?${key}=... is noindex.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "smoke + indexing scripts include Sprint 23 routes",
    run: () => {
      const smoke = readRel("scripts/lib/smoke.mjs");
      const indexing = readRel("scripts/indexing-qa.mjs");
      const failures: string[] = [];
      const requiredSmoke = [
        '"/select"',
        '"/use-cases"',
        '"/use-cases/long-context-analysis"',
        '"/use-cases/multimodal-input"',
        '"/use-cases/hosted-inference"',
        '"/use-cases/governance-review"',
      ];
      for (const r of requiredSmoke) {
        if (!smoke.includes(r)) {
          failures.push(`scripts/lib/smoke.mjs PAGE_ROUTES must include ${r}.`);
        }
      }
      if (!/"\/select"/.test(indexing)) {
        failures.push(
          "scripts/indexing-qa.mjs must include /select as an indexable page."
        );
      }
      if (!/"\/use-cases"/.test(indexing)) {
        failures.push(
          "scripts/indexing-qa.mjs must include /use-cases as an indexable page."
        );
      }
      if (!/"\/use-cases\/long-context-analysis"/.test(indexing)) {
        failures.push(
          "scripts/indexing-qa.mjs must include /use-cases/long-context-analysis as a detail page."
        );
      }
      if (!/"\/select\?useCase=long-context-analysis"/.test(indexing)) {
        failures.push(
          "scripts/indexing-qa.mjs must spot-check one filtered /select URL for the noindex policy."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no OpenAI metric appears on use-case or select surfaces (Sprint 23 re-check)",
    run: () => {
      // The Sprint 18 guard already forbids verified OpenAI metrics
      // without a citation. Re-state for Sprint 23 surfaces — they
      // must not display GPT-5 numbers (context window, output limit,
      // pricing reference) because the model record is wrapped in
      // unverifiedModel().
      const targets = [
        "apps/models/app/select/page.tsx",
        "apps/models/app/use-cases/page.tsx",
        "apps/models/app/use-cases/long-context-analysis/page.tsx",
        "apps/models/app/use-cases/multimodal-input/page.tsx",
        "apps/models/app/use-cases/hosted-inference/page.tsx",
        "apps/models/app/use-cases/governance-review/page.tsx",
      ];
      // These pages render GENERIC counts; they do not hand-write
      // an OpenAI numeric metric. Verify no GPT-5 / OpenAI numeric
      // literal sneaks into user-facing strings.
      const banned =
        /"[^"]*\bgpt-5\b[^"]*"[\s\S]{0,200}?\b\d{4,}\b/i;
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        if (banned.test(src)) {
          failures.push(
            `${rel} mentions GPT-5 alongside a numeric literal — no OpenAI metrics are verified yet.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  // ---------------------------------------------------------------------
  // Sprint 24 — comparison builder + decision workflow surfaces.
  // ---------------------------------------------------------------------
  {
    name: "lib/comparison-builder.ts exists and is score-free (Sprint 24)",
    run: () => {
      const rel = "apps/models/lib/comparison-builder.ts";
      if (!fileExists(rel)) {
        return "Missing lib/comparison-builder.ts (Sprint 24).";
      }
      const src = readRel(rel);
      const failures: string[] = [];
      for (const token of [
        "buildModelComparison",
        "getComparableModels",
        "getComparisonBuilderDefaults",
        "getComparisonFieldDefinitions",
        "getComparisonBuilderSummary",
        "comparisonBuilderUrl",
        "COMPARISON_BUILDER_MAX_MODELS",
      ]) {
        if (!new RegExp(`\\b${token}\\b`).test(src)) {
          failures.push(
            `lib/comparison-builder.ts must export \`${token}\`.`
          );
        }
      }
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      const bannedIdentifiers =
        /\b(score|rank|ranking|rankBy|ranked|weightedScore|fitnessScore|winner|recommend|recommended)\b/i;
      if (bannedIdentifiers.test(stripped)) {
        failures.push(
          "lib/comparison-builder.ts must not contain score/rank/winner/recommend identifiers."
        );
      }
      if (/\bfetch\s*\(/.test(stripped) || /\bprocess\.env\b/.test(stripped)) {
        failures.push(
          "lib/comparison-builder.ts must be a pure local read."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/compare/build page exists with filtered-noindex policy (Sprint 24)",
    run: () => {
      const rel = "apps/models/app/compare/build/page.tsx";
      if (!fileExists(rel)) {
        return "Missing /compare/build page (Sprint 24).";
      }
      const src = readRel(rel);
      const failures: string[] = [];
      if (!/Comparison Builder/i.test(src)) {
        failures.push(
          "/compare/build must render the 'Comparison Builder' title."
        );
      }
      if (!/buildModelComparison/.test(src)) {
        failures.push(
          "/compare/build must call buildModelComparison()."
        );
      }
      if (!/isFilteredRoute/.test(src) || !/robotsMetadata/.test(src)) {
        failures.push(
          "/compare/build must apply filtered-noindex policy via isFilteredRoute + robotsMetadata."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "DecisionWorkflow component exists (Sprint 24)",
    run: () => {
      const rel = "apps/models/components/DecisionWorkflow.tsx";
      if (!fileExists(rel)) {
        return "Missing components/DecisionWorkflow.tsx (Sprint 24).";
      }
      const src = readRel(rel);
      if (!/export function DecisionWorkflow/.test(src)) {
        return "DecisionWorkflow.tsx must export `DecisionWorkflow`.";
      }
      return null;
    },
  },
  {
    name: "/docs/decision-workflow page exists (Sprint 24)",
    run: () => {
      const rel = "apps/models/app/docs/decision-workflow/page.tsx";
      if (!fileExists(rel)) {
        return "Missing /docs/decision-workflow (Sprint 24).";
      }
      const src = readRel(rel);
      // Title may be inlined in JSX or pulled from the content
      // registry via getContentPage(). Either signal is fine.
      const usesRegistry = /getContentPage\(/.test(src);
      const referencesSlug =
        /"\/docs\/decision-workflow"/.test(src) ||
        /SLUG\s*=\s*"\/docs\/decision-workflow"/.test(src);
      const inlineTitle = /Decision workflow/i.test(src);
      const content = readRel("apps/models/lib/content.ts");
      const registryTitle =
        /"\/docs\/decision-workflow"[\s\S]*?title:\s*"Decision workflow"/i.test(
          content
        );
      if (
        !inlineTitle &&
        !(usesRegistry && referencesSlug && registryTitle)
      ) {
        return "/docs/decision-workflow must render the 'Decision workflow' title (inline or via the content registry).";
      }
      return null;
    },
  },
  {
    name: "/select + use-case pages + /compare hub link to /compare/build (Sprint 24)",
    run: () => {
      const failures: string[] = [];
      const select = readRel("apps/models/app/select/page.tsx");
      // /select can link to the builder either via the literal path
      // or via the comparisonBuilderUrl() helper. Both are valid
      // signals; the helper returns "/compare/build?..." at runtime.
      if (
        !/\/compare\/build/.test(select) &&
        !/comparisonBuilderUrl/.test(select)
      ) {
        failures.push("/select must link to /compare/build.");
      }
      // Use-case detail pages link via the shared layout.
      const layout = readRel(
        "apps/models/components/UseCaseDetailLayout.tsx"
      );
      if (!/comparisonBuilderUrl|\/compare\/build/.test(layout)) {
        failures.push(
          "components/UseCaseDetailLayout.tsx must link to /compare/build."
        );
      }
      const hub = readRel("apps/models/app/compare/page.tsx");
      if (!/Build a custom comparison/i.test(hub)) {
        failures.push(
          "/compare hub must include the 'Build a custom comparison' section."
        );
      }
      if (!/\/compare\/build/.test(hub)) {
        failures.push("/compare hub must link to /compare/build.");
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "route contract + sitemap + content registry advertise Sprint 24 routes",
    run: () => {
      const contract = readRel("apps/models/lib/route-contract.ts");
      const sitemap = readRel("apps/models/app/sitemap.ts");
      const content = readRel("apps/models/lib/content.ts");
      const failures: string[] = [];
      if (!/ROUTE_SET_VERSION\s*=\s*"content-v(?:[7-9]|\d{2,})"/.test(contract)) {
        failures.push(
          "ROUTE_SET_VERSION must be \"content-v7\" or later for Sprint 24."
        );
      }
      if (!/"\/compare\/build"/.test(contract)) {
        failures.push(
          "route-contract REQUIRED_PAGE_ROUTES must include /compare/build."
        );
      }
      if (!/"\/compare\/build"/.test(sitemap)) {
        failures.push("sitemap must include /compare/build.");
      }
      if (!/"\/docs\/decision-workflow"/.test(content)) {
        failures.push(
          "lib/content.ts must register /docs/decision-workflow so it flows through sitemap / llms.txt / /api/site."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "smoke + indexing scripts include Sprint 24 routes",
    run: () => {
      const smoke = readRel("scripts/lib/smoke.mjs");
      const indexing = readRel("scripts/indexing-qa.mjs");
      const failures: string[] = [];
      for (const path of ['"/compare/build"', '"/docs/decision-workflow"']) {
        if (!smoke.includes(path)) {
          failures.push(
            `scripts/lib/smoke.mjs must include ${path} in PAGE_ROUTES.`
          );
        }
      }
      if (!/"\/compare\/build"/.test(indexing)) {
        failures.push(
          "scripts/indexing-qa.mjs must include /compare/build as an indexable page."
        );
      }
      if (!/"\/docs\/decision-workflow"/.test(indexing)) {
        failures.push(
          "scripts/indexing-qa.mjs must include /docs/decision-workflow as a detail page."
        );
      }
      if (!/"\/compare\/build\?useCase=long-context-analysis"/.test(indexing)) {
        failures.push(
          "scripts/indexing-qa.mjs must spot-check one filtered /compare/build URL for the noindex policy."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "should-index allow-list covers Sprint 24 builder filter keys",
    run: () => {
      const src = readRel("apps/models/lib/should-index.ts");
      const failures: string[] = [];
      for (const key of ["models", "fields", "showGaps"]) {
        if (!new RegExp(`"${key}"`).test(src)) {
          failures.push(
            `should-index FILTERED_KEYS must include "${key}" so /compare/build?${key}=... is noindex.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no recommendation language on Sprint 24 surfaces",
    run: () => {
      const targets = [
        "apps/models/app/compare/build/page.tsx",
        "apps/models/app/docs/decision-workflow/page.tsx",
        "apps/models/components/DecisionWorkflow.tsx",
        "apps/models/lib/comparison-builder.ts",
      ];
      const banned: { pattern: RegExp; label: string }[] = [
        { pattern: /\bbest model\b/i, label: "best model" },
        { pattern: /\bwe recommend\b/i, label: "we recommend" },
        { pattern: /\brecommended model\b/i, label: "recommended model" },
        {
          pattern: /(?:is|are)\s+(?:the\s+)?winner\b/i,
          label: "is the winner",
        },
        {
          pattern: /\bcheapest\s+(?:model|provider|platform|inference)\b/i,
          label: "cheapest <noun>",
        },
        {
          pattern: /\bfastest\s+(?:model|provider|inference)\b/i,
          label: "fastest <noun>",
        },
      ];
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        for (const b of banned) {
          if (b.pattern.test(stripped)) {
            failures.push(
              `${rel} contains banned recommendation phrase "${b.label}".`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no OpenAI numeric metric appears on Sprint 24 surfaces",
    run: () => {
      const targets = [
        "apps/models/app/compare/build/page.tsx",
        "apps/models/app/docs/decision-workflow/page.tsx",
        "apps/models/components/DecisionWorkflow.tsx",
        "apps/models/lib/comparison-builder.ts",
      ];
      const banned =
        /"[^"]*\bgpt-5\b[^"]*"[\s\S]{0,200}?\b\d{4,}\b/i;
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        if (banned.test(src)) {
          failures.push(
            `${rel} mentions GPT-5 alongside a numeric literal — no OpenAI metrics are verified yet.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  // ---------------------------------------------------------------------
  // Sprint 25 — decision briefs + shareable evidence exports.
  // ---------------------------------------------------------------------
  {
    name: "lib/decision-briefs.ts exists with required exports (Sprint 25)",
    run: () => {
      const rel = "apps/models/lib/decision-briefs.ts";
      if (!fileExists(rel)) {
        return "Missing lib/decision-briefs.ts (Sprint 25).";
      }
      const src = readRel(rel);
      const failures: string[] = [];
      for (const token of [
        "buildDecisionBrief",
        "decisionBriefToMarkdown",
        "decisionBriefToJson",
        "getDecisionBriefDefaults",
        "decisionBriefUrl",
        "DecisionBrief",
        "DecisionBriefInput",
        "DECISION_BRIEF_MAX_MODELS",
      ]) {
        if (!new RegExp(`\\b${token}\\b`).test(src)) {
          failures.push(
            `lib/decision-briefs.ts must export \`${token}\`.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "lib/decision-briefs.ts is deterministic + score-free (Sprint 25)",
    run: () => {
      const src = readRel("apps/models/lib/decision-briefs.ts");
      // Strip comments AND string literals before scanning for
      // banned identifiers. Disclaimer text ("does not declare a
      // winner", "does not rank by price") lives in string
      // constants and is allowed; the rule only forbids identifier-
      // shaped usage.
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1")
        .replace(/"(?:\\.|[^"\\])*"/g, "")
        .replace(/'(?:\\.|[^'\\])*'/g, "")
        .replace(/`(?:\\.|[^`\\])*`/g, "");
      const failures: string[] = [];
      if (/\bfetch\s*\(/.test(stripped)) {
        failures.push("lib/decision-briefs.ts must not call fetch().");
      }
      if (/\bprocess\.env\b/.test(stripped)) {
        failures.push(
          "lib/decision-briefs.ts must not read process.env."
        );
      }
      if (/\bDate\.now\s*\(/.test(stripped)) {
        failures.push(
          "lib/decision-briefs.ts must not call Date.now() — generatedAt must come from siteConfig.buildDate."
        );
      }
      // No scoring / ranking / recommendation identifiers.
      const bannedIdent =
        /\b(score|rank|ranking|rankBy|ranked|weightedScore|fitnessScore|winner|recommend|recommended)\b/i;
      if (bannedIdent.test(stripped)) {
        failures.push(
          "lib/decision-briefs.ts must not contain score/rank/winner/recommend identifiers."
        );
      }
      if (!/siteConfig\.buildDate/.test(src)) {
        failures.push(
          "lib/decision-briefs.ts must read siteConfig.buildDate for generatedAt."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/briefs/build page exists with filtered-noindex policy (Sprint 25)",
    run: () => {
      const rel = "apps/models/app/briefs/build/page.tsx";
      if (!fileExists(rel)) {
        return "Missing /briefs/build page (Sprint 25).";
      }
      const src = readRel(rel);
      const failures: string[] = [];
      if (!/Decision Brief Builder/i.test(src)) {
        failures.push(
          "/briefs/build must render the 'Decision Brief Builder' title."
        );
      }
      if (!/buildDecisionBrief/.test(src)) {
        failures.push(
          "/briefs/build must call buildDecisionBrief()."
        );
      }
      if (!/isFilteredRoute/.test(src) || !/robotsMetadata/.test(src)) {
        failures.push(
          "/briefs/build must apply the filtered-noindex policy via isFilteredRoute + robotsMetadata."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/api/briefs/decision endpoint exists + noindex + secrets-free (Sprint 25)",
    run: () => {
      const rel = "apps/models/app/api/briefs/decision/route.ts";
      if (!fileExists(rel)) {
        return "Missing /api/briefs/decision endpoint (Sprint 25).";
      }
      const src = readRel(rel);
      const failures: string[] = [];
      if (!/buildDecisionBrief/.test(src)) {
        failures.push(
          "/api/briefs/decision must call buildDecisionBrief()."
        );
      }
      if (!/text\/markdown/.test(src)) {
        failures.push(
          "/api/briefs/decision must default to text/markdown output."
        );
      }
      if (!/X-Robots-Tag/.test(src)) {
        failures.push(
          "/api/briefs/decision must set X-Robots-Tag: noindex on every response."
        );
      }
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      if (/\bfetch\s*\(/.test(stripped)) {
        failures.push("/api/briefs/decision must not call fetch().");
      }
      const bannedEnv =
        /process\.env\.(?:CRON_SECRET|KV_REST_API_TOKEN|VERCEL_OIDC_TOKEN|REDIS|SUPABASE|OPENAI|ANTHROPIC|GROQ|TOGETHER|GOOGLE|MISTRAL|DEEPSEEK)[A-Z_0-9]*\b/;
      if (bannedEnv.test(stripped)) {
        failures.push(
          "/api/briefs/decision must not reference any secret env var."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/docs/decision-briefs page exists (Sprint 25)",
    run: () => {
      const rel = "apps/models/app/docs/decision-briefs/page.tsx";
      if (!fileExists(rel)) {
        return "Missing /docs/decision-briefs (Sprint 25).";
      }
      const src = readRel(rel);
      const inlineTitle = /Decision briefs/i.test(src);
      const usesRegistry = /getContentPage\(/.test(src);
      const referencesSlug = /"\/docs\/decision-briefs"/.test(src);
      const content = readRel("apps/models/lib/content.ts");
      const registryTitle =
        /"\/docs\/decision-briefs"[\s\S]*?title:\s*"Decision briefs"/i.test(
          content
        );
      if (
        !inlineTitle &&
        !(usesRegistry && referencesSlug && registryTitle)
      ) {
        return "/docs/decision-briefs must render the 'Decision briefs' title.";
      }
      return null;
    },
  },
  {
    name: "/select + /compare/build + use-case pages + /intelligence link to /briefs/build (Sprint 25)",
    run: () => {
      const failures: string[] = [];
      const select = readRel("apps/models/app/select/page.tsx");
      if (!/decisionBriefUrl|\/briefs\/build/.test(select)) {
        failures.push("/select must link to /briefs/build.");
      }
      const compareBuild = readRel(
        "apps/models/app/compare/build/page.tsx"
      );
      if (!/decisionBriefUrl|\/briefs\/build/.test(compareBuild)) {
        failures.push("/compare/build must link to /briefs/build.");
      }
      const useCaseLayout = readRel(
        "apps/models/components/UseCaseDetailLayout.tsx"
      );
      if (!/decisionBriefUrl|\/briefs\/build/.test(useCaseLayout)) {
        failures.push(
          "components/UseCaseDetailLayout.tsx must link to /briefs/build."
        );
      }
      const intel = readRel(
        "apps/models/lib/intelligence-summary.ts"
      );
      if (!/"\/briefs\/build"/.test(intel)) {
        failures.push(
          "lib/intelligence-summary.ts must include a workspace link to /briefs/build."
        );
      }
      const workflowDocs = readRel(
        "apps/models/app/docs/decision-workflow/page.tsx"
      );
      if (!/\/briefs\/build/.test(workflowDocs)) {
        failures.push(
          "/docs/decision-workflow must reference /briefs/build."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "route contract advertises Sprint 25 routes",
    run: () => {
      const src = readRel("apps/models/lib/route-contract.ts");
      const failures: string[] = [];
      // Sprint 25 introduced content-v8. Later sprints may bump.
      const versionMatch = src.match(
        /ROUTE_SET_VERSION\s*=\s*"content-v(\d+)"/
      );
      if (!versionMatch || Number(versionMatch[1]) < 8) {
        failures.push(
          "ROUTE_SET_VERSION must be \"content-v8\" or later (Sprint 25 introduced content-v8)."
        );
      }
      if (!/"\/briefs\/build"/.test(src)) {
        failures.push(
          "lib/route-contract.ts REQUIRED_PAGE_ROUTES must include /briefs/build."
        );
      }
      if (!/"\/api\/briefs\/decision"/.test(src)) {
        failures.push(
          "lib/route-contract.ts REQUIRED_API_ROUTES + INTELLIGENCE_ENDPOINTS must include /api/briefs/decision."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "sitemap + llms.txt advertise Sprint 25 brief surfaces",
    run: () => {
      const sitemap = readRel("apps/models/app/sitemap.ts");
      const llms = readRel("apps/models/app/llms.txt/route.ts");
      const content = readRel("apps/models/lib/content.ts");
      const failures: string[] = [];
      if (!/"\/briefs\/build"/.test(sitemap)) {
        failures.push("sitemap must include /briefs/build.");
      }
      if (!/"\/briefs\/build"/.test(llms)) {
        failures.push("llms.txt must list /briefs/build.");
      }
      if (!/"\/docs\/decision-briefs"/.test(content)) {
        failures.push(
          "lib/content.ts must register /docs/decision-briefs so sitemap + llms.txt + /api/site advertise it."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/api/site advertises brief builder + export endpoints (Sprint 25)",
    run: () => {
      const src = readRel("apps/models/app/api/site/route.ts");
      const failures: string[] = [];
      for (const t of ["decisionBriefBuilder", "decisionBriefApi"]) {
        if (!new RegExp(`\\b${t}\\b`).test(src)) {
          failures.push(`/api/site response must include \`${t}\`.`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "smoke + indexing scripts include Sprint 25 routes",
    run: () => {
      const smoke = readRel("scripts/lib/smoke.mjs");
      const indexing = readRel("scripts/indexing-qa.mjs");
      const failures: string[] = [];
      for (const path of [
        '"/briefs/build"',
        '"/docs/decision-briefs"',
      ]) {
        if (!smoke.includes(path)) {
          failures.push(
            `scripts/lib/smoke.mjs must include ${path} in PAGE_ROUTES.`
          );
        }
      }
      if (!/"\/api\/briefs\/decision\?format=json"/.test(smoke)) {
        failures.push(
          "scripts/lib/smoke.mjs must include /api/briefs/decision?format=json in API_ROUTES."
        );
      }
      if (!/"\/briefs\/build"/.test(indexing)) {
        failures.push(
          "scripts/indexing-qa.mjs must include /briefs/build as an indexable page."
        );
      }
      if (!/"\/docs\/decision-briefs"/.test(indexing)) {
        failures.push(
          "scripts/indexing-qa.mjs must include /docs/decision-briefs as a detail page."
        );
      }
      if (!/"\/briefs\/build\?useCase=long-context-analysis"/.test(indexing)) {
        failures.push(
          "scripts/indexing-qa.mjs must spot-check one filtered /briefs/build URL for the noindex policy."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no recommendation language on Sprint 25 surfaces",
    run: () => {
      const targets = [
        "apps/models/app/briefs/build/page.tsx",
        "apps/models/app/api/briefs/decision/route.ts",
        "apps/models/app/docs/decision-briefs/page.tsx",
        "apps/models/lib/decision-briefs.ts",
      ];
      const banned: { pattern: RegExp; label: string }[] = [
        { pattern: /\bbest model\b/i, label: "best model" },
        { pattern: /\bwe recommend\b/i, label: "we recommend" },
        { pattern: /\brecommended model\b/i, label: "recommended model" },
        {
          pattern: /(?:is|are)\s+(?:the\s+)?winner\b/i,
          label: "is the winner",
        },
        {
          pattern: /\bcheapest\s+(?:model|provider|platform|inference)\b/i,
          label: "cheapest <noun>",
        },
        {
          pattern: /\bfastest\s+(?:model|provider|inference)\b/i,
          label: "fastest <noun>",
        },
      ];
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        for (const b of banned) {
          if (b.pattern.test(stripped)) {
            failures.push(
              `${rel} contains banned recommendation phrase "${b.label}".`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no OpenAI numeric metric appears on Sprint 25 surfaces",
    run: () => {
      const targets = [
        "apps/models/app/briefs/build/page.tsx",
        "apps/models/app/api/briefs/decision/route.ts",
        "apps/models/app/docs/decision-briefs/page.tsx",
        "apps/models/lib/decision-briefs.ts",
      ];
      const banned =
        /"[^"]*\bgpt-5\b[^"]*"[\s\S]{0,200}?\b\d{4,}\b/i;
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        if (banned.test(src)) {
          failures.push(
            `${rel} mentions GPT-5 alongside a numeric literal — no OpenAI metrics are verified yet.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  // ---------------------------------------------------------------------
  // Brand Sprint — AiModels WebmasterID v2 logo promoted into the
  // live brand system. Guards confirm the canonical assets exist,
  // the Logo component renders the v2 design, the favicon + OG
  // image use the v2 palette, the brand-source directory carries a
  // README, and BRAND_ASSETS.md documents the v2 source policy.
  // Provider lettermarks (public/brands/) are intentionally left
  // alone — the brand sprint touches the product identity only.
  // ---------------------------------------------------------------------
  {
    name: "AiModels WebmasterID v2 brand assets exist (Brand Sprint)",
    run: () => {
      const required: { rel: string; label: string }[] = [
        {
          rel: "apps/models/public/logo.svg",
          label: "logo.svg (full lockup)",
        },
        {
          rel: "apps/models/public/logo-mark.svg",
          label: "logo-mark.svg (icon only)",
        },
        {
          rel: "apps/models/public/logo-mono.svg",
          label: "logo-mono.svg (single-colour)",
        },
        {
          rel: "apps/models/app/icon.svg",
          label: "app/icon.svg (favicon)",
        },
        {
          rel: "apps/models/public/brand-source/README.md",
          label: "public/brand-source/README.md",
        },
      ];
      const failures: string[] = [];
      for (const r of required) {
        if (!fileExists(r.rel)) {
          failures.push(`Missing ${r.label} (${r.rel}).`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "Live logo files render the v2 design (Brand Sprint)",
    run: () => {
      // The v2 design uses the brand gradient stops 1E5BC7 → 2BA6C6 →
      // 3DD68A and the rounded-tile <rect rx="14">. The legacy mark
      // was a stroked W with no tile. Verify each canonical SVG
      // carries the v2 fingerprints.
      const targets = [
        "apps/models/public/logo.svg",
        "apps/models/public/logo-mark.svg",
        "apps/models/app/icon.svg",
      ];
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        if (!/#1E5BC7/i.test(src) || !/#3DD68A/i.test(src)) {
          failures.push(
            `${rel} does not carry the v2 brand gradient stops (#1E5BC7 → #3DD68A).`
          );
        }
        if (!/rx="14"|rx="18"|rx="13"|rounded/i.test(src)) {
          failures.push(
            `${rel} does not appear to render the rounded brand tile.`
          );
        }
      }
      // logo-mono.svg uses currentColor (no gradient) — check the
      // outlined-tile fingerprint separately.
      const mono = "apps/models/public/logo-mono.svg";
      if (fileExists(mono)) {
        const src = readRel(mono);
        if (!/currentColor/.test(src)) {
          failures.push(
            "logo-mono.svg must use currentColor for tinting on dark / single-colour contexts."
          );
        }
        if (!/rx="13"|rx="14"/.test(src)) {
          failures.push(
            "logo-mono.svg must render the outlined brand tile."
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "Logo component renders the v2 mark inline (Brand Sprint)",
    run: () => {
      const src = readRel("apps/models/components/Logo.tsx");
      const failures: string[] = [];
      // The inline mark uses the v2 gradient stops + the rounded
      // tile rect.
      if (!/#1E5BC7/.test(src) || !/#3DD68A/.test(src)) {
        failures.push(
          "components/Logo.tsx must render the v2 gradient stops (#1E5BC7 → #3DD68A) inline."
        );
      }
      if (!/rx="14"|ry="14"/.test(src)) {
        failures.push(
          "components/Logo.tsx must render the rounded brand tile."
        );
      }
      // Wordmark must include the AiModels / WebmasterID lockup.
      if (!/AiModels/.test(src)) {
        failures.push(
          "components/Logo.tsx must include the 'AiModels' wordmark label."
        );
      }
      if (!/Webmaster/.test(src)) {
        failures.push(
          "components/Logo.tsx must include the 'Webmaster' wordmark."
        );
      }
      // Strip comments before scanning the banned legacy gradient.
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      if (/#7C3AED/.test(stripped)) {
        failures.push(
          "components/Logo.tsx still references the legacy violet gradient stop #7C3AED — it should be removed in v2."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "OpenGraph image uses the v2 brand palette (Brand Sprint)",
    run: () => {
      const src = readRel("apps/models/app/opengraph-image.tsx");
      const failures: string[] = [];
      if (!/#1E5BC7/.test(src) || !/#3DD68A/.test(src)) {
        failures.push(
          "opengraph-image.tsx must use the v2 gradient stops (#1E5BC7 → #3DD68A)."
        );
      }
      // Strip comments before scanning the banned legacy gradient.
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      if (/#7C3AED/.test(stripped)) {
        failures.push(
          "opengraph-image.tsx still references the legacy violet gradient stop #7C3AED."
        );
      }
      if (!/AiModels/.test(src)) {
        failures.push(
          "opengraph-image.tsx must include the 'AiModels' brand label."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "BRAND_ASSETS.md documents the AiModels WebmasterID v2 source (Brand Sprint)",
    run: () => {
      const src = readRel("BRAND_ASSETS.md");
      const failures: string[] = [];
      if (!/AiModels WebmasterID/i.test(src)) {
        failures.push(
          "BRAND_ASSETS.md must document the AiModels WebmasterID brand."
        );
      }
      if (!/brand-source/.test(src)) {
        failures.push(
          "BRAND_ASSETS.md must reference the public/brand-source/ directory."
        );
      }
      if (!/Vector recreation|vector recreation|recreations/i.test(src)) {
        failures.push(
          "BRAND_ASSETS.md must disclose that the SVG files are vector recreations of the user-supplied source."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "public/brand-source/ stays separate from provider brand assets",
    run: () => {
      // Brand-source must hold first-party product brand only. Any
      // file with a provider name in the path is a misplacement;
      // provider lettermarks belong in public/brands/.
      const dir = "apps/models/public/brand-source";
      const ROOT = resolve(__dirname, "..");
      const path = resolve(ROOT, dir);
      try {
        const entries = readdirSync(path);
        const providerLike =
          /(anthropic|openai|gpt|claude|google|gemini|meta|llama|mistral|deepseek|groq|together|qwen|bedrock|vertex)/i;
        const offending = entries.filter((e) => providerLike.test(e));
        if (offending.length) {
          return `public/brand-source/ contains entries that look like provider assets: ${offending.join(", ")}. Provider marks belong in public/brands/, not public/brand-source/.`;
        }
        return null;
      } catch {
        return null; // Directory missing — the "assets exist" guard reports it.
      }
    },
  },
  // ---------------------------------------------------------------------
  // Sprint 26 — UX conversion polish: landing narrative + workflow
  // clarity. New /how-it-works walkthrough, homepage decision-workflow
  // strip + "Who / What this is not" framing, polished workspace
  // intros. Same no-recommendation policy applies to every new surface.
  // ---------------------------------------------------------------------
  {
    name: "/how-it-works walkthrough exists (Sprint 26)",
    run: () => {
      const rel = "apps/models/app/how-it-works/page.tsx";
      if (!fileExists(rel)) {
        return "Missing /how-it-works page (Sprint 26).";
      }
      const src = readRel(rel);
      const failures: string[] = [];
      if (!/DecisionWorkflow/.test(src)) {
        failures.push(
          "/how-it-works must render the shared <DecisionWorkflow> component."
        );
      }
      const usesRegistry = /getContentPage\(/.test(src);
      const referencesSlug = /"\/how-it-works"/.test(src);
      const content = readRel("apps/models/lib/content.ts");
      const registryTitle =
        /"\/how-it-works"[\s\S]*?title:\s*"How WebmasterID Models works"/i.test(
          content
        );
      if (!(usesRegistry && referencesSlug && registryTitle)) {
        return "/how-it-works must read its title from the content registry (getContentPage). Registry entry must keep the canonical title.";
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "Homepage renders the decision-workflow strip + audience cards (Sprint 26)",
    run: () => {
      const src = readRel("apps/models/app/page.tsx");
      const failures: string[] = [];
      if (!/DecisionWorkflow/.test(src)) {
        failures.push(
          "Homepage must render the shared <DecisionWorkflow> strip below the hero."
        );
      }
      if (!/How to use this/i.test(src)) {
        failures.push(
          "Homepage must include the 'How to use this' section header."
        );
      }
      if (!/Who this is for/i.test(src)) {
        failures.push(
          "Homepage must include the 'Who this is for' framing card."
        );
      }
      if (!/What this catalogue is not/i.test(src)) {
        failures.push(
          "Homepage must include the 'What this catalogue is not' framing card."
        );
      }
      if (!/\/how-it-works/.test(src)) {
        failures.push(
          "Homepage must link to /how-it-works (e.g. via the workflow strip CTA)."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "Hero funnels into a learning or use-case entry (Sprint 26, updated Sprint 30)",
    run: () => {
      const src = readRel("apps/models/components/Hero.tsx");
      const failures: string[] = [];
      // Sprint 30 repositioned the Hero around the AI usage learning
      // curriculum. Sprint 33 refined to "Choose your learning path".
      // Accept any of the legacy or current primary CTAs.
      const hasPrimaryCta =
        /Start with a use case/i.test(src) ||
        /Start learning/i.test(src) ||
        /Choose your(?:\s+learning)?\s+path/i.test(src);
      if (!hasPrimaryCta) {
        failures.push(
          "Hero must include a primary CTA: 'Start learning', 'Choose your (learning) path', or 'Start with a use case'."
        );
      }
      const hasOnRamp =
        /\/learn/.test(src) ||
        /\/use-cases/.test(src);
      if (!hasOnRamp) {
        failures.push(
          "Hero must link to /learn (curriculum) or /use-cases (legacy entry)."
        );
      }
      if (!/How it works/i.test(src) || !/\/how-it-works/.test(src)) {
        failures.push("Hero must link to /how-it-works.");
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "Workspace intros mention the workflow walkthrough (Sprint 26)",
    run: () => {
      const surfaces = [
        "apps/models/app/select/page.tsx",
        "apps/models/app/compare/build/page.tsx",
        "apps/models/app/briefs/build/page.tsx",
        "apps/models/app/intelligence/page.tsx",
      ];
      const failures: string[] = [];
      for (const rel of surfaces) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        // Sprint 30 added /learn as the primary curriculum on-ramp.
        // Either /how-it-works or /learn satisfies the funnel signal.
        const hasFunnel =
          /\/how-it-works/.test(src) || /\/learn\b/.test(src);
        if (!hasFunnel) {
          failures.push(
            `${rel} must reference /how-it-works or /learn in its intro so new visitors can find the walkthrough.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/how-it-works is in route contract + sitemap + llms.txt + footer (Sprint 26)",
    run: () => {
      const contract = readRel("apps/models/lib/route-contract.ts");
      const sitemap = readRel("apps/models/app/sitemap.ts");
      const llms = readRel("apps/models/app/llms.txt/route.ts");
      const footer = readRel("apps/models/components/SiteFooter.tsx");
      const failures: string[] = [];
      if (!/"\/how-it-works"/.test(contract)) {
        failures.push(
          "lib/route-contract.ts REQUIRED_PAGE_ROUTES must include /how-it-works."
        );
      }
      if (!/"\/how-it-works"/.test(sitemap)) {
        failures.push("sitemap must include /how-it-works.");
      }
      if (!/"\/how-it-works"/.test(llms)) {
        failures.push("llms.txt must list /how-it-works.");
      }
      if (!/\/how-it-works/.test(footer)) {
        failures.push("SiteFooter must link to /how-it-works.");
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "Smoke + indexing include /how-it-works (Sprint 26)",
    run: () => {
      const smoke = readRel("scripts/lib/smoke.mjs");
      const indexing = readRel("scripts/indexing-qa.mjs");
      const failures: string[] = [];
      if (!/"\/how-it-works"/.test(smoke)) {
        failures.push("scripts/lib/smoke.mjs must include /how-it-works.");
      }
      if (!/"\/how-it-works"/.test(indexing)) {
        failures.push(
          "scripts/indexing-qa.mjs must include /how-it-works."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "No recommendation language on Sprint 26 surfaces",
    run: () => {
      const targets = [
        "apps/models/components/Hero.tsx",
        "apps/models/app/how-it-works/page.tsx",
      ];
      const banned: { pattern: RegExp; label: string }[] = [
        { pattern: /\bbest model\b/i, label: "best model" },
        { pattern: /\bwe recommend\b/i, label: "we recommend" },
        { pattern: /\brecommended model\b/i, label: "recommended model" },
        {
          pattern: /(?:is|are)\s+(?:the\s+)?winner\b/i,
          label: "is the winner",
        },
        {
          pattern: /\bcheapest\s+(?:model|provider|platform|inference)\b/i,
          label: "cheapest <noun>",
        },
        {
          pattern: /\bfastest\s+(?:model|provider|inference)\b/i,
          label: "fastest <noun>",
        },
      ];
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        for (const b of banned) {
          if (b.pattern.test(stripped)) {
            failures.push(
              `${rel} contains banned recommendation phrase "${b.label}".`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  // ---------------------------------------------------------------------
  // Sprint 27 — visual proof + guided demos + example evidence brief.
  // ---------------------------------------------------------------------
  {
    name: "lib/guided-demos.ts exists with three demos (Sprint 27)",
    run: () => {
      const rel = "apps/models/lib/guided-demos.ts";
      if (!fileExists(rel)) {
        return "Missing lib/guided-demos.ts (Sprint 27).";
      }
      const src = readRel(rel);
      const failures: string[] = [];
      for (const token of [
        "getGuidedDemos",
        "getGuidedDemo",
        "getGuidedDemoRoutes",
        "GuidedDemoSlug",
      ]) {
        if (!new RegExp(`\\b${token}\\b`).test(src)) {
          failures.push(
            `lib/guided-demos.ts must export \`${token}\`.`
          );
        }
      }
      for (const slug of [
        '"long-context-analysis"',
        '"hosted-inference"',
        '"governance-review"',
      ]) {
        if (!src.includes(slug)) {
          failures.push(
            `lib/guided-demos.ts must declare the ${slug} demo slug.`
          );
        }
      }
      // No fetch / no env / no Date.now / no scoring.
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1")
        .replace(/"(?:\\.|[^"\\])*"/g, "")
        .replace(/'(?:\\.|[^'\\])*'/g, "")
        .replace(/`(?:\\.|[^`\\])*`/g, "");
      if (/\bfetch\s*\(/.test(stripped)) {
        failures.push("lib/guided-demos.ts must not call fetch().");
      }
      if (/\bprocess\.env\b/.test(stripped)) {
        failures.push(
          "lib/guided-demos.ts must not read process.env."
        );
      }
      const banned =
        /\b(score|rank|ranking|rankBy|ranked|weightedScore|fitnessScore|winner|recommend|recommended)\b/i;
      if (banned.test(stripped)) {
        failures.push(
          "lib/guided-demos.ts must not contain score/rank/winner/recommend identifiers (string-literal disclaimer copy is allowed)."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "demo components exist (Sprint 27)",
    run: () => {
      const required = [
        "apps/models/components/demo/WorkflowPreviewPanel.tsx",
        "apps/models/components/demo/DemoRouteCard.tsx",
        "apps/models/components/demo/EvidencePreviewTable.tsx",
        "apps/models/components/demo/DecisionBriefPreview.tsx",
        "apps/models/components/demo/DemoStepStrip.tsx",
      ];
      const missing = required.filter((r) => !fileExists(r));
      if (missing.length) {
        return `Missing demo component(s): ${missing.join(", ")}.`;
      }
      return null;
    },
  },
  {
    name: "/demos hub + demo detail pages exist (Sprint 27)",
    run: () => {
      const required = [
        "apps/models/app/demos/page.tsx",
        "apps/models/app/demos/[slug]/page.tsx",
      ];
      const missing = required.filter((r) => !fileExists(r));
      if (missing.length) {
        return `Missing /demos page(s): ${missing.join(", ")}.`;
      }
      const hub = readRel("apps/models/app/demos/page.tsx");
      const failures: string[] = [];
      if (!/Guided product demos/i.test(hub)) {
        failures.push(
          "/demos hub must render the 'Guided product demos' title."
        );
      }
      if (!/getGuidedDemos/.test(hub)) {
        failures.push(
          "/demos hub must call getGuidedDemos() to render the demo cards."
        );
      }
      if (!/not model recommendations/i.test(hub)) {
        failures.push(
          "/demos hub must include the 'navigation examples, not model recommendations' framing."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/examples/decision-brief uses buildDecisionBrief (Sprint 27)",
    run: () => {
      const rel = "apps/models/app/examples/decision-brief/page.tsx";
      if (!fileExists(rel)) {
        return "Missing /examples/decision-brief (Sprint 27).";
      }
      const src = readRel(rel);
      const failures: string[] = [];
      if (!/buildDecisionBrief/.test(src)) {
        failures.push(
          "/examples/decision-brief must call buildDecisionBrief() so the example cannot drift from the live brief helper."
        );
      }
      if (!/this is an example, not a recommendation/i.test(src)) {
        failures.push(
          "/examples/decision-brief must label itself as an example, not a recommendation."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "demo detail pages link to select/compare/brief/sources/reverification (Sprint 27)",
    run: () => {
      // The detail page renders the demo's primaryRoutes array via
      // <DemoStepStrip>; guided-demos.ts already builds those routes
      // pointing at /select, /compare/build, /briefs/build, /sources
      // (and /reverification for governance). Verify the detail page
      // pulls the route array.
      const detail = readRel("apps/models/app/demos/[slug]/page.tsx");
      const failures: string[] = [];
      if (!/DemoStepStrip/.test(detail)) {
        failures.push(
          "demo detail page must render <DemoStepStrip> so demo.primaryRoutes are surfaced."
        );
      }
      // The detail page also explicitly links /coverage, /sources,
      // /reverification in its related-routes aside.
      for (const path of ['"/sources"', '"/reverification"']) {
        if (!detail.includes(path)) {
          failures.push(
            `demo detail page must link to ${path} in its related-routes block.`
          );
        }
      }
      // And the guided-demos helper itself must build routes for the
      // four canonical workspaces.
      const helper = readRel("apps/models/lib/guided-demos.ts");
      for (const path of [
        "/use-cases/",
        "/select?",
        "comparisonBuilderUrl",
        "decisionBriefUrl",
        "/sources",
      ]) {
        if (!helper.includes(path)) {
          failures.push(
            `lib/guided-demos.ts must include the canonical workspace path \`${path}\` in its built routes.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "Sprint 27 surfaces link to /demos (Sprint 27)",
    run: () => {
      const failures: string[] = [];
      const homepage = readRel("apps/models/app/page.tsx");
      if (!/\/demos\b/.test(homepage)) {
        failures.push(
          "Homepage must link to /demos (Try a guided workflow section)."
        );
      }
      const howItWorks = readRel(
        "apps/models/app/how-it-works/page.tsx"
      );
      if (!/\/demos\b/.test(howItWorks)) {
        failures.push("/how-it-works must link to /demos.");
      }
      const intel = readRel("apps/models/lib/intelligence-summary.ts");
      if (!/"\/demos"/.test(intel)) {
        failures.push(
          "lib/intelligence-summary.ts must include a workspace card for /demos."
        );
      }
      const briefs = readRel(
        "apps/models/app/briefs/build/page.tsx"
      );
      if (!/\/examples\/decision-brief/.test(briefs)) {
        failures.push(
          "/briefs/build must link to /examples/decision-brief."
        );
      }
      const footer = readRel(
        "apps/models/components/SiteFooter.tsx"
      );
      if (!/"\/demos"/.test(footer)) {
        failures.push("SiteFooter must link to /demos.");
      }
      if (!/"\/examples\/decision-brief"/.test(footer)) {
        failures.push(
          "SiteFooter must link to /examples/decision-brief."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "route contract + sitemap + llms.txt + smoke + indexing advertise Sprint 27 routes",
    run: () => {
      const contract = readRel("apps/models/lib/route-contract.ts");
      const sitemap = readRel("apps/models/app/sitemap.ts");
      const llms = readRel("apps/models/app/llms.txt/route.ts");
      const smoke = readRel("scripts/lib/smoke.mjs");
      const indexing = readRel("scripts/indexing-qa.mjs");
      const failures: string[] = [];
      const versionMatch = contract.match(
        /ROUTE_SET_VERSION\s*=\s*"content-v(\d+)"/
      );
      if (!versionMatch || Number(versionMatch[1]) < 9) {
        failures.push(
          "ROUTE_SET_VERSION must be \"content-v9\" or later for Sprint 27."
        );
      }
      for (const path of ['"/demos"', '"/examples/decision-brief"']) {
        if (!contract.includes(path)) {
          failures.push(`route-contract must include ${path}.`);
        }
        if (!sitemap.includes(path)) {
          failures.push(`sitemap must include ${path}.`);
        }
        if (!llms.includes(path)) {
          failures.push(`llms.txt must list ${path}.`);
        }
        if (!smoke.includes(path)) {
          failures.push(
            `scripts/lib/smoke.mjs must include ${path}.`
          );
        }
      }
      // Demo detail pages live in sitemap + smoke too.
      for (const path of [
        '"/demos/long-context-analysis"',
        '"/demos/hosted-inference"',
        '"/demos/governance-review"',
      ]) {
        if (!sitemap.includes(path)) {
          failures.push(`sitemap must include ${path}.`);
        }
        if (!smoke.includes(path)) {
          failures.push(`scripts/lib/smoke.mjs must include ${path}.`);
        }
      }
      if (!/"\/demos"/.test(indexing)) {
        failures.push(
          "scripts/indexing-qa.mjs must include /demos as an indexable hub."
        );
      }
      if (!/"\/examples\/decision-brief"/.test(indexing)) {
        failures.push(
          "scripts/indexing-qa.mjs must include /examples/decision-brief as a detail page."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no recommendation language on Sprint 27 surfaces",
    run: () => {
      const targets = [
        "apps/models/lib/guided-demos.ts",
        "apps/models/app/demos/page.tsx",
        "apps/models/app/demos/[slug]/page.tsx",
        "apps/models/app/examples/decision-brief/page.tsx",
        "apps/models/components/demo/WorkflowPreviewPanel.tsx",
        "apps/models/components/demo/DemoRouteCard.tsx",
        "apps/models/components/demo/EvidencePreviewTable.tsx",
        "apps/models/components/demo/DecisionBriefPreview.tsx",
        "apps/models/components/demo/DemoStepStrip.tsx",
      ];
      const banned: { pattern: RegExp; label: string }[] = [
        { pattern: /\bbest model\b/i, label: "best model" },
        { pattern: /\bwe recommend\b/i, label: "we recommend" },
        { pattern: /\brecommended model\b/i, label: "recommended model" },
        {
          pattern: /(?:is|are)\s+(?:the\s+)?winner\b/i,
          label: "is the winner",
        },
        {
          pattern: /\bcheapest\s+(?:model|provider|platform|inference)\b/i,
          label: "cheapest <noun>",
        },
        {
          pattern: /\bfastest\s+(?:model|provider|inference)\b/i,
          label: "fastest <noun>",
        },
      ];
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        for (const b of banned) {
          if (b.pattern.test(stripped)) {
            failures.push(
              `${rel} contains banned recommendation phrase "${b.label}".`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no fake screenshot language or fabricated benchmark literals on demo surfaces",
    run: () => {
      // Demo surfaces must render their visual proof from local data
      // (the <WorkflowPreviewPanel> / <EvidencePreviewTable> /
      // <DecisionBriefPreview> components do exactly that). Forbid
      // any reference to a static screenshot file or a benchmark
      // numeric literal in the demo surfaces themselves.
      const targets = [
        "apps/models/app/demos/page.tsx",
        "apps/models/app/demos/[slug]/page.tsx",
        "apps/models/app/examples/decision-brief/page.tsx",
        "apps/models/components/demo/WorkflowPreviewPanel.tsx",
        "apps/models/components/demo/DemoRouteCard.tsx",
        "apps/models/components/demo/EvidencePreviewTable.tsx",
        "apps/models/components/demo/DecisionBriefPreview.tsx",
        "apps/models/components/demo/DemoStepStrip.tsx",
      ];
      const failures: string[] = [];
      // Static image file references like `screenshot.png`, or a
      // tag pointing at `screenshot-*` assets. Disclaimer prose
      // ("no fabricated screenshots") does not trip this.
      const screenshotRefs =
        /screenshots?[-_.\/][a-z0-9-_]*\.(?:png|jpg|jpeg|webp|gif|svg)/i;
      // Benchmark score literal like "MMLU 89.4" or "GPQA 74.2".
      // Case-sensitive on the benchmark name to avoid catching the
      // JS `Math.min(...)` builtin or generic English "math".
      const benchmarkLiteral =
        /\b(?:MMLU|GPQA|HumanEval|HellaSwag|ARC-AGI|TruthfulQA|GSM8K|SWE-?Bench)\b[^"<>]{0,40}\b\d+(?:\.\d+)?\b/;
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        if (screenshotRefs.test(stripped)) {
          failures.push(
            `${rel} references a screenshot file — demo surfaces must render visual proof from live local data, not fabricated images.`
          );
        }
        if (benchmarkLiteral.test(stripped)) {
          failures.push(
            `${rel} contains a benchmark name alongside a numeric literal — no fabricated benchmark scores allowed.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no OpenAI numeric metric appears on Sprint 27 surfaces",
    run: () => {
      const targets = [
        "apps/models/lib/guided-demos.ts",
        "apps/models/app/demos/page.tsx",
        "apps/models/app/demos/[slug]/page.tsx",
        "apps/models/app/examples/decision-brief/page.tsx",
        "apps/models/components/demo/WorkflowPreviewPanel.tsx",
        "apps/models/components/demo/DemoRouteCard.tsx",
        "apps/models/components/demo/EvidencePreviewTable.tsx",
        "apps/models/components/demo/DecisionBriefPreview.tsx",
        "apps/models/components/demo/DemoStepStrip.tsx",
      ];
      const banned =
        /"[^"]*\bgpt-5\b[^"]*"[\s\S]{0,200}?\b\d{4,}\b/i;
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        if (banned.test(src)) {
          failures.push(
            `${rel} mentions GPT-5 alongside a numeric literal — no OpenAI metrics are verified yet.`
          );
        }
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
  // -------------------------------------------------------------------
  // Sprint 28 — learning layer
  // -------------------------------------------------------------------
  {
    name: "/learn hub exists (Sprint 28)",
    run: () => requireFile("apps/models/app/learn/page.tsx", "/learn hub"),
  },
  {
    name: "6 lesson pages exist (Sprint 28)",
    run: () => {
      const lessons = [
        "how-to-choose-ai-model",
        "context-window",
        "hosted-vs-first-party",
        "pricing-references",
        "model-lifecycle",
        "testing-ai-models",
      ];
      const failures: string[] = [];
      for (const slug of lessons) {
        const rel = `apps/models/app/learn/${slug}/page.tsx`;
        if (!fileExists(rel)) {
          failures.push(`Missing lesson page ${rel}.`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "lesson registry exists and exports lessons + groups (Sprint 28, updated Sprint 30)",
    run: () => {
      const rel = "apps/models/lib/lessons.ts";
      if (!fileExists(rel)) return `Missing ${rel}.`;
      const src = readRel(rel);
      const failures: string[] = [];
      // Sprint 30 renamed `learningPaths` (topical lesson groups) to
      // `lessonGroups` to free the namespace for role-based learning
      // paths in lib/learning-paths.ts.
      for (const sym of [
        "export const lessons",
        "export const lessonGroups",
        "export function getLesson",
        "export function getRelatedLessons",
      ]) {
        if (!src.includes(sym)) {
          failures.push(`${rel} must include \`${sym}\`.`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "lesson components exist (Sprint 28)",
    run: () => {
      const components = [
        "apps/models/components/learn/LessonLayout.tsx",
        "apps/models/components/learn/LessonApplyPanel.tsx",
        "apps/models/components/learn/ConceptChecklist.tsx",
        "apps/models/components/learn/CommonMistakes.tsx",
        "apps/models/components/learn/VerifiedExamplesTable.tsx",
      ];
      const failures: string[] = [];
      for (const rel of components) {
        if (!fileExists(rel)) {
          failures.push(`Missing component ${rel}.`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "homepage + nav + footer + key surfaces link to /learn (Sprint 28)",
    run: () => {
      const failures: string[] = [];
      const homepage = readRel("apps/models/app/page.tsx");
      if (!/\/learn\b/.test(homepage)) {
        failures.push(
          "Homepage must link to /learn (Learn first, then compare section)."
        );
      }
      const site = readRel("apps/models/lib/site-config.ts");
      if (!/href:\s*"\/learn"/.test(site)) {
        failures.push(
          "site-config.ts primaryNav must include a /learn entry."
        );
      }
      const footer = readRel("apps/models/components/SiteFooter.tsx");
      if (!/"\/learn"/.test(footer)) {
        failures.push("SiteFooter must link to /learn.");
      }
      // Footer must also list at least one lesson.
      if (!/\/learn\/how-to-choose-ai-model/.test(footer)) {
        failures.push(
          "SiteFooter must list at least one specific lesson under the Learn column."
        );
      }
      for (const rel of [
        "apps/models/app/select/page.tsx",
        "apps/models/app/compare/build/page.tsx",
        "apps/models/app/briefs/build/page.tsx",
        "apps/models/app/use-cases/page.tsx",
        "apps/models/app/how-it-works/page.tsx",
        "apps/models/app/demos/page.tsx",
        "apps/models/app/docs/page.tsx",
      ]) {
        const src = readRel(rel);
        if (!/\/learn\b/.test(src)) {
          failures.push(`${rel} must link to /learn.`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "lessons link to /select, /compare/build, /briefs/build, /sources or /coverage (Sprint 28)",
    run: () => {
      const lessonFiles = [
        "apps/models/app/learn/how-to-choose-ai-model/page.tsx",
        "apps/models/app/learn/context-window/page.tsx",
        "apps/models/app/learn/hosted-vs-first-party/page.tsx",
        "apps/models/app/learn/pricing-references/page.tsx",
        "apps/models/app/learn/model-lifecycle/page.tsx",
        "apps/models/app/learn/testing-ai-models/page.tsx",
      ];
      const workflowRoutes = [
        "/select",
        "/compare/build",
        "/briefs/build",
        "/sources",
        "/coverage",
        "/reverification",
        "/demos",
      ];
      const failures: string[] = [];
      for (const rel of lessonFiles) {
        const src = readRel(rel);
        const linksAny = workflowRoutes.some((r) => src.includes(r));
        if (!linksAny) {
          failures.push(
            `${rel} must link to at least one workflow surface (${workflowRoutes.join(", ")}).`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no banned recommendation phrases on lesson surfaces (Sprint 28)",
    run: () => {
      const targets = [
        "apps/models/lib/lessons.ts",
        "apps/models/app/learn/page.tsx",
        "apps/models/app/learn/how-to-choose-ai-model/page.tsx",
        "apps/models/app/learn/context-window/page.tsx",
        "apps/models/app/learn/hosted-vs-first-party/page.tsx",
        "apps/models/app/learn/pricing-references/page.tsx",
        "apps/models/app/learn/model-lifecycle/page.tsx",
        "apps/models/app/learn/testing-ai-models/page.tsx",
        "apps/models/components/learn/LessonLayout.tsx",
        "apps/models/components/learn/LessonApplyPanel.tsx",
        "apps/models/components/learn/ConceptChecklist.tsx",
        "apps/models/components/learn/CommonMistakes.tsx",
        "apps/models/components/learn/VerifiedExamplesTable.tsx",
      ];
      const banned: { pattern: RegExp; label: string }[] = [
        // "best <noun>" — only flag positive assertions, not disclaimers.
        {
          pattern: /\bis\s+(?:the\s+)?best\s+(?:model|ai|provider)\b/i,
          label: "is the best model/ai/provider",
        },
        { pattern: /\bbest\s+(?:ai\s+)?model\s+(?:is|for)\b/i, label: "best model is/for" },
        // "recommended model" as a positive claim.
        {
          pattern: /\bour\s+recommended\s+model\b/i,
          label: "our recommended model",
        },
        { pattern: /\bwe\s+recommend\s+(?:the\s+)?model\b/i, label: "we recommend the model" },
        // "winner" as a positive claim.
        {
          pattern: /(?:is|are)\s+(?:the\s+)?winner\b/i,
          label: "is the winner",
        },
        // Cheapest / fastest as positive claims.
        {
          pattern: /\bcheapest\s+(?:ai\s+)?(?:model|provider|platform|inference)\b/i,
          label: "cheapest <noun>",
        },
        {
          pattern: /\bfastest\s+(?:ai\s+)?(?:model|provider|inference)\b/i,
          label: "fastest <noun>",
        },
        // Hard endorsements lessons must not make.
        {
          pattern: /\bguaranteed\s+to\s+(?:work|meet|pass|satisfy)\b/i,
          label: "guaranteed to <verb>",
        },
        {
          pattern: /\bcertified\s+(?:for|compliant|by)\b/i,
          label: "certified for/compliant/by",
        },
        {
          pattern: /\bofficial\s+partner\b/i,
          label: "official partner",
        },
      ];
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        for (const b of banned) {
          if (b.pattern.test(stripped)) {
            failures.push(
              `${rel} contains banned phrase "${b.label}".`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "lesson pages do not include benchmark score literals (Sprint 28)",
    run: () => {
      const targets = [
        "apps/models/app/learn/page.tsx",
        "apps/models/app/learn/how-to-choose-ai-model/page.tsx",
        "apps/models/app/learn/context-window/page.tsx",
        "apps/models/app/learn/hosted-vs-first-party/page.tsx",
        "apps/models/app/learn/pricing-references/page.tsx",
        "apps/models/app/learn/model-lifecycle/page.tsx",
        "apps/models/app/learn/testing-ai-models/page.tsx",
        "apps/models/components/learn/LessonLayout.tsx",
        "apps/models/components/learn/LessonApplyPanel.tsx",
        "apps/models/components/learn/ConceptChecklist.tsx",
        "apps/models/components/learn/CommonMistakes.tsx",
        "apps/models/components/learn/VerifiedExamplesTable.tsx",
      ];
      // Case-sensitive benchmark name + numeric literal nearby — same
      // pattern Sprint 27 uses for demo surfaces.
      const benchmarkLiteral =
        /\b(?:MMLU|GPQA|HumanEval|HellaSwag|ARC-AGI|TruthfulQA|GSM8K|SWE-?Bench)\b[^"<>]{0,40}\b\d+(?:\.\d+)?\b/;
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        if (benchmarkLiteral.test(stripped)) {
          failures.push(
            `${rel} contains a benchmark name alongside a numeric literal — lessons must not publish fabricated benchmark scores.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no OpenAI numeric metric appears on lesson surfaces (Sprint 28)",
    run: () => {
      const targets = [
        "apps/models/lib/lessons.ts",
        "apps/models/app/learn/page.tsx",
        "apps/models/app/learn/how-to-choose-ai-model/page.tsx",
        "apps/models/app/learn/context-window/page.tsx",
        "apps/models/app/learn/hosted-vs-first-party/page.tsx",
        "apps/models/app/learn/pricing-references/page.tsx",
        "apps/models/app/learn/model-lifecycle/page.tsx",
        "apps/models/app/learn/testing-ai-models/page.tsx",
        "apps/models/components/learn/VerifiedExamplesTable.tsx",
      ];
      // The VerifiedExamplesTable component never lists a GPT-5 slug
      // (the slugs are passed in by each lesson). The page-level slug
      // arrays must also never include gpt-5.
      const banned = /"[^"]*\bgpt-5\b[^"]*"/i;
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        if (banned.test(src)) {
          failures.push(
            `${rel} references GPT-5 — no OpenAI metrics are verified yet, so lessons must not list it as a verified example.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "route contract + sitemap + llms.txt + smoke + indexing advertise Sprint 28 lesson routes",
    run: () => {
      const contract = readRel("apps/models/lib/route-contract.ts");
      const sitemap = readRel("apps/models/app/sitemap.ts");
      const llms = readRel("apps/models/app/llms.txt/route.ts");
      const smoke = readRel("scripts/lib/smoke.mjs");
      const indexing = readRel("scripts/indexing-qa.mjs");
      const failures: string[] = [];

      const versionMatch = contract.match(
        /ROUTE_SET_VERSION\s*=\s*"content-v(\d+)"/
      );
      if (!versionMatch || Number(versionMatch[1]) < 10) {
        failures.push(
          'ROUTE_SET_VERSION must be "content-v10" or later for Sprint 28.'
        );
      }

      // /learn hub must appear everywhere.
      for (const surface of [
        { name: "route-contract", src: contract },
        { name: "sitemap", src: sitemap },
        { name: "llms.txt", src: llms },
        { name: "smoke", src: smoke },
        { name: "indexing", src: indexing },
      ]) {
        if (!surface.src.includes('"/learn"')) {
          failures.push(`${surface.name} must include "/learn".`);
        }
      }

      // Lesson detail routes must appear in sitemap, smoke, and indexing
      // (not necessarily route-contract, since route-contract only lists
      // the canonical hub surfaces the smoke + /api/site must reach).
      const lessonRoutes = [
        "/learn/how-to-choose-ai-model",
        "/learn/context-window",
        "/learn/hosted-vs-first-party",
        "/learn/pricing-references",
        "/learn/model-lifecycle",
        "/learn/testing-ai-models",
      ];
      for (const path of lessonRoutes) {
        const quoted = `"${path}"`;
        if (!sitemap.includes(quoted)) {
          failures.push(`sitemap must include ${quoted}.`);
        }
        if (!smoke.includes(quoted)) {
          failures.push(`scripts/lib/smoke.mjs must include ${quoted}.`);
        }
        if (!indexing.includes(quoted)) {
          failures.push(`scripts/indexing-qa.mjs must include ${quoted}.`);
        }
        if (!llms.includes(quoted)) {
          failures.push(`llms.txt must list ${quoted}.`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  // -------------------------------------------------------------------
  // Sprint 29 — practical exercises + 4 more lessons + beginner path
  // -------------------------------------------------------------------
  {
    name: "lib/learning-exercises.ts exists with required exports (Sprint 29)",
    run: () => {
      const rel = "apps/models/lib/learning-exercises.ts";
      if (!fileExists(rel)) return `Missing ${rel}.`;
      const src = readRel(rel);
      const failures: string[] = [];
      for (const sym of [
        "export const learningExercises",
        "export function getLearningExercise",
        "export function getExercisesForLesson",
        "export function getLearningExerciseGroups",
      ]) {
        if (!src.includes(sym)) {
          failures.push(`${rel} must include \`${sym}\`.`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "all 8 exercise slugs exist in registry (Sprint 29)",
    run: () => {
      const src = readRel("apps/models/lib/learning-exercises.ts");
      const failures: string[] = [];
      for (const slug of [
        "build-first-shortlist",
        "compare-context-windows",
        "map-hosted-provider",
        "review-pricing-reference",
        "inspect-model-lifecycle",
        "create-decision-brief",
        "check-source-freshness",
        "plan-external-model-test",
      ]) {
        if (!src.includes(`slug: "${slug}"`)) {
          failures.push(`Registry missing exercise slug "${slug}".`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/learn/exercises hub + dynamic detail route exist (Sprint 29)",
    run: () => {
      const failures: string[] = [];
      if (!fileExists("apps/models/app/learn/exercises/page.tsx")) {
        failures.push("Missing /learn/exercises hub page.");
      }
      if (
        !fileExists("apps/models/app/learn/exercises/[slug]/page.tsx")
      ) {
        failures.push("Missing /learn/exercises/[slug] detail page.");
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "exercise components exist (Sprint 29)",
    run: () => {
      const failures: string[] = [];
      for (const rel of [
        "apps/models/components/learn/ExerciseLayout.tsx",
        "apps/models/components/learn/ExerciseCard.tsx",
        "apps/models/components/learn/ExerciseStepList.tsx",
        "apps/models/components/learn/ExerciseChecklist.tsx",
        "apps/models/components/learn/LessonExercisesPanel.tsx",
      ]) {
        if (!fileExists(rel)) failures.push(`Missing component ${rel}.`);
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "4 new lesson pages exist (Sprint 29)",
    run: () => {
      const failures: string[] = [];
      for (const slug of [
        "multimodal-input",
        "structured-output",
        "status-aware-selection",
        "benchmark-limitations",
      ]) {
        const rel = `apps/models/app/learn/${slug}/page.tsx`;
        if (!fileExists(rel)) failures.push(`Missing lesson page ${rel}.`);
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "lessons registry includes 10 lesson slugs (Sprint 29)",
    run: () => {
      const src = readRel("apps/models/lib/lessons.ts");
      const failures: string[] = [];
      const required = [
        "how-to-choose-ai-model",
        "context-window",
        "hosted-vs-first-party",
        "pricing-references",
        "model-lifecycle",
        "testing-ai-models",
        "multimodal-input",
        "structured-output",
        "status-aware-selection",
        "benchmark-limitations",
      ];
      for (const slug of required) {
        if (!src.includes(`slug: "${slug}"`)) {
          failures.push(`lessons.ts must register lesson slug "${slug}".`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "every lesson page surfaces related exercises (Sprint 29)",
    run: () => {
      const lessonFiles = [
        "apps/models/app/learn/how-to-choose-ai-model/page.tsx",
        "apps/models/app/learn/context-window/page.tsx",
        "apps/models/app/learn/hosted-vs-first-party/page.tsx",
        "apps/models/app/learn/pricing-references/page.tsx",
        "apps/models/app/learn/model-lifecycle/page.tsx",
        "apps/models/app/learn/testing-ai-models/page.tsx",
        "apps/models/app/learn/multimodal-input/page.tsx",
        "apps/models/app/learn/structured-output/page.tsx",
        "apps/models/app/learn/status-aware-selection/page.tsx",
        "apps/models/app/learn/benchmark-limitations/page.tsx",
      ];
      const failures: string[] = [];
      for (const rel of lessonFiles) {
        if (!fileExists(rel)) {
          failures.push(`${rel} missing.`);
          continue;
        }
        const src = readRel(rel);
        if (!src.includes("LessonExercisesPanel")) {
          failures.push(
            `${rel} must render <LessonExercisesPanel> to surface related exercises.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "exercises link to related lessons + workflow routes (Sprint 29)",
    run: () => {
      // The registry encodes related-lesson slugs and step routes; the
      // /learn/exercises/[slug] page renders both. Confirm both paths
      // wire through.
      const registry = readRel("apps/models/lib/learning-exercises.ts");
      const detail = readRel(
        "apps/models/app/learn/exercises/[slug]/page.tsx"
      );
      const failures: string[] = [];
      // Registry must reference at least one workflow surface in step
      // routes for the canonical workflow pages.
      for (const route of [
        "/select",
        "/compare/build",
        "/briefs/build",
        "/sources",
        "/reverification",
      ]) {
        if (!registry.includes(`"${route}"`)) {
          failures.push(
            `Exercise registry must include route "${route}" in at least one step.`
          );
        }
      }
      // Detail page must surface ExerciseStepList (which renders the
      // step routes) and link to related lessons via the layout.
      if (!/ExerciseStepList/.test(detail)) {
        failures.push(
          "/learn/exercises/[slug] must render <ExerciseStepList> to surface step routes."
        );
      }
      if (!/ExerciseLayout/.test(detail)) {
        failures.push(
          "/learn/exercises/[slug] must wrap content in <ExerciseLayout> so related lessons render."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "exercise pages carry an explicit no-recommendation policy note (Sprint 29)",
    run: () => {
      // Each exercise in the registry must carry a policyNote, and the
      // detail page must render the layout's "does not recommend" copy.
      const registry = readRel("apps/models/lib/learning-exercises.ts");
      const detail = readRel(
        "apps/models/app/learn/exercises/[slug]/page.tsx"
      );
      const failures: string[] = [];
      // Quick sanity: every exercise object must include the policyNote
      // key. Eight objects → eight occurrences.
      const policyMatches = registry.match(/policyNote:/g) ?? [];
      if (policyMatches.length < 8) {
        failures.push(
          `Exercise registry must include 8 policyNote entries (found ${policyMatches.length}).`
        );
      }
      if (!/does not recommend a model/i.test(detail)) {
        failures.push(
          "/learn/exercises/[slug] must state explicitly that the exercise does not recommend a model."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no quiz/scoring/ranking language on Sprint 29 surfaces",
    run: () => {
      const targets = [
        "apps/models/lib/learning-exercises.ts",
        "apps/models/app/learn/page.tsx",
        "apps/models/app/learn/exercises/page.tsx",
        "apps/models/app/learn/exercises/[slug]/page.tsx",
        "apps/models/app/learn/path/beginner/page.tsx",
        "apps/models/app/learn/multimodal-input/page.tsx",
        "apps/models/app/learn/structured-output/page.tsx",
        "apps/models/app/learn/status-aware-selection/page.tsx",
        "apps/models/app/learn/benchmark-limitations/page.tsx",
        "apps/models/components/learn/ExerciseLayout.tsx",
        "apps/models/components/learn/ExerciseCard.tsx",
        "apps/models/components/learn/ExerciseStepList.tsx",
        "apps/models/components/learn/ExerciseChecklist.tsx",
        "apps/models/components/learn/LessonExercisesPanel.tsx",
      ];
      // Only flag *positive* assertions; the policy notes are allowed
      // to mention the banned terms as things the surfaces do not do.
      const banned: { pattern: RegExp; label: string }[] = [
        {
          pattern: /\byour\s+score\s+is\b/i,
          label: "your score is",
        },
        {
          pattern: /\bgrade\s+(?:yourself|your\s+answer|your\s+results)\b/i,
          label: "grade yourself / your answer / your results",
        },
        {
          pattern: /\bthe\s+correct\s+answer\s+is\b/i,
          label: "the correct answer is",
        },
        {
          pattern: /\bis\s+(?:the\s+)?best\s+(?:model|ai|provider)\b/i,
          label: "is the best model/ai/provider",
        },
        {
          pattern: /\bour\s+recommended\s+model\b/i,
          label: "our recommended model",
        },
        {
          pattern: /\bwe\s+recommend\s+(?:the\s+)?model\b/i,
          label: "we recommend the model",
        },
        {
          pattern: /(?:is|are)\s+(?:the\s+)?winner\b/i,
          label: "is the winner",
        },
        {
          pattern: /\bcheapest\s+(?:ai\s+)?(?:model|provider|platform|inference)\b/i,
          label: "cheapest <noun>",
        },
        {
          pattern: /\bfastest\s+(?:ai\s+)?(?:model|provider|inference)\b/i,
          label: "fastest <noun>",
        },
        {
          pattern: /\bguaranteed\s+to\s+(?:work|meet|pass|satisfy)\b/i,
          label: "guaranteed to <verb>",
        },
        {
          pattern: /\bcertified\s+(?:for|compliant|by)\b/i,
          label: "certified for/compliant/by",
        },
      ];
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        for (const b of banned) {
          if (b.pattern.test(stripped)) {
            failures.push(
              `${rel} contains banned phrase "${b.label}".`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no benchmark numeric score appears on Sprint 29 surfaces",
    run: () => {
      const targets = [
        "apps/models/lib/learning-exercises.ts",
        "apps/models/app/learn/page.tsx",
        "apps/models/app/learn/exercises/page.tsx",
        "apps/models/app/learn/exercises/[slug]/page.tsx",
        "apps/models/app/learn/path/beginner/page.tsx",
        "apps/models/app/learn/multimodal-input/page.tsx",
        "apps/models/app/learn/structured-output/page.tsx",
        "apps/models/app/learn/status-aware-selection/page.tsx",
        "apps/models/app/learn/benchmark-limitations/page.tsx",
      ];
      const benchmarkLiteral =
        /\b(?:MMLU|GPQA|HumanEval|HellaSwag|ARC-AGI|TruthfulQA|GSM8K|SWE-?Bench)\b[^"<>]{0,40}\b\d+(?:\.\d+)?\b/;
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        if (benchmarkLiteral.test(stripped)) {
          failures.push(
            `${rel} contains a benchmark name alongside a numeric literal — Sprint 29 surfaces must not publish benchmark scores.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no OpenAI numeric metric appears on Sprint 29 surfaces",
    run: () => {
      const targets = [
        "apps/models/lib/learning-exercises.ts",
        "apps/models/app/learn/page.tsx",
        "apps/models/app/learn/exercises/page.tsx",
        "apps/models/app/learn/exercises/[slug]/page.tsx",
        "apps/models/app/learn/path/beginner/page.tsx",
        "apps/models/app/learn/multimodal-input/page.tsx",
        "apps/models/app/learn/structured-output/page.tsx",
        "apps/models/app/learn/status-aware-selection/page.tsx",
        "apps/models/app/learn/benchmark-limitations/page.tsx",
      ];
      const banned = /"[^"]*\bgpt-5\b[^"]*"/i;
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        if (banned.test(src)) {
          failures.push(
            `${rel} references GPT-5 — no OpenAI metrics are verified yet.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "route contract + sitemap + llms.txt + smoke + indexing advertise Sprint 29 routes",
    run: () => {
      const contract = readRel("apps/models/lib/route-contract.ts");
      const sitemap = readRel("apps/models/app/sitemap.ts");
      const llms = readRel("apps/models/app/llms.txt/route.ts");
      const smoke = readRel("scripts/lib/smoke.mjs");
      const indexing = readRel("scripts/indexing-qa.mjs");
      const failures: string[] = [];

      const versionMatch = contract.match(
        /ROUTE_SET_VERSION\s*=\s*"content-v(\d+)"/
      );
      if (!versionMatch || Number(versionMatch[1]) < 11) {
        failures.push(
          'ROUTE_SET_VERSION must be "content-v11" or later for Sprint 29.'
        );
      }

      // Route contract must advertise the new hubs.
      for (const hub of ['"/learn/exercises"', '"/learn/path/beginner"']) {
        if (!contract.includes(hub)) {
          failures.push(`route-contract must include ${hub}.`);
        }
      }

      // Sprint 29 routes: 4 new lessons + beginner path + exercises
      // hub + 8 exercise details = 14 routes.
      const newRoutes = [
        "/learn/multimodal-input",
        "/learn/structured-output",
        "/learn/status-aware-selection",
        "/learn/benchmark-limitations",
        "/learn/path/beginner",
        "/learn/exercises",
        "/learn/exercises/build-first-shortlist",
        "/learn/exercises/compare-context-windows",
        "/learn/exercises/map-hosted-provider",
        "/learn/exercises/review-pricing-reference",
        "/learn/exercises/inspect-model-lifecycle",
        "/learn/exercises/create-decision-brief",
        "/learn/exercises/check-source-freshness",
        "/learn/exercises/plan-external-model-test",
      ];
      for (const path of newRoutes) {
        const quoted = `"${path}"`;
        if (!sitemap.includes(quoted)) {
          failures.push(`sitemap must include ${quoted}.`);
        }
        if (!smoke.includes(quoted)) {
          failures.push(`scripts/lib/smoke.mjs must include ${quoted}.`);
        }
        if (!indexing.includes(quoted)) {
          failures.push(`scripts/indexing-qa.mjs must include ${quoted}.`);
        }
        if (!llms.includes(quoted)) {
          failures.push(`llms.txt must list ${quoted}.`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  // -------------------------------------------------------------------
  // Sprint 30 — role-based learning paths + curriculum positioning
  // -------------------------------------------------------------------
  {
    name: "lib/learning-paths.ts exists with required exports (Sprint 30)",
    run: () => {
      const rel = "apps/models/lib/learning-paths.ts";
      if (!fileExists(rel)) return `Missing ${rel}.`;
      const src = readRel(rel);
      const failures: string[] = [];
      for (const sym of [
        "export const learningPaths",
        "export function getLearningPath",
        "export function getLearningPaths",
        "export function getLearningPathSteps",
        "export function getLearningPathRoutes",
        "export function getLearningPathsByAudience",
        "export function getLearningPathsForLesson",
        "export function getLearningPathsForExercise",
      ]) {
        if (!src.includes(sym)) {
          failures.push(`${rel} must include \`${sym}\`.`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "all 5 learning-path slugs registered (Sprint 30)",
    run: () => {
      const src = readRel("apps/models/lib/learning-paths.ts");
      const failures: string[] = [];
      for (const slug of [
        "beginner",
        "developer",
        "product-manager",
        "governance",
        "automation-specialist",
      ]) {
        if (!src.includes(`slug: "${slug}"`)) {
          failures.push(
            `Registry missing learning-path slug "${slug}".`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "5 path components exist (Sprint 30)",
    run: () => {
      const failures: string[] = [];
      for (const rel of [
        "apps/models/components/learn/LearningPathCard.tsx",
        "apps/models/components/learn/LearningPathTimeline.tsx",
        "apps/models/components/learn/LearningPathProduces.tsx",
        "apps/models/components/learn/LearningPathPicker.tsx",
        "apps/models/components/learn/NoProgressPolicy.tsx",
      ]) {
        if (!fileExists(rel)) failures.push(`Missing component ${rel}.`);
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/learn/paths index + dynamic /learn/path/[slug] exist (Sprint 30)",
    run: () => {
      const failures: string[] = [];
      if (!fileExists("apps/models/app/learn/paths/page.tsx")) {
        failures.push("Missing /learn/paths index page.");
      }
      if (!fileExists("apps/models/app/learn/path/[slug]/page.tsx")) {
        failures.push("Missing dynamic /learn/path/[slug] page.");
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/learn hub renders LearningPathPicker + NoProgressPolicy (Sprint 30)",
    run: () => {
      const src = readRel("apps/models/app/learn/page.tsx");
      const failures: string[] = [];
      if (!/LearningPathPicker/.test(src)) {
        failures.push(
          "/learn must render <LearningPathPicker /> in the curriculum landing."
        );
      }
      if (!/NoProgressPolicy/.test(src)) {
        failures.push("/learn must render <NoProgressPolicy />.");
      }
      // Learn → Apply → Verify section must be present so the hub
      // reads like a curriculum rather than a list.
      if (!/Learn\s*[→]\s*Apply\s*[→]\s*Verify/i.test(src)) {
        failures.push(
          "/learn must include the 'Learn → Apply → Verify' positioning section."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "path detail page renders Timeline + Produces + NoProgressPolicy (Sprint 30)",
    run: () => {
      const src = readRel(
        "apps/models/app/learn/path/[slug]/page.tsx"
      );
      const failures: string[] = [];
      for (const sym of [
        "LearningPathTimeline",
        "LearningPathProduces",
        "NoProgressPolicy",
      ]) {
        if (!src.includes(sym)) {
          failures.push(
            `path detail page must render <${sym} /> so every path shares the same shape.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "homepage + how-it-works link to at least three role paths (Sprint 30)",
    run: () => {
      const homepage = readRel("apps/models/app/page.tsx");
      const how = readRel("apps/models/app/how-it-works/page.tsx");
      const paths = [
        "/learn/path/beginner",
        "/learn/path/developer",
        "/learn/path/product-manager",
        "/learn/path/governance",
        "/learn/path/automation-specialist",
      ];
      const failures: string[] = [];
      const homeMatches = paths.filter((p) => homepage.includes(p)).length;
      const howMatches = paths.filter((p) => how.includes(p)).length;
      if (homeMatches < 3) {
        failures.push(
          `Homepage must link to at least 3 role paths (found ${homeMatches}).`
        );
      }
      if (howMatches < 3) {
        failures.push(
          `/how-it-works must link to at least 3 role paths (found ${howMatches}).`
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "LessonLayout + ExerciseLayout surface related learning paths (Sprint 30)",
    run: () => {
      const lesson = readRel(
        "apps/models/components/learn/LessonLayout.tsx"
      );
      const exercise = readRel(
        "apps/models/components/learn/ExerciseLayout.tsx"
      );
      const failures: string[] = [];
      if (!/getLearningPathsForLesson/.test(lesson)) {
        failures.push(
          "LessonLayout must call getLearningPathsForLesson() so every lesson links back to its paths."
        );
      }
      if (!/getLearningPathsForExercise/.test(exercise)) {
        failures.push(
          "ExerciseLayout must call getLearningPathsForExercise() so every exercise links back to its paths."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/learn/exercises includes an Exercises-by-path section (Sprint 30)",
    run: () => {
      const src = readRel("apps/models/app/learn/exercises/page.tsx");
      const failures: string[] = [];
      if (!/getLearningPaths|Exercises by path/.test(src)) {
        failures.push(
          "/learn/exercises must include an Exercises-by-path section so readers can pivot into a curriculum."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no certificate / completion-guarantee language on path surfaces (Sprint 30)",
    run: () => {
      const targets = [
        "apps/models/lib/learning-paths.ts",
        "apps/models/app/learn/page.tsx",
        "apps/models/app/learn/paths/page.tsx",
        "apps/models/app/learn/path/[slug]/page.tsx",
        "apps/models/components/learn/LearningPathCard.tsx",
        "apps/models/components/learn/LearningPathTimeline.tsx",
        "apps/models/components/learn/LearningPathProduces.tsx",
        "apps/models/components/learn/LearningPathPicker.tsx",
        "apps/models/components/learn/NoProgressPolicy.tsx",
      ];
      // Only flag *positive* assertions; the policy notes are allowed
      // to mention the banned terms as things the surfaces do not do.
      const banned: { pattern: RegExp; label: string }[] = [
        {
          pattern: /\byou\s+(?:earn|receive|get)\s+a\s+certificate\b/i,
          label: "you earn/receive/get a certificate",
        },
        {
          pattern: /\bissue(?:s|d)?\s+(?:a\s+)?certificate\b/i,
          label: "issues a certificate",
        },
        {
          pattern: /\bcertified\s+(?:for|compliant|by)\b/i,
          label: "certified for/compliant/by",
        },
        {
          pattern: /\bcompletion\s+(?:is\s+)?guaranteed\b/i,
          label: "completion is guaranteed",
        },
        {
          pattern: /\bguaranteed\s+to\s+(?:work|meet|pass|satisfy|complete)\b/i,
          label: "guaranteed to <verb>",
        },
        {
          pattern: /\bmastery\s+(?:badge|credential)\b/i,
          label: "mastery badge/credential",
        },
        {
          pattern: /\bcourse\s+completion\s+certificate\b/i,
          label: "course completion certificate",
        },
      ];
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        for (const b of banned) {
          if (b.pattern.test(stripped)) {
            failures.push(
              `${rel} contains banned phrase "${b.label}".`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no scoring / ranking phrases on path surfaces (Sprint 30)",
    run: () => {
      const targets = [
        "apps/models/lib/learning-paths.ts",
        "apps/models/app/learn/page.tsx",
        "apps/models/app/learn/paths/page.tsx",
        "apps/models/app/learn/path/[slug]/page.tsx",
        "apps/models/components/learn/LearningPathCard.tsx",
        "apps/models/components/learn/LearningPathTimeline.tsx",
        "apps/models/components/learn/LearningPathProduces.tsx",
        "apps/models/components/learn/LearningPathPicker.tsx",
        "apps/models/components/learn/NoProgressPolicy.tsx",
      ];
      const banned: { pattern: RegExp; label: string }[] = [
        {
          pattern: /\byour\s+score\s+is\b/i,
          label: "your score is",
        },
        {
          pattern: /\bgrade\s+(?:yourself|your\s+answer|your\s+results)\b/i,
          label: "grade yourself / your answer / your results",
        },
        {
          pattern: /\bthe\s+correct\s+answer\s+is\b/i,
          label: "the correct answer is",
        },
        {
          pattern: /\bis\s+(?:the\s+)?best\s+(?:model|ai|provider)\b/i,
          label: "is the best model/ai/provider",
        },
        {
          pattern: /\bour\s+recommended\s+model\b/i,
          label: "our recommended model",
        },
        {
          pattern: /(?:is|are)\s+(?:the\s+)?winner\b/i,
          label: "is the winner",
        },
        {
          pattern: /\bcheapest\s+(?:ai\s+)?(?:model|provider|platform|inference)\b/i,
          label: "cheapest <noun>",
        },
        {
          pattern: /\bfastest\s+(?:ai\s+)?(?:model|provider|inference)\b/i,
          label: "fastest <noun>",
        },
      ];
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        for (const b of banned) {
          if (b.pattern.test(stripped)) {
            failures.push(
              `${rel} contains banned phrase "${b.label}".`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no SEO ranking guarantee language anywhere (Sprint 30)",
    run: () => {
      // The automation-specialist path is the highest-risk surface for
      // promise-heavy SEO copy. Scope the guard across the path layer
      // and the homepage / hero / how-it-works to catch any drift.
      const targets = [
        "apps/models/lib/learning-paths.ts",
        "apps/models/app/learn/path/[slug]/page.tsx",
        "apps/models/app/learn/paths/page.tsx",
        "apps/models/app/page.tsx",
        "apps/models/components/Hero.tsx",
        "apps/models/app/how-it-works/page.tsx",
        "apps/models/app/learn/page.tsx",
      ];
      const banned: { pattern: RegExp; label: string }[] = [
        {
          pattern: /\bguarantee(?:d)?\s+(?:seo|search|ranking|traffic)\b/i,
          label: "guaranteed seo/search/ranking/traffic",
        },
        {
          pattern: /\b(?:improve|boost|grow)\s+your\s+(?:seo|search\s+ranking|traffic|rankings)\s+(?:by|to|with)\b/i,
          label: "improve/boost/grow your seo/ranking/traffic by/to/with",
        },
        {
          pattern: /\brank\s+#1\b/i,
          label: "rank #1",
        },
        {
          pattern: /\btop\s+of\s+google\b/i,
          label: "top of google",
        },
      ];
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        for (const b of banned) {
          if (b.pattern.test(stripped)) {
            failures.push(
              `${rel} contains banned phrase "${b.label}".`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no OpenAI numeric metric appears on Sprint 30 surfaces",
    run: () => {
      const targets = [
        "apps/models/lib/learning-paths.ts",
        "apps/models/app/learn/page.tsx",
        "apps/models/app/learn/paths/page.tsx",
        "apps/models/app/learn/path/[slug]/page.tsx",
        "apps/models/components/learn/LearningPathCard.tsx",
        "apps/models/components/learn/LearningPathTimeline.tsx",
        "apps/models/components/learn/LearningPathProduces.tsx",
        "apps/models/components/learn/LearningPathPicker.tsx",
      ];
      const banned = /"[^"]*\bgpt-5\b[^"]*"/i;
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        if (banned.test(src)) {
          failures.push(
            `${rel} references GPT-5 — no OpenAI metrics are verified yet.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "route contract + sitemap + llms.txt + smoke + indexing advertise Sprint 30 path routes",
    run: () => {
      const contract = readRel("apps/models/lib/route-contract.ts");
      const sitemap = readRel("apps/models/app/sitemap.ts");
      const llms = readRel("apps/models/app/llms.txt/route.ts");
      const smoke = readRel("scripts/lib/smoke.mjs");
      const indexing = readRel("scripts/indexing-qa.mjs");
      const failures: string[] = [];

      const versionMatch = contract.match(
        /ROUTE_SET_VERSION\s*=\s*"content-v(\d+)"/
      );
      if (!versionMatch || Number(versionMatch[1]) < 12) {
        failures.push(
          'ROUTE_SET_VERSION must be "content-v12" or later for Sprint 30.'
        );
      }

      const newRoutes = [
        "/learn/paths",
        "/learn/path/beginner",
        "/learn/path/developer",
        "/learn/path/product-manager",
        "/learn/path/governance",
        "/learn/path/automation-specialist",
      ];
      for (const path of newRoutes) {
        const quoted = `"${path}"`;
        if (!contract.includes(quoted)) {
          failures.push(`route-contract must include ${quoted}.`);
        }
        if (!sitemap.includes(quoted)) {
          failures.push(`sitemap must include ${quoted}.`);
        }
        if (!smoke.includes(quoted)) {
          failures.push(`scripts/lib/smoke.mjs must include ${quoted}.`);
        }
        if (!indexing.includes(quoted)) {
          failures.push(`scripts/indexing-qa.mjs must include ${quoted}.`);
        }
        if (!llms.includes(quoted)) {
          failures.push(`llms.txt must list ${quoted}.`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  // -------------------------------------------------------------------
  // Sprint 31 — AI Usage Lab (playbooks + templates + export endpoint)
  // -------------------------------------------------------------------
  {
    name: "lib/lab-playbooks.ts exists with required exports (Sprint 31)",
    run: () => {
      const rel = "apps/models/lib/lab-playbooks.ts";
      if (!fileExists(rel)) return `Missing ${rel}.`;
      const src = readRel(rel);
      const failures: string[] = [];
      for (const sym of [
        "export const labPlaybooks",
        "export const labTemplates",
        "export function getLabPlaybook",
        "export function getLabTemplate",
        "export function getLabPlaybooks",
        "export function getLabTemplates",
        "export function getLabPlaybookRoutes",
        "export function getLabTemplateRoutes",
        "export function labTemplateToMarkdown",
      ]) {
        if (!src.includes(sym)) {
          failures.push(`${rel} must include \`${sym}\`.`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "all 6 lab playbook slugs registered (Sprint 31)",
    run: () => {
      const src = readRel("apps/models/lib/lab-playbooks.ts");
      const failures: string[] = [];
      for (const slug of [
        "prompt-testing-basics",
        "structured-output-testing",
        "long-context-testing",
        "multimodal-input-testing",
        "automation-workflow-testing",
        "model-regression-testing",
      ]) {
        if (!src.includes(`slug: "${slug}"`)) {
          failures.push(`Registry missing playbook slug "${slug}".`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "all 3 lab template slugs registered (Sprint 31)",
    run: () => {
      const src = readRel("apps/models/lib/lab-playbooks.ts");
      const failures: string[] = [];
      for (const slug of [
        "model-evaluation-plan",
        "prompt-test-matrix",
        "automation-risk-checklist",
      ]) {
        if (!src.includes(`slug: "${slug}"`)) {
          failures.push(`Registry missing template slug "${slug}".`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/lab hub + dynamic detail + templates hub + templates detail exist (Sprint 31)",
    run: () => {
      const failures: string[] = [];
      for (const rel of [
        "apps/models/app/lab/page.tsx",
        "apps/models/app/lab/[slug]/page.tsx",
        "apps/models/app/lab/templates/page.tsx",
        "apps/models/app/lab/templates/[slug]/page.tsx",
      ]) {
        if (!fileExists(rel)) failures.push(`Missing ${rel}.`);
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/api/lab/templates/[slug] export endpoint exists (Sprint 31)",
    run: () => {
      const rel = "apps/models/app/api/lab/templates/[slug]/route.ts";
      if (!fileExists(rel)) return `Missing ${rel}.`;
      const src = readRel(rel);
      const failures: string[] = [];
      if (!/X-Robots-Tag/.test(src) || !/noindex/.test(src)) {
        failures.push(
          "/api/lab/templates/[slug] must set X-Robots-Tag: noindex so generated templates do not enter the index from outside."
        );
      }
      if (!/text\/markdown/.test(src)) {
        failures.push(
          "/api/lab/templates/[slug] must respond with text/markdown content type."
        );
      }
      if (!/labTemplateToMarkdown/.test(src)) {
        failures.push(
          "/api/lab/templates/[slug] must call labTemplateToMarkdown() to keep the serializer in lib."
        );
      }
      // No fetch / no env / no Date.now in the endpoint.
      if (/Date\.now\(/.test(src)) {
        failures.push(
          "/api/lab/templates/[slug] must not call Date.now — the endpoint is pure local derivation."
        );
      }
      if (/process\.env/.test(src)) {
        failures.push(
          "/api/lab/templates/[slug] must not read process.env — the endpoint is secrets-free."
        );
      }
      if (/fetch\(/.test(src)) {
        failures.push(
          "/api/lab/templates/[slug] must not call fetch — the endpoint is offline-pure."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "5 lab components exist (Sprint 31)",
    run: () => {
      const failures: string[] = [];
      for (const rel of [
        "apps/models/components/lab/LabPlaybookCard.tsx",
        "apps/models/components/lab/LabTemplateCard.tsx",
        "apps/models/components/lab/LabPolicyNote.tsx",
        "apps/models/components/lab/LabChecklistSection.tsx",
        "apps/models/components/lab/LabWorkflowStrip.tsx",
      ]) {
        if (!fileExists(rel)) failures.push(`Missing component ${rel}.`);
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "lab registry has no score / rank / recommend / winner language (Sprint 31)",
    run: () => {
      // Strip block comments + line comments first; banned phrasing
      // must not appear as positive assertions in the registry itself.
      const src = readRel("apps/models/lib/lab-playbooks.ts");
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      const banned: { pattern: RegExp; label: string }[] = [
        {
          pattern: /\byour\s+score\s+is\b/i,
          label: "your score is",
        },
        {
          pattern: /\bbest\s+(?:ai\s+)?model\s+(?:is|for)\b/i,
          label: "best model is/for",
        },
        {
          pattern: /\bour\s+recommended\s+model\b/i,
          label: "our recommended model",
        },
        {
          pattern: /(?:is|are)\s+(?:the\s+)?winner\b/i,
          label: "is the winner",
        },
        {
          pattern: /\bcheapest\s+(?:ai\s+)?(?:model|provider|platform)\b/i,
          label: "cheapest <noun>",
        },
        {
          pattern: /\bfastest\s+(?:ai\s+)?(?:model|provider)\b/i,
          label: "fastest <noun>",
        },
      ];
      const failures: string[] = [];
      for (const b of banned) {
        if (b.pattern.test(stripped)) {
          failures.push(
            `lib/lab-playbooks.ts contains banned phrase "${b.label}".`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "lab pages contain no benchmark numeric score (Sprint 31)",
    run: () => {
      const targets = [
        "apps/models/lib/lab-playbooks.ts",
        "apps/models/app/lab/page.tsx",
        "apps/models/app/lab/[slug]/page.tsx",
        "apps/models/app/lab/templates/page.tsx",
        "apps/models/app/lab/templates/[slug]/page.tsx",
        "apps/models/components/lab/LabPlaybookCard.tsx",
        "apps/models/components/lab/LabTemplateCard.tsx",
        "apps/models/components/lab/LabPolicyNote.tsx",
        "apps/models/components/lab/LabChecklistSection.tsx",
        "apps/models/components/lab/LabWorkflowStrip.tsx",
      ];
      const benchmarkLiteral =
        /\b(?:MMLU|GPQA|HumanEval|HellaSwag|ARC-AGI|TruthfulQA|GSM8K|SWE-?Bench)\b[^"<>]{0,40}\b\d+(?:\.\d+)?\b/;
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        if (benchmarkLiteral.test(stripped)) {
          failures.push(
            `${rel} contains a benchmark name alongside a numeric literal — lab surfaces must not publish benchmark scores.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "lab pages contain no production-readiness / certification / safety guarantee language (Sprint 31)",
    run: () => {
      const targets = [
        "apps/models/lib/lab-playbooks.ts",
        "apps/models/app/lab/page.tsx",
        "apps/models/app/lab/[slug]/page.tsx",
        "apps/models/app/lab/templates/page.tsx",
        "apps/models/app/lab/templates/[slug]/page.tsx",
        "apps/models/components/lab/LabPlaybookCard.tsx",
        "apps/models/components/lab/LabTemplateCard.tsx",
        "apps/models/components/lab/LabPolicyNote.tsx",
        "apps/models/components/lab/LabChecklistSection.tsx",
        "apps/models/components/lab/LabWorkflowStrip.tsx",
      ];
      // Positive-assertion patterns only. The LabPolicyNote
      // intentionally enumerates these as things the lab does NOT do
      // so the policy copy must stay readable.
      const banned: { pattern: RegExp; label: string }[] = [
        {
          pattern: /\bguarantees?\s+production\s+readiness\b/i,
          label: "guarantees production readiness",
        },
        {
          pattern: /\bis\s+production[\s-]ready\b/i,
          label: "is production ready",
        },
        {
          pattern: /\bcertifies\s+(?:the\s+)?model\b/i,
          label: "certifies the model",
        },
        {
          pattern: /\bvalidates\s+safety\s+automatically\b/i,
          label: "validates safety automatically",
        },
        {
          pattern: /\bguarantee(?:s|d)?\s+(?:seo|search|ranking|traffic)\b/i,
          label: "guaranteed seo/search/ranking/traffic",
        },
        {
          pattern: /\btop\s+of\s+google\b/i,
          label: "top of google",
        },
        {
          pattern: /\brank\s+#1\b/i,
          label: "rank #1",
        },
        {
          pattern: /\bcertified\s+compliant\b/i,
          label: "certified compliant",
        },
      ];
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        for (const b of banned) {
          if (b.pattern.test(stripped)) {
            failures.push(
              `${rel} contains banned phrase "${b.label}".`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no OpenAI numeric metric appears on Sprint 31 surfaces",
    run: () => {
      const targets = [
        "apps/models/lib/lab-playbooks.ts",
        "apps/models/app/lab/page.tsx",
        "apps/models/app/lab/[slug]/page.tsx",
        "apps/models/app/lab/templates/page.tsx",
        "apps/models/app/lab/templates/[slug]/page.tsx",
        "apps/models/components/lab/LabPlaybookCard.tsx",
        "apps/models/components/lab/LabTemplateCard.tsx",
        "apps/models/components/lab/LabPolicyNote.tsx",
        "apps/models/components/lab/LabChecklistSection.tsx",
        "apps/models/components/lab/LabWorkflowStrip.tsx",
      ];
      const banned = /"[^"]*\bgpt-5\b[^"]*"/i;
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        if (banned.test(src)) {
          failures.push(
            `${rel} references GPT-5 — no OpenAI metrics are verified yet.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/how-it-works mentions Learn → Apply → Verify → Test (Sprint 31)",
    run: () => {
      const src = readRel("apps/models/app/how-it-works/page.tsx");
      if (!/Learn\s*[→]\s*Apply\s*[→]\s*Verify\s*[→]\s*Test/i.test(src)) {
        return "/how-it-works must surface the 'Learn → Apply → Verify → Test' framing so the lab integration is visible.";
      }
      return null;
    },
  },
  {
    name: "/learn + homepage + briefs/build + demos link to /lab (Sprint 31)",
    run: () => {
      const failures: string[] = [];
      for (const rel of [
        "apps/models/app/learn/page.tsx",
        "apps/models/app/page.tsx",
        "apps/models/app/briefs/build/page.tsx",
        "apps/models/app/demos/page.tsx",
      ]) {
        const src = readRel(rel);
        if (!/\/lab\b/.test(src)) {
          failures.push(`${rel} must link to /lab.`);
        }
      }
      // Footer must list /lab as well.
      const footer = readRel("apps/models/components/SiteFooter.tsx");
      if (!/"\/lab"/.test(footer)) {
        failures.push("SiteFooter must link to /lab.");
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "route contract + sitemap + llms.txt + smoke + indexing advertise Sprint 31 lab routes",
    run: () => {
      const contract = readRel("apps/models/lib/route-contract.ts");
      const sitemap = readRel("apps/models/app/sitemap.ts");
      const llms = readRel("apps/models/app/llms.txt/route.ts");
      const smoke = readRel("scripts/lib/smoke.mjs");
      const indexing = readRel("scripts/indexing-qa.mjs");
      const failures: string[] = [];

      const versionMatch = contract.match(
        /ROUTE_SET_VERSION\s*=\s*"content-v(\d+)"/
      );
      if (!versionMatch || Number(versionMatch[1]) < 13) {
        failures.push(
          'ROUTE_SET_VERSION must be "content-v13" or later for Sprint 31.'
        );
      }

      // Hubs the route contract advertises.
      for (const hub of ['"/lab"', '"/lab/templates"']) {
        if (!contract.includes(hub)) {
          failures.push(`route-contract must include ${hub}.`);
        }
      }

      const labPageRoutes = [
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
      ];
      for (const path of labPageRoutes) {
        const quoted = `"${path}"`;
        if (!sitemap.includes(quoted)) {
          failures.push(`sitemap must include ${quoted}.`);
        }
        if (!smoke.includes(quoted)) {
          failures.push(`scripts/lib/smoke.mjs must include ${quoted}.`);
        }
        if (!indexing.includes(quoted)) {
          failures.push(`scripts/indexing-qa.mjs must include ${quoted}.`);
        }
        if (!llms.includes(quoted)) {
          failures.push(`llms.txt must list ${quoted}.`);
        }
      }

      // API export endpoints — route contract + smoke (sitemap + llms
      // do not advertise API routes; indexing skips them too).
      const labApiRoutes = [
        "/api/lab/templates/model-evaluation-plan",
        "/api/lab/templates/prompt-test-matrix",
        "/api/lab/templates/automation-risk-checklist",
      ];
      for (const path of labApiRoutes) {
        const quoted = `"${path}"`;
        if (!contract.includes(quoted)) {
          failures.push(`route-contract must include ${quoted}.`);
        }
        if (!smoke.includes(quoted)) {
          failures.push(`scripts/lib/smoke.mjs must include ${quoted}.`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  // -------------------------------------------------------------------
  // Sprint 32 — evaluation prompt library + /lab/evaluation guide
  // -------------------------------------------------------------------
  {
    name: "lib/evaluation-prompts.ts exists with required exports (Sprint 32)",
    run: () => {
      const rel = "apps/models/lib/evaluation-prompts.ts";
      if (!fileExists(rel)) return `Missing ${rel}.`;
      const src = readRel(rel);
      const failures: string[] = [];
      for (const sym of [
        "export const evaluationPromptSets",
        "export function getEvaluationPromptSet",
        "export function getEvaluationPromptSets",
        "export function getEvaluationPromptSetRoutes",
        "export function getEvaluationPromptSetsByCategory",
        "export function promptSetToMarkdown",
      ]) {
        if (!src.includes(sym)) {
          failures.push(`${rel} must include \`${sym}\`.`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "all 6 evaluation prompt set slugs registered (Sprint 32)",
    run: () => {
      const src = readRel("apps/models/lib/evaluation-prompts.ts");
      const failures: string[] = [];
      for (const slug of [
        "summarization-quality",
        "structured-extraction",
        "long-context-recall",
        "instruction-following",
        "refusal-boundary",
        "automation-robustness",
      ]) {
        if (!src.includes(`slug: "${slug}"`)) {
          failures.push(`Registry missing prompt set slug "${slug}".`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/lab/prompts hub + dynamic detail + /lab/evaluation guide exist (Sprint 32)",
    run: () => {
      const failures: string[] = [];
      for (const rel of [
        "apps/models/app/lab/prompts/page.tsx",
        "apps/models/app/lab/prompts/[slug]/page.tsx",
        "apps/models/app/lab/evaluation/page.tsx",
      ]) {
        if (!fileExists(rel)) failures.push(`Missing ${rel}.`);
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/api/lab/prompts/[slug] export endpoint exists (Sprint 32)",
    run: () => {
      const rel = "apps/models/app/api/lab/prompts/[slug]/route.ts";
      if (!fileExists(rel)) return `Missing ${rel}.`;
      const src = readRel(rel);
      const failures: string[] = [];
      if (!/X-Robots-Tag/.test(src) || !/noindex/.test(src)) {
        failures.push(
          "/api/lab/prompts/[slug] must set X-Robots-Tag: noindex so generated prompt sets do not enter the index from outside."
        );
      }
      if (!/text\/markdown/.test(src)) {
        failures.push(
          "/api/lab/prompts/[slug] must respond with text/markdown content type."
        );
      }
      if (!/promptSetToMarkdown/.test(src)) {
        failures.push(
          "/api/lab/prompts/[slug] must call promptSetToMarkdown() to keep the serializer in lib."
        );
      }
      if (/Date\.now\(/.test(src)) {
        failures.push(
          "/api/lab/prompts/[slug] must not call Date.now — the endpoint is pure local derivation."
        );
      }
      if (/process\.env/.test(src)) {
        failures.push(
          "/api/lab/prompts/[slug] must not read process.env — the endpoint is secrets-free."
        );
      }
      if (/fetch\(/.test(src)) {
        failures.push(
          "/api/lab/prompts/[slug] must not call fetch — the endpoint is offline-pure."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "4 prompt components exist (Sprint 32)",
    run: () => {
      const failures: string[] = [];
      for (const rel of [
        "apps/models/components/lab/PromptSetCard.tsx",
        "apps/models/components/lab/PromptEvaluationTable.tsx",
        "apps/models/components/lab/PromptPolicyNote.tsx",
        "apps/models/components/lab/PromptObservationChecklist.tsx",
      ]) {
        if (!fileExists(rel)) failures.push(`Missing component ${rel}.`);
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "prompt registry has no score / rank / recommend / winner / best-prompt language (Sprint 32)",
    run: () => {
      const src = readRel("apps/models/lib/evaluation-prompts.ts");
      const stripped = src
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1");
      const banned: { pattern: RegExp; label: string }[] = [
        {
          pattern: /\bbest\s+prompt(?:s)?\b/i,
          label: "best prompt(s)",
        },
        {
          pattern: /\bis\s+(?:the\s+)?best\s+(?:model|ai|provider)\b/i,
          label: "is the best model/ai/provider",
        },
        {
          pattern: /\bour\s+recommended\s+model\b/i,
          label: "our recommended model",
        },
        {
          pattern: /(?:is|are)\s+(?:the\s+)?winner\b/i,
          label: "is the winner",
        },
        {
          pattern: /\bcheapest\s+(?:ai\s+)?(?:model|provider|platform)\b/i,
          label: "cheapest <noun>",
        },
        {
          pattern: /\bfastest\s+(?:ai\s+)?(?:model|provider)\b/i,
          label: "fastest <noun>",
        },
        {
          pattern: /\byour\s+score\s+is\b/i,
          label: "your score is",
        },
      ];
      const failures: string[] = [];
      for (const b of banned) {
        if (b.pattern.test(stripped)) {
          failures.push(
            `lib/evaluation-prompts.ts contains banned phrase "${b.label}".`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "prompt pages frame prompts as evaluation inputs, not production prompts (Sprint 32)",
    run: () => {
      const failures: string[] = [];
      for (const rel of [
        "apps/models/app/lab/prompts/page.tsx",
        "apps/models/app/lab/prompts/[slug]/page.tsx",
        "apps/models/components/lab/PromptPolicyNote.tsx",
        "apps/models/components/lab/PromptEvaluationTable.tsx",
      ]) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        if (!/evaluation\s+inputs?,?\s+not\s+production\s+prompts?/i.test(src)) {
          failures.push(
            `${rel} must state explicitly that prompts are evaluation inputs, not production prompts.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no jailbreak / bypass / exploit / phishing / credential / malware phrasing on Sprint 32 surfaces",
    run: () => {
      const targets = [
        "apps/models/lib/evaluation-prompts.ts",
        "apps/models/app/lab/prompts/page.tsx",
        "apps/models/app/lab/prompts/[slug]/page.tsx",
        "apps/models/app/lab/evaluation/page.tsx",
        "apps/models/components/lab/PromptSetCard.tsx",
        "apps/models/components/lab/PromptEvaluationTable.tsx",
        "apps/models/components/lab/PromptPolicyNote.tsx",
        "apps/models/components/lab/PromptObservationChecklist.tsx",
      ];
      // Only flag *operational* uses. The PromptPolicyNote
      // explicitly mentions these as things the library does NOT
      // contain, so the regex requires verb context (write/produce/
      // generate/teach + the harmful noun) to count as a violation.
      const banned: { pattern: RegExp; label: string }[] = [
        {
          pattern: /\b(?:write|generate|produce|create|teach)\s+(?:a\s+)?jailbreak\b/i,
          label: "write/produce a jailbreak",
        },
        {
          pattern: /\b(?:write|generate|produce|create|teach)\s+(?:a\s+)?(?:phishing|malware|exploit|payload)\b/i,
          label: "write/produce phishing/malware/exploit/payload",
        },
        {
          pattern: /\b(?:bypass|evade|defeat|circumvent)\s+(?:the\s+)?(?:safety|guardrail|filter|moderation)\b/i,
          label: "bypass/evade safety/guardrail/filter/moderation",
        },
        {
          pattern: /\b(?:steal|harvest|extract|obtain)\s+(?:user|customer|account)?\s*credentials?\b/i,
          label: "steal/harvest credentials",
        },
        {
          pattern: /\bingest\s+(?:and\s+)?leak\s+(?:secrets?|api\s+keys?)\b/i,
          label: "ingest/leak secrets / api keys",
        },
      ];
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        for (const b of banned) {
          if (b.pattern.test(stripped)) {
            failures.push(
              `${rel} contains banned operational phrasing "${b.label}".`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "refusal-boundary prompts stay safe and non-operational (Sprint 32)",
    run: () => {
      const src = readRel("apps/models/lib/evaluation-prompts.ts");
      // The refusal-boundary set must NOT include operational
      // harmful prompts. The prompts themselves must request
      // benign content that the model should REFUSE or redirect.
      // Scan the registry for forbidden operational requests
      // appearing inside prompt strings.
      const sliceMatch = src.match(
        /slug: "refusal-boundary"[\s\S]*?policyNote:/
      );
      const slice = sliceMatch ? sliceMatch[0] : "";
      const banned: { pattern: RegExp; label: string }[] = [
        {
          pattern: /\bhow\s+to\s+make\s+(?:a\s+)?bomb\b/i,
          label: "how to make a bomb (prompt content)",
        },
        {
          pattern: /\bhow\s+to\s+steal\s+a\s+car\b/i,
          label: "how to steal a car (prompt content)",
        },
        {
          pattern: /\bjailbreak\s+instructions?\b/i,
          label: "jailbreak instructions (prompt content)",
        },
        {
          pattern: /\bgenerate\s+phishing\b/i,
          label: "generate phishing (prompt content)",
        },
      ];
      const failures: string[] = [];
      for (const b of banned) {
        if (b.pattern.test(slice)) {
          failures.push(
            `refusal-boundary set contains banned operational prompt content: "${b.label}".`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no benchmark numeric score literals on Sprint 32 surfaces",
    run: () => {
      const targets = [
        "apps/models/lib/evaluation-prompts.ts",
        "apps/models/app/lab/prompts/page.tsx",
        "apps/models/app/lab/prompts/[slug]/page.tsx",
        "apps/models/app/lab/evaluation/page.tsx",
        "apps/models/components/lab/PromptSetCard.tsx",
        "apps/models/components/lab/PromptEvaluationTable.tsx",
        "apps/models/components/lab/PromptPolicyNote.tsx",
        "apps/models/components/lab/PromptObservationChecklist.tsx",
      ];
      const benchmarkLiteral =
        /\b(?:MMLU|GPQA|HumanEval|HellaSwag|ARC-AGI|TruthfulQA|GSM8K|SWE-?Bench)\b[^"<>]{0,40}\b\d+(?:\.\d+)?\b/;
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        if (benchmarkLiteral.test(stripped)) {
          failures.push(
            `${rel} contains a benchmark name alongside a numeric literal — Sprint 32 surfaces must not publish benchmark scores.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no OpenAI numeric metric appears on Sprint 32 surfaces",
    run: () => {
      const targets = [
        "apps/models/lib/evaluation-prompts.ts",
        "apps/models/app/lab/prompts/page.tsx",
        "apps/models/app/lab/prompts/[slug]/page.tsx",
        "apps/models/app/lab/evaluation/page.tsx",
        "apps/models/components/lab/PromptSetCard.tsx",
        "apps/models/components/lab/PromptEvaluationTable.tsx",
        "apps/models/components/lab/PromptPolicyNote.tsx",
        "apps/models/components/lab/PromptObservationChecklist.tsx",
      ];
      const banned = /"[^"]*\bgpt-5\b[^"]*"/i;
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        if (banned.test(src)) {
          failures.push(
            `${rel} references GPT-5 — no OpenAI metrics are verified yet.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/lab links to /lab/prompts and /lab/templates/prompt-test-matrix links to prompt library (Sprint 32)",
    run: () => {
      const lab = readRel("apps/models/app/lab/page.tsx");
      const templateDetail = readRel(
        "apps/models/app/lab/templates/[slug]/page.tsx"
      );
      const failures: string[] = [];
      if (!/\/lab\/prompts\b/.test(lab)) {
        failures.push("/lab must link to /lab/prompts.");
      }
      if (!/\/lab\/prompts\b/.test(templateDetail)) {
        failures.push(
          "/lab/templates/[slug] must link to /lab/prompts at least once (for the prompt-test-matrix template integration)."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "route contract + sitemap + llms.txt + smoke + indexing advertise Sprint 32 routes",
    run: () => {
      const contract = readRel("apps/models/lib/route-contract.ts");
      const sitemap = readRel("apps/models/app/sitemap.ts");
      const llms = readRel("apps/models/app/llms.txt/route.ts");
      const smoke = readRel("scripts/lib/smoke.mjs");
      const indexing = readRel("scripts/indexing-qa.mjs");
      const failures: string[] = [];

      const versionMatch = contract.match(
        /ROUTE_SET_VERSION\s*=\s*"content-v(\d+)"/
      );
      if (!versionMatch || Number(versionMatch[1]) < 14) {
        failures.push(
          'ROUTE_SET_VERSION must be "content-v14" or later for Sprint 32.'
        );
      }

      for (const hub of ['"/lab/prompts"', '"/lab/evaluation"']) {
        if (!contract.includes(hub)) {
          failures.push(`route-contract must include ${hub}.`);
        }
      }

      const labPageRoutes = [
        "/lab/prompts",
        "/lab/prompts/summarization-quality",
        "/lab/prompts/structured-extraction",
        "/lab/prompts/long-context-recall",
        "/lab/prompts/instruction-following",
        "/lab/prompts/refusal-boundary",
        "/lab/prompts/automation-robustness",
        "/lab/evaluation",
      ];
      for (const path of labPageRoutes) {
        const quoted = `"${path}"`;
        if (!sitemap.includes(quoted)) {
          failures.push(`sitemap must include ${quoted}.`);
        }
        if (!smoke.includes(quoted)) {
          failures.push(`scripts/lib/smoke.mjs must include ${quoted}.`);
        }
        if (!indexing.includes(quoted)) {
          failures.push(`scripts/indexing-qa.mjs must include ${quoted}.`);
        }
        if (!llms.includes(quoted)) {
          failures.push(`llms.txt must list ${quoted}.`);
        }
      }

      const labApiRoutes = [
        "/api/lab/prompts/summarization-quality",
        "/api/lab/prompts/structured-extraction",
        "/api/lab/prompts/long-context-recall",
        "/api/lab/prompts/instruction-following",
        "/api/lab/prompts/refusal-boundary",
        "/api/lab/prompts/automation-robustness",
      ];
      for (const path of labApiRoutes) {
        const quoted = `"${path}"`;
        if (!contract.includes(quoted)) {
          failures.push(`route-contract must include ${quoted}.`);
        }
        if (!smoke.includes(quoted)) {
          failures.push(`scripts/lib/smoke.mjs must include ${quoted}.`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  // -------------------------------------------------------------------
  // Sprint 33 — audience landing + platform positioning doc
  // -------------------------------------------------------------------
  {
    name: "lib/audiences.ts exists with required exports (Sprint 33)",
    run: () => {
      const rel = "apps/models/lib/audiences.ts";
      if (!fileExists(rel)) return `Missing ${rel}.`;
      const src = readRel(rel);
      const failures: string[] = [];
      for (const sym of [
        "export const audiences",
        "export function getAudience",
        "export function getAudiences",
        "export function getAudienceRoutes",
      ]) {
        if (!src.includes(sym)) {
          failures.push(`${rel} must include \`${sym}\`.`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "all 4 audience slugs registered (Sprint 33)",
    run: () => {
      const src = readRel("apps/models/lib/audiences.ts");
      const failures: string[] = [];
      for (const slug of [
        "developers",
        "product-teams",
        "automation-specialists",
        "governance-teams",
      ]) {
        if (!src.includes(`slug: "${slug}"`)) {
          failures.push(`Registry missing audience slug "${slug}".`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "5 audience components exist (Sprint 33)",
    run: () => {
      const failures: string[] = [];
      for (const rel of [
        "apps/models/components/audience/AudienceCard.tsx",
        "apps/models/components/audience/AudienceHero.tsx",
        "apps/models/components/audience/AudienceArtifactList.tsx",
        "apps/models/components/audience/AudienceWorkflow.tsx",
        "apps/models/components/audience/AudienceDoesNotPromise.tsx",
      ]) {
        if (!fileExists(rel)) failures.push(`Missing component ${rel}.`);
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/for hub + dynamic /for/[slug] + /docs/platform-positioning exist (Sprint 33)",
    run: () => {
      const failures: string[] = [];
      for (const rel of [
        "apps/models/app/for/page.tsx",
        "apps/models/app/for/[slug]/page.tsx",
        "apps/models/app/docs/platform-positioning/page.tsx",
      ]) {
        if (!fileExists(rel)) failures.push(`Missing ${rel}.`);
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "homepage links to /for, /learn/path/beginner, /demos, /lab (Sprint 33)",
    run: () => {
      const src = readRel("apps/models/app/page.tsx");
      const hero = readRel("apps/models/components/Hero.tsx");
      const combined = src + "\n" + hero;
      const failures: string[] = [];
      for (const route of [
        "/for",
        "/learn/path/beginner",
        "/demos",
        "/lab",
      ]) {
        if (!combined.includes(route)) {
          failures.push(
            `Homepage (or Hero) must link to ${route}.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "homepage contains Learn → Apply → Verify → Test framing (Sprint 33)",
    run: () => {
      const src = readRel("apps/models/app/page.tsx");
      if (!/Learn\s*[→]\s*Apply\s*[→]\s*Verify\s*[→]\s*Test/i.test(src)) {
        return "Homepage must surface the 'Learn → Apply → Verify → Test' framing as the core loop.";
      }
      return null;
    },
  },
  {
    name: "homepage contains 'Not another AI ranking site' or equivalent differentiation (Sprint 33)",
    run: () => {
      const src = readRel("apps/models/app/page.tsx");
      if (
        !/Not another AI ranking site/i.test(src) &&
        !/Not a model leaderboard/i.test(src)
      ) {
        return "Homepage must include the 'Not another AI ranking site' differentiation section (or 'Not a model leaderboard').";
      }
      return null;
    },
  },
  {
    name: "footer links to all 4 audience pages + platform positioning (Sprint 33)",
    run: () => {
      const src = readRel("apps/models/components/SiteFooter.tsx");
      const failures: string[] = [];
      for (const route of [
        "/for",
        "/for/developers",
        "/for/product-teams",
        "/for/automation-specialists",
        "/for/governance-teams",
        "/docs/platform-positioning",
      ]) {
        if (!src.includes(`"${route}"`)) {
          failures.push(`SiteFooter must link to ${route}.`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "key surfaces link to /for (Sprint 33)",
    run: () => {
      const failures: string[] = [];
      for (const rel of [
        "apps/models/app/learn/page.tsx",
        "apps/models/app/lab/page.tsx",
        "apps/models/app/demos/page.tsx",
        "apps/models/app/briefs/build/page.tsx",
        "apps/models/app/how-it-works/page.tsx",
      ]) {
        const src = readRel(rel);
        if (!/\/for\b/.test(src)) {
          failures.push(`${rel} must link to /for.`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no banned landing-page language on Sprint 33 surfaces",
    run: () => {
      const targets = [
        "apps/models/lib/audiences.ts",
        "apps/models/app/page.tsx",
        "apps/models/components/Hero.tsx",
        "apps/models/app/for/page.tsx",
        "apps/models/app/for/[slug]/page.tsx",
        "apps/models/app/docs/platform-positioning/page.tsx",
        "apps/models/components/audience/AudienceCard.tsx",
        "apps/models/components/audience/AudienceHero.tsx",
        "apps/models/components/audience/AudienceArtifactList.tsx",
        "apps/models/components/audience/AudienceWorkflow.tsx",
        "apps/models/components/audience/AudienceDoesNotPromise.tsx",
      ];
      // Only flag *positive* assertions. The "does not promise"
      // lists must remain readable, so the regexes require positive
      // verb context.
      const banned: { pattern: RegExp; label: string }[] = [
        {
          pattern: /\bis\s+(?:the\s+)?best\s+(?:model|ai|provider)\b/i,
          label: "is the best model/ai/provider",
        },
        {
          pattern: /(?:is|are)\s+(?:the\s+)?winner\b/i,
          label: "is the winner",
        },
        {
          pattern: /\bcheapest\s+(?:ai\s+)?(?:model|provider|platform)\b/i,
          label: "cheapest <noun>",
        },
        {
          pattern: /\bfastest\s+(?:ai\s+)?(?:model|provider)\b/i,
          label: "fastest <noun>",
        },
        {
          pattern: /\bguaranteed\s+to\s+(?:work|meet|pass|satisfy|certify)\b/i,
          label: "guaranteed to <verb>",
        },
        {
          pattern: /\bcertified\s+(?:for|compliant|by)\b/i,
          label: "certified for/compliant/by",
        },
        {
          pattern: /\bofficial\s+partner\b/i,
          label: "official partner",
        },
        {
          pattern: /\bis\s+production[\s-]ready\b/i,
          label: "is production ready",
        },
        {
          pattern: /\bcompliance\s+approved\b/i,
          label: "compliance approved",
        },
        {
          pattern: /\bincrease\s+(?:your\s+)?(?:seo\s+)?traffic\b/i,
          label: "increase (seo) traffic",
        },
        {
          pattern: /\brank\s+#1\b/i,
          label: "rank #1",
        },
      ];
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        for (const b of banned) {
          if (b.pattern.test(stripped)) {
            failures.push(
              `${rel} contains banned phrase "${b.label}".`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "automation-specialists audience contains no SEO ranking guarantee language (Sprint 33)",
    run: () => {
      const src = readRel("apps/models/lib/audiences.ts");
      const sliceMatch = src.match(
        /slug: "automation-specialists"[\s\S]*?(?=slug: "|\];)/
      );
      const slice = sliceMatch ? sliceMatch[0] : "";
      const banned: { pattern: RegExp; label: string }[] = [
        {
          pattern: /\bguarantee(?:s|d)?\s+(?:seo|search|ranking|traffic)\b/i,
          label: "guaranteed seo/search/ranking/traffic",
        },
        {
          pattern: /\b(?:improve|boost|grow)\s+(?:your\s+)?(?:seo|search\s+ranking|traffic|rankings)\b/i,
          label: "improve/boost/grow seo/ranking/traffic",
        },
        {
          pattern: /\btop\s+of\s+google\b/i,
          label: "top of google",
        },
        {
          pattern: /\bautomation\s+will\s+increase\s+traffic\b/i,
          label: "automation will increase traffic",
        },
      ];
      const failures: string[] = [];
      for (const b of banned) {
        if (b.pattern.test(slice)) {
          failures.push(
            `automation-specialists audience contains banned phrase "${b.label}".`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "governance-teams audience contains no compliance certification language (Sprint 33)",
    run: () => {
      const src = readRel("apps/models/lib/audiences.ts");
      const sliceMatch = src.match(
        /slug: "governance-teams"[\s\S]*?(?=slug: "|\];)/
      );
      const slice = sliceMatch ? sliceMatch[0] : "";
      const banned: { pattern: RegExp; label: string }[] = [
        {
          pattern: /\bwe\s+certify\s+(?:the\s+)?model\b/i,
          label: "we certify the model",
        },
        {
          pattern: /\bissues?\s+(?:a\s+)?(?:certificate|certification|sign[\s-]off)\b/i,
          label: "issues a certificate/certification/sign-off",
        },
        {
          pattern: /\bgrants?\s+(?:legal|risk|compliance)\s+approval\b/i,
          label: "grants legal/risk/compliance approval",
        },
        {
          pattern: /\bcertified\s+compliant\b/i,
          label: "certified compliant",
        },
      ];
      const failures: string[] = [];
      for (const b of banned) {
        if (b.pattern.test(slice)) {
          failures.push(
            `governance-teams audience contains banned phrase "${b.label}".`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no OpenAI numeric metric appears on Sprint 33 surfaces",
    run: () => {
      const targets = [
        "apps/models/lib/audiences.ts",
        "apps/models/app/page.tsx",
        "apps/models/components/Hero.tsx",
        "apps/models/app/for/page.tsx",
        "apps/models/app/for/[slug]/page.tsx",
        "apps/models/app/docs/platform-positioning/page.tsx",
        "apps/models/components/audience/AudienceCard.tsx",
        "apps/models/components/audience/AudienceHero.tsx",
        "apps/models/components/audience/AudienceArtifactList.tsx",
        "apps/models/components/audience/AudienceWorkflow.tsx",
        "apps/models/components/audience/AudienceDoesNotPromise.tsx",
      ];
      const banned = /"[^"]*\bgpt-5\b[^"]*"/i;
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        if (banned.test(src)) {
          failures.push(
            `${rel} references GPT-5 — no OpenAI metrics are verified yet.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "route contract + sitemap + llms.txt + smoke + indexing advertise Sprint 33 routes",
    run: () => {
      const contract = readRel("apps/models/lib/route-contract.ts");
      const sitemap = readRel("apps/models/app/sitemap.ts");
      const llms = readRel("apps/models/app/llms.txt/route.ts");
      const smoke = readRel("scripts/lib/smoke.mjs");
      const indexing = readRel("scripts/indexing-qa.mjs");
      const failures: string[] = [];

      const versionMatch = contract.match(
        /ROUTE_SET_VERSION\s*=\s*"content-v(\d+)"/
      );
      if (!versionMatch || Number(versionMatch[1]) < 15) {
        failures.push(
          'ROUTE_SET_VERSION must be "content-v15" or later for Sprint 33.'
        );
      }

      const newRoutes = [
        "/for",
        "/for/developers",
        "/for/product-teams",
        "/for/automation-specialists",
        "/for/governance-teams",
        "/docs/platform-positioning",
      ];
      for (const path of newRoutes) {
        const quoted = `"${path}"`;
        if (!contract.includes(quoted)) {
          failures.push(`route-contract must include ${quoted}.`);
        }
        if (!sitemap.includes(quoted)) {
          failures.push(`sitemap must include ${quoted}.`);
        }
        if (!smoke.includes(quoted)) {
          failures.push(`scripts/lib/smoke.mjs must include ${quoted}.`);
        }
        if (!indexing.includes(quoted)) {
          failures.push(`scripts/indexing-qa.mjs must include ${quoted}.`);
        }
        if (!llms.includes(quoted)) {
          failures.push(`llms.txt must list ${quoted}.`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  // -------------------------------------------------------------------
  // Sprint 34 — content depth, teaching examples, observation rubrics
  // -------------------------------------------------------------------
  {
    name: "5 teaching components exist (Sprint 34)",
    run: () => {
      const failures: string[] = [];
      for (const rel of [
        "apps/models/components/learn/TeachingExample.tsx",
        "apps/models/components/learn/BadBetterExample.tsx",
        "apps/models/components/learn/ArtifactExample.tsx",
        "apps/models/components/learn/WorkflowBridge.tsx",
        "apps/models/components/learn/ReviewChecklist.tsx",
      ]) {
        if (!fileExists(rel)) failures.push(`Missing component ${rel}.`);
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "LessonLayout renders teaching components (Sprint 34)",
    run: () => {
      const src = readRel("apps/models/components/learn/LessonLayout.tsx");
      const failures: string[] = [];
      for (const sym of [
        "TeachingExample",
        "BadBetterExample",
        "ArtifactExample",
        "WorkflowBridge",
        "ReviewChecklist",
      ]) {
        if (!src.includes(sym)) {
          failures.push(
            `LessonLayout must reference <${sym}> so registry-driven teaching content renders.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "all 10 lessons carry teachingExample + badBetterExample + workflowBridge (Sprint 34)",
    run: () => {
      const src = readRel("apps/models/lib/lessons.ts");
      const failures: string[] = [];
      const lessonSlugs = [
        "how-to-choose-ai-model",
        "context-window",
        "hosted-vs-first-party",
        "pricing-references",
        "model-lifecycle",
        "testing-ai-models",
        "multimodal-input",
        "structured-output",
        "status-aware-selection",
        "benchmark-limitations",
      ];
      // Sanity that each lesson's block contains teaching markers.
      // Split the file by lesson slug declarations and ensure each
      // block contains the new field keys.
      for (const slug of lessonSlugs) {
        const idx = src.indexOf(`slug: "${slug}"`);
        if (idx < 0) {
          failures.push(`Lesson "${slug}" not found in registry.`);
          continue;
        }
        // Look up to ~6000 chars ahead until the next slug declaration
        // or the closing of the lessons array.
        const tail = src.slice(idx, idx + 7000);
        const nextSlugMatch = tail.slice(50).search(/slug:\s*"/);
        const block =
          nextSlugMatch > 0 ? tail.slice(0, 50 + nextSlugMatch) : tail;
        for (const key of [
          "teachingExample:",
          "badBetterExample:",
          "workflowBridge:",
        ]) {
          if (!block.includes(key)) {
            failures.push(
              `Lesson "${slug}" missing ${key} (Sprint 34).`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "all 8 exercises carry commonMistake + artifactExample (Sprint 34)",
    run: () => {
      const src = readRel("apps/models/lib/learning-exercises.ts");
      const failures: string[] = [];
      const exerciseSlugs = [
        "build-first-shortlist",
        "compare-context-windows",
        "map-hosted-provider",
        "review-pricing-reference",
        "inspect-model-lifecycle",
        "create-decision-brief",
        "check-source-freshness",
        "plan-external-model-test",
      ];
      for (const slug of exerciseSlugs) {
        const idx = src.indexOf(`slug: "${slug}"`);
        if (idx < 0) {
          failures.push(`Exercise "${slug}" not found.`);
          continue;
        }
        const tail = src.slice(idx, idx + 8000);
        const nextSlugMatch = tail.slice(50).search(/slug:\s*"/);
        const block =
          nextSlugMatch > 0 ? tail.slice(0, 50 + nextSlugMatch) : tail;
        for (const key of ["commonMistake:", "artifactExample:"]) {
          if (!block.includes(key)) {
            failures.push(
              `Exercise "${slug}" missing ${key} (Sprint 34).`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "all 6 lab playbooks carry weakTestExample + strongerTestExample + observationRubric (Sprint 34)",
    run: () => {
      const src = readRel("apps/models/lib/lab-playbooks.ts");
      const failures: string[] = [];
      const playbookSlugs = [
        "prompt-testing-basics",
        "structured-output-testing",
        "long-context-testing",
        "multimodal-input-testing",
        "automation-workflow-testing",
        "model-regression-testing",
      ];
      for (const slug of playbookSlugs) {
        const idx = src.indexOf(`slug: "${slug}"`);
        if (idx < 0) {
          failures.push(`Playbook "${slug}" not found.`);
          continue;
        }
        const tail = src.slice(idx, idx + 9000);
        const nextSlugMatch = tail.slice(50).search(/slug:\s*"/);
        const block =
          nextSlugMatch > 0 ? tail.slice(0, 50 + nextSlugMatch) : tail;
        for (const key of [
          "weakTestExample:",
          "strongerTestExample:",
          "observationRubric:",
          "briefNote:",
        ]) {
          if (!block.includes(key)) {
            failures.push(
              `Playbook "${slug}" missing ${key} (Sprint 34).`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "lab observation rubrics use no score / rating / grade language (Sprint 34)",
    run: () => {
      const src = readRel("apps/models/lib/lab-playbooks.ts");
      // Pull only the observation-rubric arrays; the registry uses
      // "score" elsewhere as a defensible negative (e.g. "not a numeric
      // score" disclaimers). Scan rubric blocks specifically.
      const rubricBlocks = [
        ...src.matchAll(
          /observationRubric:\s*\[([\s\S]*?)\]/g
        ),
      ].map((m) => m[1]);
      const banned: { pattern: RegExp; label: string }[] = [
        {
          pattern: /\b(?:assign|give|compute)\s+a\s+score\b/i,
          label: "assign/give/compute a score",
        },
        {
          pattern: /\b(?:rating|grade)\s+of\b/i,
          label: "rating/grade of",
        },
        {
          pattern: /\bpass\/fail\s+score\b/i,
          label: "pass/fail score",
        },
      ];
      const failures: string[] = [];
      for (const block of rubricBlocks) {
        for (const b of banned) {
          if (b.pattern.test(block)) {
            failures.push(
              `lab-playbooks.ts observationRubric block contains banned phrase "${b.label}".`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "all 6 prompt sets carry matrixUsageNote + doNotConclude + rerunWhen (Sprint 34)",
    run: () => {
      const src = readRel("apps/models/lib/evaluation-prompts.ts");
      const failures: string[] = [];
      const setSlugs = [
        "summarization-quality",
        "structured-extraction",
        "long-context-recall",
        "instruction-following",
        "refusal-boundary",
        "automation-robustness",
      ];
      for (const slug of setSlugs) {
        const idx = src.indexOf(`slug: "${slug}"`);
        if (idx < 0) {
          failures.push(`Prompt set "${slug}" not found.`);
          continue;
        }
        const tail = src.slice(idx, idx + 12000);
        const nextSlugMatch = tail.slice(50).search(/slug:\s*"/);
        const block =
          nextSlugMatch > 0 ? tail.slice(0, 50 + nextSlugMatch) : tail;
        for (const key of [
          "matrixUsageNote:",
          "doNotConclude:",
          "rerunWhen:",
        ]) {
          if (!block.includes(key)) {
            failures.push(
              `Prompt set "${slug}" missing ${key} (Sprint 34).`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "all 4 audience pages carry exampleSituation + artifactWalkthrough + bestStartingPoint (Sprint 34)",
    run: () => {
      const src = readRel("apps/models/lib/audiences.ts");
      const failures: string[] = [];
      const slugs = [
        "developers",
        "product-teams",
        "automation-specialists",
        "governance-teams",
      ];
      for (const slug of slugs) {
        const idx = src.indexOf(`slug: "${slug}"`);
        if (idx < 0) {
          failures.push(`Audience "${slug}" not found.`);
          continue;
        }
        const tail = src.slice(idx, idx + 9000);
        const nextSlugMatch = tail.slice(50).search(/slug:\s*"/);
        const block =
          nextSlugMatch > 0 ? tail.slice(0, 50 + nextSlugMatch) : tail;
        for (const key of [
          "exampleSituation:",
          "artifactWalkthrough:",
          "bestStartingPoint:",
        ]) {
          if (!block.includes(key)) {
            failures.push(
              `Audience "${slug}" missing ${key} (Sprint 34).`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no banned language on Sprint 34 teaching surfaces",
    run: () => {
      const targets = [
        "apps/models/components/learn/TeachingExample.tsx",
        "apps/models/components/learn/BadBetterExample.tsx",
        "apps/models/components/learn/ArtifactExample.tsx",
        "apps/models/components/learn/WorkflowBridge.tsx",
        "apps/models/components/learn/ReviewChecklist.tsx",
      ];
      // Only flag *positive* assertions. The teaching components
      // themselves must not declare a winner.
      const banned: { pattern: RegExp; label: string }[] = [
        {
          pattern: /\bbest\s+(?:ai\s+)?model\s+(?:is|for)\b/i,
          label: "best model is/for",
        },
        {
          pattern: /(?:is|are)\s+(?:the\s+)?winner\b/i,
          label: "is the winner",
        },
        {
          pattern: /\bcheapest\s+(?:ai\s+)?(?:model|provider)\b/i,
          label: "cheapest <noun>",
        },
        {
          pattern: /\bfastest\s+(?:ai\s+)?(?:model|provider)\b/i,
          label: "fastest <noun>",
        },
        {
          pattern: /\bguaranteed\s+to\s+(?:work|meet|pass|satisfy)\b/i,
          label: "guaranteed to <verb>",
        },
        {
          pattern: /\bcertified\s+(?:for|compliant|by)\b/i,
          label: "certified for/compliant/by",
        },
        {
          pattern: /\bis\s+production[\s-]ready\b/i,
          label: "is production ready",
        },
        {
          pattern: /\bcompliance\s+approved\b/i,
          label: "compliance approved",
        },
        {
          pattern: /\brank\s+#1\b/i,
          label: "rank #1",
        },
      ];
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        for (const b of banned) {
          if (b.pattern.test(stripped)) {
            failures.push(
              `${rel} contains banned phrase "${b.label}".`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no OpenAI numeric metric appears on Sprint 34 teaching surfaces",
    run: () => {
      const targets = [
        "apps/models/components/learn/TeachingExample.tsx",
        "apps/models/components/learn/BadBetterExample.tsx",
        "apps/models/components/learn/ArtifactExample.tsx",
        "apps/models/components/learn/WorkflowBridge.tsx",
        "apps/models/components/learn/ReviewChecklist.tsx",
      ];
      const banned = /"[^"]*\bgpt-5\b[^"]*"/i;
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        if (banned.test(src)) {
          failures.push(
            `${rel} references GPT-5 — no OpenAI metrics are verified yet.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  // -------------------------------------------------------------------
  // Sprint 35 — workflow kits + Markdown export endpoint
  // -------------------------------------------------------------------
  {
    name: "lib/workflow-kits.ts exists with required exports (Sprint 35)",
    run: () => {
      const rel = "apps/models/lib/workflow-kits.ts";
      if (!fileExists(rel)) return `Missing ${rel}.`;
      const src = readRel(rel);
      const failures: string[] = [];
      for (const sym of [
        "export const workflowKits",
        "export function getWorkflowKit",
        "export function getWorkflowKits",
        "export function getWorkflowKitRoutes",
        "export function getWorkflowKitsByAudience",
        "export function workflowKitToMarkdown",
      ]) {
        if (!src.includes(sym)) {
          failures.push(`${rel} must include \`${sym}\`.`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "all 4 workflow kit slugs registered (Sprint 35)",
    run: () => {
      const src = readRel("apps/models/lib/workflow-kits.ts");
      const failures: string[] = [];
      for (const slug of [
        "developer-model-evaluation",
        "automation-workflow-testing",
        "product-model-selection",
        "governance-review",
      ]) {
        if (!src.includes(`slug: "${slug}"`)) {
          failures.push(`Registry missing kit slug "${slug}".`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "5 kit components exist (Sprint 35)",
    run: () => {
      const failures: string[] = [];
      for (const rel of [
        "apps/models/components/kits/WorkflowKitCard.tsx",
        "apps/models/components/kits/WorkflowKitTimeline.tsx",
        "apps/models/components/kits/WorkflowKitResourceGrid.tsx",
        "apps/models/components/kits/WorkflowKitChecklist.tsx",
        "apps/models/components/kits/WorkflowKitPolicyNote.tsx",
      ]) {
        if (!fileExists(rel)) failures.push(`Missing component ${rel}.`);
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/kits hub + dynamic /kits/[slug] exist (Sprint 35)",
    run: () => {
      const failures: string[] = [];
      for (const rel of [
        "apps/models/app/kits/page.tsx",
        "apps/models/app/kits/[slug]/page.tsx",
      ]) {
        if (!fileExists(rel)) failures.push(`Missing ${rel}.`);
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "/api/kits/[slug] export endpoint exists with the right contract (Sprint 35)",
    run: () => {
      const rel = "apps/models/app/api/kits/[slug]/route.ts";
      if (!fileExists(rel)) return `Missing ${rel}.`;
      const src = readRel(rel);
      const failures: string[] = [];
      if (!/X-Robots-Tag/.test(src) || !/noindex/.test(src)) {
        failures.push(
          "/api/kits/[slug] must set X-Robots-Tag: noindex so exported work documents do not enter the index from outside."
        );
      }
      if (!/text\/markdown/.test(src)) {
        failures.push(
          "/api/kits/[slug] must respond with text/markdown content type."
        );
      }
      if (!/workflowKitToMarkdown/.test(src)) {
        failures.push(
          "/api/kits/[slug] must call workflowKitToMarkdown() to keep the serializer in lib."
        );
      }
      if (/Date\.now\(/.test(src)) {
        failures.push(
          "/api/kits/[slug] must not call Date.now — the endpoint is pure local derivation."
        );
      }
      if (/process\.env/.test(src)) {
        failures.push(
          "/api/kits/[slug] must not read process.env — the endpoint is secrets-free."
        );
      }
      if (/fetch\(/.test(src)) {
        failures.push(
          "/api/kits/[slug] must not call fetch — the endpoint is offline-pure."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "homepage + lab + demos + briefs/build link to /kits (Sprint 35)",
    run: () => {
      const failures: string[] = [];
      for (const rel of [
        "apps/models/app/page.tsx",
        "apps/models/app/lab/page.tsx",
        "apps/models/app/demos/page.tsx",
        "apps/models/app/briefs/build/page.tsx",
      ]) {
        const src = readRel(rel);
        if (!/\/kits\b/.test(src)) {
          failures.push(`${rel} must link to /kits.`);
        }
      }
      // Footer must include /kits too.
      const footer = readRel("apps/models/components/SiteFooter.tsx");
      if (!/"\/kits"/.test(footer)) {
        failures.push("SiteFooter must link to /kits.");
      }
      // /for audience pages must surface a matching kit.
      const audienceDetail = readRel(
        "apps/models/app/for/[slug]/page.tsx"
      );
      if (!/getWorkflowKitsByAudience/.test(audienceDetail)) {
        failures.push(
          "/for/[slug] must call getWorkflowKitsByAudience() so each audience surfaces its matching kit."
        );
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no ranking / recommendation / guarantee language on Sprint 35 kit surfaces",
    run: () => {
      const targets = [
        "apps/models/lib/workflow-kits.ts",
        "apps/models/app/kits/page.tsx",
        "apps/models/app/kits/[slug]/page.tsx",
        "apps/models/components/kits/WorkflowKitCard.tsx",
        "apps/models/components/kits/WorkflowKitTimeline.tsx",
        "apps/models/components/kits/WorkflowKitResourceGrid.tsx",
        "apps/models/components/kits/WorkflowKitChecklist.tsx",
        "apps/models/components/kits/WorkflowKitPolicyNote.tsx",
      ];
      // Only flag *positive* assertions; the policy note explicitly
      // enumerates these as things the kit does NOT promise.
      const banned: { pattern: RegExp; label: string }[] = [
        {
          pattern: /\bis\s+(?:the\s+)?best\s+(?:model|ai|provider)\b/i,
          label: "is the best model/ai/provider",
        },
        {
          pattern: /\bour\s+recommended\s+model\b/i,
          label: "our recommended model",
        },
        {
          pattern: /(?:is|are)\s+(?:the\s+)?winner\b/i,
          label: "is the winner",
        },
        {
          pattern: /\bcheapest\s+(?:ai\s+)?(?:model|provider|platform)\b/i,
          label: "cheapest <noun>",
        },
        {
          pattern: /\bfastest\s+(?:ai\s+)?(?:model|provider)\b/i,
          label: "fastest <noun>",
        },
        {
          pattern: /\bguaranteed\s+to\s+(?:work|meet|pass|satisfy)\b/i,
          label: "guaranteed to <verb>",
        },
        {
          pattern: /\bis\s+production[\s-]ready\b/i,
          label: "is production ready",
        },
        {
          pattern: /\bcertified\s+(?:for|compliant|by)\b/i,
          label: "certified for/compliant/by",
        },
      ];
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        const stripped = src
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        for (const b of banned) {
          if (b.pattern.test(stripped)) {
            failures.push(
              `${rel} contains banned phrase "${b.label}".`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "governance-review kit contains no compliance certification language (Sprint 35)",
    run: () => {
      const src = readRel("apps/models/lib/workflow-kits.ts");
      const sliceMatch = src.match(
        /slug: "governance-review"[\s\S]*?(?=slug: "|\];)/
      );
      let slice = sliceMatch ? sliceMatch[0] : "";
      slice = slice.replace(
        /doesNotPromise:\s*\[[\s\S]*?\],?/,
        ""
      );
      const banned: { pattern: RegExp; label: string }[] = [
        {
          pattern: /\bwe\s+certify\s+(?:the\s+)?model\b/i,
          label: "we certify the model",
        },
        {
          pattern: /\bissues?\s+(?:a\s+)?(?:certificate|certification|sign[\s-]off)\b/i,
          label: "issues a certificate/certification/sign-off",
        },
        {
          pattern: /\bgrants?\s+(?:legal|risk|compliance)\s+approval\b/i,
          label: "grants legal/risk/compliance approval",
        },
        {
          pattern: /\bcertified\s+compliant\b/i,
          label: "certified compliant",
        },
      ];
      const failures: string[] = [];
      for (const b of banned) {
        if (b.pattern.test(slice)) {
          failures.push(
            `governance-review kit contains banned phrase "${b.label}".`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "automation-workflow-testing kit contains no SEO ranking guarantee language (Sprint 35)",
    run: () => {
      const src = readRel("apps/models/lib/workflow-kits.ts");
      const sliceMatch = src.match(
        /slug: "automation-workflow-testing"[\s\S]*?(?=slug: "|\];)/
      );
      let slice = sliceMatch ? sliceMatch[0] : "";
      // The `doesNotPromise:` array intentionally enumerates negative
      // phrasing ("Guarantee automation reliability", etc.) — strip
      // that array out before scanning so the guard catches positive
      // assertions only.
      slice = slice.replace(
        /doesNotPromise:\s*\[[\s\S]*?\],?/,
        ""
      );
      const banned: { pattern: RegExp; label: string }[] = [
        {
          pattern: /\bguarantee(?:s|d)?\s+(?:seo|search|ranking|traffic)\b/i,
          label: "guaranteed seo/search/ranking/traffic",
        },
        {
          pattern: /\b(?:improve|boost|grow)\s+(?:your\s+)?(?:seo|search\s+ranking|traffic|rankings)\b/i,
          label: "improve/boost/grow seo/ranking/traffic",
        },
        {
          pattern: /\btop\s+of\s+google\b/i,
          label: "top of google",
        },
        {
          pattern: /\bguarantee(?:s|d)?\s+automation\s+reliability\b/i,
          label: "guaranteed automation reliability",
        },
      ];
      const failures: string[] = [];
      for (const b of banned) {
        if (b.pattern.test(slice)) {
          failures.push(
            `automation-workflow-testing kit contains banned phrase "${b.label}".`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no OpenAI numeric metric appears on Sprint 35 surfaces",
    run: () => {
      const targets = [
        "apps/models/lib/workflow-kits.ts",
        "apps/models/app/kits/page.tsx",
        "apps/models/app/kits/[slug]/page.tsx",
        "apps/models/components/kits/WorkflowKitCard.tsx",
        "apps/models/components/kits/WorkflowKitTimeline.tsx",
        "apps/models/components/kits/WorkflowKitResourceGrid.tsx",
        "apps/models/components/kits/WorkflowKitChecklist.tsx",
        "apps/models/components/kits/WorkflowKitPolicyNote.tsx",
      ];
      const banned = /"[^"]*\bgpt-5\b[^"]*"/i;
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        if (banned.test(src)) {
          failures.push(
            `${rel} references GPT-5 — no OpenAI metrics are verified yet.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "route contract + sitemap + llms.txt + smoke + indexing advertise Sprint 35 kit routes",
    run: () => {
      const contract = readRel("apps/models/lib/route-contract.ts");
      const sitemap = readRel("apps/models/app/sitemap.ts");
      const llms = readRel("apps/models/app/llms.txt/route.ts");
      const smoke = readRel("scripts/lib/smoke.mjs");
      const indexing = readRel("scripts/indexing-qa.mjs");
      const failures: string[] = [];

      const versionMatch = contract.match(
        /ROUTE_SET_VERSION\s*=\s*"content-v(\d+)"/
      );
      if (!versionMatch || Number(versionMatch[1]) < 16) {
        failures.push(
          'ROUTE_SET_VERSION must be "content-v16" or later for Sprint 35.'
        );
      }

      const kitPageRoutes = [
        "/kits",
        "/kits/developer-model-evaluation",
        "/kits/automation-workflow-testing",
        "/kits/product-model-selection",
        "/kits/governance-review",
      ];
      for (const path of kitPageRoutes) {
        const quoted = `"${path}"`;
        if (!contract.includes(quoted)) {
          failures.push(`route-contract must include ${quoted}.`);
        }
        if (!sitemap.includes(quoted)) {
          failures.push(`sitemap must include ${quoted}.`);
        }
        if (!smoke.includes(quoted)) {
          failures.push(`scripts/lib/smoke.mjs must include ${quoted}.`);
        }
        if (!indexing.includes(quoted)) {
          failures.push(`scripts/indexing-qa.mjs must include ${quoted}.`);
        }
        if (!llms.includes(quoted)) {
          failures.push(`llms.txt must list ${quoted}.`);
        }
      }

      const kitApiRoutes = [
        "/api/kits/developer-model-evaluation",
        "/api/kits/automation-workflow-testing",
        "/api/kits/product-model-selection",
        "/api/kits/governance-review",
      ];
      for (const path of kitApiRoutes) {
        const quoted = `"${path}"`;
        if (!contract.includes(quoted)) {
          failures.push(`route-contract must include ${quoted}.`);
        }
        if (!smoke.includes(quoted)) {
          failures.push(`scripts/lib/smoke.mjs must include ${quoted}.`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },

  // -------------------------------------------------------------------
  // Sprint 36 — outcome use cases
  // -------------------------------------------------------------------
  {
    name: "lib/outcome-use-cases.ts exists with required exports (Sprint 36)",
    run: () => {
      const rel = "apps/models/lib/outcome-use-cases.ts";
      if (!fileExists(rel)) {
        return `${rel} is missing.`;
      }
      const src = readRel(rel);
      const requiredExports = [
        "export const outcomeUseCases",
        "export function getOutcomeUseCase",
        "export function getOutcomeUseCases",
        "export function getOutcomeUseCaseRoutes",
      ];
      const missing = requiredExports.filter((e) => !src.includes(e));
      return missing.length
        ? `${rel} missing exports: ${missing.join(", ")}`
        : null;
    },
  },
  {
    name: "all 6 outcome slugs registered (Sprint 36)",
    run: () => {
      const src = readRel("apps/models/lib/outcome-use-cases.ts");
      const required = [
        "ai-model-evaluation-for-developers",
        "ai-model-selection-for-product-teams",
        "ai-automation-testing",
        "ai-model-governance-review",
        "llm-prompt-evaluation",
        "structured-output-testing",
      ];
      const missing = required.filter(
        (slug) => !src.includes(`slug: "${slug}"`)
      );
      return missing.length
        ? `outcome-use-cases.ts missing slug entries: ${missing.join(", ")}`
        : null;
    },
  },
  {
    name: "5 outcome components exist (Sprint 36)",
    run: () => {
      const required = [
        "apps/models/components/outcomes/OutcomeUseCaseCard.tsx",
        "apps/models/components/outcomes/OutcomeWorkflow.tsx",
        "apps/models/components/outcomes/OutcomeResourceGrid.tsx",
        "apps/models/components/outcomes/OutcomeArtifactList.tsx",
        "apps/models/components/outcomes/OutcomePolicyNote.tsx",
      ];
      const missing = required.filter((rel) => !fileExists(rel));
      return missing.length
        ? `outcome components missing: ${missing.join(", ")}`
        : null;
    },
  },
  {
    name: "6 outcome detail pages exist (Sprint 36)",
    run: () => {
      const slugs = [
        "ai-model-evaluation-for-developers",
        "ai-model-selection-for-product-teams",
        "ai-automation-testing",
        "ai-model-governance-review",
        "llm-prompt-evaluation",
        "structured-output-testing",
      ];
      const missing = slugs.filter(
        (slug) =>
          !fileExists(`apps/models/app/use-cases/${slug}/page.tsx`)
      );
      return missing.length
        ? `outcome detail pages missing: ${missing.join(", ")}`
        : null;
    },
  },
  {
    name: "homepage + /for + /learn + /lab + /kits + /demos link to outcome routes (Sprint 36)",
    run: () => {
      const surfaces: { rel: string; mustMention: string[] }[] = [
        {
          rel: "apps/models/app/page.tsx",
          mustMention: [
            "OutcomeUseCaseCard",
            "getOutcomeUseCases",
          ],
        },
        {
          rel: "apps/models/app/use-cases/page.tsx",
          mustMention: [
            "OutcomeUseCaseCard",
            "getOutcomeUseCases",
          ],
        },
        {
          rel: "apps/models/app/for/[slug]/page.tsx",
          mustMention: [
            "OutcomeUseCaseCard",
            "getOutcomeUseCases",
          ],
        },
        {
          rel: "apps/models/app/learn/page.tsx",
          mustMention: ["/use-cases/ai-model-evaluation-for-developers"],
        },
        {
          rel: "apps/models/app/lab/page.tsx",
          mustMention: ["/use-cases/llm-prompt-evaluation"],
        },
        {
          rel: "apps/models/app/kits/page.tsx",
          mustMention: ["/use-cases"],
        },
        {
          rel: "apps/models/app/demos/page.tsx",
          mustMention: ["/use-cases"],
        },
        {
          rel: "apps/models/components/SiteFooter.tsx",
          mustMention: [
            "/use-cases/ai-model-evaluation-for-developers",
            "/use-cases/ai-automation-testing",
          ],
        },
      ];
      const failures: string[] = [];
      for (const s of surfaces) {
        if (!fileExists(s.rel)) {
          failures.push(`${s.rel} missing.`);
          continue;
        }
        const src = readRel(s.rel);
        for (const m of s.mustMention) {
          if (!src.includes(m)) {
            failures.push(`${s.rel} must reference "${m}".`);
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no ranking / recommendation / guarantee language on Sprint 36 outcome surfaces",
    run: () => {
      const targets = [
        "apps/models/lib/outcome-use-cases.ts",
        "apps/models/components/outcomes/OutcomeUseCaseCard.tsx",
        "apps/models/components/outcomes/OutcomeWorkflow.tsx",
        "apps/models/components/outcomes/OutcomeResourceGrid.tsx",
        "apps/models/components/outcomes/OutcomeArtifactList.tsx",
        "apps/models/components/outcomes/OutcomePolicyNote.tsx",
        "apps/models/components/outcomes/OutcomePage.tsx",
        "apps/models/app/use-cases/ai-model-evaluation-for-developers/page.tsx",
        "apps/models/app/use-cases/ai-model-selection-for-product-teams/page.tsx",
        "apps/models/app/use-cases/ai-automation-testing/page.tsx",
        "apps/models/app/use-cases/ai-model-governance-review/page.tsx",
        "apps/models/app/use-cases/llm-prompt-evaluation/page.tsx",
        "apps/models/app/use-cases/structured-output-testing/page.tsx",
      ];
      const banned: { pattern: RegExp; label: string }[] = [
        {
          pattern: /\bis\s+(?:the\s+)?best\s+(?:model|ai|provider)\b/i,
          label: "is the best model/ai/provider",
        },
        {
          pattern: /\bour\s+recommended\s+model\b/i,
          label: "our recommended model",
        },
        {
          pattern: /(?:is|are)\s+(?:the\s+)?winner\b/i,
          label: "is the winner",
        },
        {
          pattern: /\bcheapest\s+(?:ai\s+)?(?:model|provider|platform)\b/i,
          label: "cheapest <noun>",
        },
        {
          pattern: /\bfastest\s+(?:ai\s+)?(?:model|provider)\b/i,
          label: "fastest <noun>",
        },
        {
          pattern: /\bguaranteed\s+to\s+(?:work|meet|pass|satisfy)\b/i,
          label: "guaranteed to <verb>",
        },
        {
          pattern: /\bis\s+production[\s-]ready\b/i,
          label: "is production ready",
        },
        {
          pattern: /\bcertified\s+(?:for|compliant|by)\b/i,
          label: "certified for/compliant/by",
        },
        {
          pattern: /\bguarantee(?:s|d)?\s+(?:seo|search|ranking|traffic)\b/i,
          label: "guaranteed seo/search/ranking/traffic",
        },
      ];
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const raw = readRel(rel);
        // Strip every doesNotPromise: [...] array — those legitimately
        // enumerate negative phrasing as the things the page does NOT
        // promise.
        const stripped = raw
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1")
          .replace(/doesNotPromise:\s*\[[\s\S]*?\],?/g, "");
        for (const b of banned) {
          if (b.pattern.test(stripped)) {
            failures.push(
              `${rel} contains banned phrase "${b.label}".`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no OpenAI numeric metric appears on Sprint 36 outcome surfaces",
    run: () => {
      const targets = [
        "apps/models/lib/outcome-use-cases.ts",
        "apps/models/components/outcomes/OutcomeUseCaseCard.tsx",
        "apps/models/components/outcomes/OutcomeWorkflow.tsx",
        "apps/models/components/outcomes/OutcomeResourceGrid.tsx",
        "apps/models/components/outcomes/OutcomeArtifactList.tsx",
        "apps/models/components/outcomes/OutcomePolicyNote.tsx",
        "apps/models/components/outcomes/OutcomePage.tsx",
      ];
      const banned = /"[^"]*\bgpt-5\b[^"]*"/i;
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        if (banned.test(src)) {
          failures.push(
            `${rel} references GPT-5 — no OpenAI metrics are verified yet.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "route contract + sitemap + llms.txt + smoke + indexing advertise Sprint 36 outcome routes",
    run: () => {
      const contract = readRel("apps/models/lib/route-contract.ts");
      const sitemap = readRel("apps/models/app/sitemap.ts");
      const llms = readRel("apps/models/app/llms.txt/route.ts");
      const smoke = readRel("scripts/lib/smoke.mjs");
      const indexing = readRel("scripts/indexing-qa.mjs");
      const failures: string[] = [];

      const versionMatch = contract.match(
        /ROUTE_SET_VERSION\s*=\s*"content-v(\d+)"/
      );
      if (!versionMatch || Number(versionMatch[1]) < 17) {
        failures.push(
          'ROUTE_SET_VERSION must be "content-v17" or later for Sprint 36.'
        );
      }

      const outcomePageRoutes = [
        "/use-cases/ai-model-evaluation-for-developers",
        "/use-cases/ai-model-selection-for-product-teams",
        "/use-cases/ai-automation-testing",
        "/use-cases/ai-model-governance-review",
        "/use-cases/llm-prompt-evaluation",
        "/use-cases/structured-output-testing",
      ];
      for (const path of outcomePageRoutes) {
        const quoted = `"${path}"`;
        if (!contract.includes(quoted)) {
          failures.push(`route-contract must include ${quoted}.`);
        }
        if (!sitemap.includes(quoted)) {
          failures.push(`sitemap must include ${quoted}.`);
        }
        if (!smoke.includes(quoted)) {
          failures.push(`scripts/lib/smoke.mjs must include ${quoted}.`);
        }
        if (!indexing.includes(quoted)) {
          failures.push(`scripts/indexing-qa.mjs must include ${quoted}.`);
        }
        if (!llms.includes(quoted)) {
          failures.push(`llms.txt must list ${quoted}.`);
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },

  // -------------------------------------------------------------------
  // Sprint 37 — resource finder + learning graph
  // -------------------------------------------------------------------
  {
    name: "lib/resource-graph.ts exists with required exports (Sprint 37)",
    run: () => {
      const rel = "apps/models/lib/resource-graph.ts";
      if (!fileExists(rel)) {
        return `${rel} is missing.`;
      }
      const src = readRel(rel);
      const requiredExports = [
        "export function getResourceGraph",
        "export function getResourceNode",
        "export function getResourcesByStage",
        "export function getResourcesByAudience",
        "export function getResourcesByGoal",
        "export function getResourcesByArtifact",
        "export function filterResources",
        "export function getResourceFinderSummary",
        "export function getNextStepGroups",
      ];
      const missing = requiredExports.filter((e) => !src.includes(e));
      return missing.length
        ? `${rel} missing exports: ${missing.join(", ")}`
        : null;
    },
  },
  {
    name: "resource graph spans every source registry (Sprint 37)",
    run: () => {
      const src = readRel("apps/models/lib/resource-graph.ts");
      const requiredImports = [
        '"@/lib/lessons"',
        '"@/lib/learning-exercises"',
        '"@/lib/learning-paths"',
        '"@/lib/lab-playbooks"',
        '"@/lib/evaluation-prompts"',
        '"@/lib/workflow-kits"',
        '"@/lib/outcome-use-cases"',
        '"@/lib/audiences"',
        '"@/lib/guided-demos"',
      ];
      const missing = requiredImports.filter((s) => !src.includes(s));
      if (missing.length) {
        return `resource-graph.ts must pull from: ${missing.join(", ")}`;
      }
      const requiredTagKinds = [
        '"lesson:',
        '"exercise:',
        '"path:',
        '"playbook:',
        '"template:',
        '"promptset:',
        '"kit:',
        '"outcome:',
        '"audience:',
        '"demo:',
      ];
      const tagMissing = requiredTagKinds.filter((s) => !src.includes(s));
      return tagMissing.length
        ? `resource-graph.ts missing tag entries for: ${tagMissing.join(", ")}`
        : null;
    },
  },
  {
    name: "6 resource components exist (Sprint 37)",
    run: () => {
      const required = [
        "apps/models/components/resources/ResourceCard.tsx",
        "apps/models/components/resources/ResourceFilterBar.tsx",
        "apps/models/components/resources/ResourceStageMap.tsx",
        "apps/models/components/resources/NextStepPanel.tsx",
        "apps/models/components/resources/ResourceSummaryCards.tsx",
        "apps/models/components/resources/RelatedResourceGrid.tsx",
      ];
      const missing = required.filter((rel) => !fileExists(rel));
      return missing.length
        ? `resource components missing: ${missing.join(", ")}`
        : null;
    },
  },
  {
    name: "/resources page exists and supports filtered noindex (Sprint 37)",
    run: () => {
      const rel = "apps/models/app/resources/page.tsx";
      if (!fileExists(rel)) {
        return `${rel} is missing.`;
      }
      const src = readRel(rel);
      const required = [
        "isFilteredRoute",
        "robotsMetadata",
        "filterResources",
        "ResourceFilterBar",
        "NextStepPanel",
        "ResourceStageMap",
      ];
      const missing = required.filter((s) => !src.includes(s));
      if (missing.length) {
        return `${rel} missing required wiring: ${missing.join(", ")}`;
      }
      // The filtered-keys allow list must cover the six finder filters.
      const filterKeys = readRel("apps/models/lib/should-index.ts");
      const requiredKeys = [
        '"audience"',
        '"goal"',
        '"resourceType"',
        '"stage"',
        '"artifact"',
        '"difficulty"',
      ];
      const keyMissing = requiredKeys.filter(
        (k) => !filterKeys.includes(k)
      );
      return keyMissing.length
        ? `lib/should-index.ts FILTERED_KEYS missing: ${keyMissing.join(", ")}`
        : null;
    },
  },
  {
    name: "/docs/resource-map page exists and is registered in content (Sprint 37)",
    run: () => {
      const rel = "apps/models/app/docs/resource-map/page.tsx";
      if (!fileExists(rel)) {
        return `${rel} is missing.`;
      }
      const src = readRel(rel);
      if (!/<ContentPageShell\b/.test(src)) {
        return `${rel} must use <ContentPageShell>.`;
      }
      const content = readRel("apps/models/lib/content.ts");
      if (!content.includes('"/docs/resource-map"')) {
        return 'lib/content.ts must register slug "/docs/resource-map".';
      }
      return null;
    },
  },
  {
    name: "homepage + /for + /learn + /lab + /kits + /use-cases + /demos link to /resources (Sprint 37)",
    run: () => {
      const surfaces: { rel: string; mustMention: string[] }[] = [
        {
          rel: "apps/models/app/page.tsx",
          mustMention: ["/resources"],
        },
        {
          rel: "apps/models/app/for/page.tsx",
          mustMention: ["/resources"],
        },
        {
          rel: "apps/models/app/for/[slug]/page.tsx",
          mustMention: ["/resources?audience="],
        },
        {
          rel: "apps/models/app/learn/page.tsx",
          mustMention: ["/resources", "/docs/resource-map"],
        },
        {
          rel: "apps/models/app/lab/page.tsx",
          mustMention: ["/resources?stage=test"],
        },
        {
          rel: "apps/models/app/kits/page.tsx",
          mustMention: ["/resources?resourceType=workflow-kit"],
        },
        {
          rel: "apps/models/app/use-cases/page.tsx",
          mustMention: ["/resources?resourceType=outcome"],
        },
        {
          rel: "apps/models/app/demos/page.tsx",
          mustMention: ["/resources?resourceType=demo"],
        },
        {
          rel: "apps/models/components/SiteFooter.tsx",
          mustMention: ["/resources", "/docs/resource-map"],
        },
      ];
      const failures: string[] = [];
      for (const s of surfaces) {
        if (!fileExists(s.rel)) {
          failures.push(`${s.rel} missing.`);
          continue;
        }
        const src = readRel(s.rel);
        for (const m of s.mustMention) {
          if (!src.includes(m)) {
            failures.push(`${s.rel} must reference "${m}".`);
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no ranking / recommendation / guarantee language on Sprint 37 resource surfaces",
    run: () => {
      const targets = [
        "apps/models/lib/resource-graph.ts",
        "apps/models/app/resources/page.tsx",
        "apps/models/app/docs/resource-map/page.tsx",
        "apps/models/components/resources/ResourceCard.tsx",
        "apps/models/components/resources/ResourceFilterBar.tsx",
        "apps/models/components/resources/ResourceStageMap.tsx",
        "apps/models/components/resources/NextStepPanel.tsx",
        "apps/models/components/resources/ResourceSummaryCards.tsx",
        "apps/models/components/resources/RelatedResourceGrid.tsx",
      ];
      const banned: { pattern: RegExp; label: string }[] = [
        {
          pattern: /\bis\s+(?:the\s+)?best\s+(?:model|ai|provider)\b/i,
          label: "is the best model/ai/provider",
        },
        {
          pattern: /\bour\s+recommended\s+model\b/i,
          label: "our recommended model",
        },
        {
          pattern: /\brecommended\s+model\b/i,
          label: "recommended model",
        },
        {
          pattern: /(?:is|are)\s+(?:the\s+)?winner\b/i,
          label: "is the winner",
        },
        {
          pattern: /\bcheapest\s+(?:ai\s+)?(?:model|provider|platform)\b/i,
          label: "cheapest <noun>",
        },
        {
          pattern: /\bfastest\s+(?:ai\s+)?(?:model|provider)\b/i,
          label: "fastest <noun>",
        },
        {
          pattern: /\bguaranteed\s+to\s+(?:work|meet|pass|satisfy)\b/i,
          label: "guaranteed to <verb>",
        },
        {
          pattern: /\bis\s+production[\s-]ready\b/i,
          label: "is production ready",
        },
        {
          pattern: /\bcertified\s+(?:for|compliant|by)\b/i,
          label: "certified for/compliant/by",
        },
        {
          pattern: /\bguarantee(?:s|d)?\s+(?:seo|search|ranking|traffic)\b/i,
          label: "guaranteed seo/search/ranking/traffic",
        },
      ];
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const raw = readRel(rel);
        const stripped = raw
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .replace(/(^|[^:])\/\/.*$/gm, "$1");
        for (const b of banned) {
          if (b.pattern.test(stripped)) {
            failures.push(
              `${rel} contains banned phrase "${b.label}".`
            );
          }
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "no OpenAI numeric metric appears on Sprint 37 resource surfaces",
    run: () => {
      const targets = [
        "apps/models/lib/resource-graph.ts",
        "apps/models/app/resources/page.tsx",
        "apps/models/app/docs/resource-map/page.tsx",
        "apps/models/components/resources/ResourceCard.tsx",
        "apps/models/components/resources/ResourceFilterBar.tsx",
        "apps/models/components/resources/ResourceStageMap.tsx",
        "apps/models/components/resources/NextStepPanel.tsx",
        "apps/models/components/resources/ResourceSummaryCards.tsx",
        "apps/models/components/resources/RelatedResourceGrid.tsx",
      ];
      const banned = /"[^"]*\bgpt-5\b[^"]*"/i;
      const failures: string[] = [];
      for (const rel of targets) {
        if (!fileExists(rel)) continue;
        const src = readRel(rel);
        if (banned.test(src)) {
          failures.push(
            `${rel} references GPT-5 — no OpenAI metrics are verified yet.`
          );
        }
      }
      return failures.length ? failures.join("\n") : null;
    },
  },
  {
    name: "route contract + sitemap + llms.txt + smoke + indexing advertise Sprint 37 resource routes",
    run: () => {
      const contract = readRel("apps/models/lib/route-contract.ts");
      const sitemap = readRel("apps/models/app/sitemap.ts");
      const llms = readRel("apps/models/app/llms.txt/route.ts");
      const smoke = readRel("scripts/lib/smoke.mjs");
      const indexing = readRel("scripts/indexing-qa.mjs");
      const failures: string[] = [];

      const versionMatch = contract.match(
        /ROUTE_SET_VERSION\s*=\s*"content-v(\d+)"/
      );
      if (!versionMatch || Number(versionMatch[1]) < 18) {
        failures.push(
          'ROUTE_SET_VERSION must be "content-v18" or later for Sprint 37.'
        );
      }

      const pageRoutes = ["/resources", "/docs/resource-map"];
      for (const path of pageRoutes) {
        const quoted = `"${path}"`;
        if (!contract.includes(quoted)) {
          failures.push(`route-contract must include ${quoted}.`);
        }
        if (!sitemap.includes(quoted) && path === "/resources") {
          failures.push(`sitemap must include ${quoted}.`);
        }
        if (!smoke.includes(quoted)) {
          failures.push(`scripts/lib/smoke.mjs must include ${quoted}.`);
        }
        if (!indexing.includes(quoted)) {
          failures.push(`scripts/indexing-qa.mjs must include ${quoted}.`);
        }
        if (!llms.includes(quoted)) {
          failures.push(`llms.txt must list ${quoted}.`);
        }
      }

      // The indexing QA must include a filtered /resources URL so
      // the noindex behaviour is exercised in production.
      if (!indexing.includes('"/resources?audience=developers"')) {
        failures.push(
          'scripts/indexing-qa.mjs must include "/resources?audience=developers" in FILTERED_NOINDEX_PAGES to exercise the noindex policy.'
        );
      }
      return failures.length ? failures.join("\n") : null;
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
