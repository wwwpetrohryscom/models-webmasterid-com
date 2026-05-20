/**
 * Repository guard: blocks unauthorized occurrences of the canonical
 * unverified-data label (see UNVERIFIED_LABEL in apps/models/lib/verified.ts).
 *
 * Policy: the canonical label string may only appear in
 *   - apps/models/components/DataNotVerified.tsx (renderer)
 *   - apps/models/lib/verified.ts (canonical constant declaration)
 *   - README.md
 *   - VERIFICATION.md
 *   - tests that explicitly cover DataNotVerified
 *
 * Everywhere else (route pages, seed data, arbitrary components, llms.txt
 * copy, etc.) must go through the <DataNotVerified> component or the
 * UNVERIFIED_LABEL constant. This script enforces that contract.
 *
 * The phrase itself is assembled from parts at runtime so this file does
 * NOT match its own check, and therefore is NOT on the allow-list.
 *
 * Run with: npm run check:integrity
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = resolve(__filename, "..", "..");

// Assembled so this file does not match its own check.
const PHRASE = ["Data", "not", "yet", "verified."].join(" ");

const ALLOWED_PATTERNS: RegExp[] = [
  /^README\.md$/,
  /^VERIFICATION\.md$/,
  /^apps\/models\/components\/DataNotVerified\.tsx$/,
  /^apps\/models\/lib\/verified\.ts$/,
  // Future tests that explicitly cover the unverified-data label.
  /^.*\/DataNotVerified\.(test|spec)\.tsx?$/,
  /^.*\/data-not-verified\.(test|spec)\.tsx?$/,
];

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  ".vercel",
  ".turbo",
  "out",
  "dist",
  "build",
  "coverage",
]);

const SCAN_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".md",
  ".mdx",
  ".json",
  ".css",
  ".scss",
  ".html",
  ".txt",
]);

interface Violation {
  path: string;
  line: number;
  preview: string;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walk(full, out);
    } else if (st.isFile()) {
      const dot = entry.lastIndexOf(".");
      if (dot === -1) continue;
      const ext = entry.slice(dot).toLowerCase();
      if (SCAN_EXTENSIONS.has(ext)) out.push(full);
    }
  }
  return out;
}

function toRelPosix(p: string): string {
  return relative(ROOT, p).split(sep).join("/");
}

function isAllowed(relPath: string): boolean {
  return ALLOWED_PATTERNS.some((re) => re.test(relPath));
}

function main(): void {
  const files = walk(ROOT);
  const violations: Violation[] = [];
  for (const abs of files) {
    const rel = toRelPosix(abs);
    if (isAllowed(rel)) continue;
    let content: string;
    try {
      content = readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    if (!content.includes(PHRASE)) continue;
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(PHRASE)) {
        violations.push({
          path: rel,
          line: i + 1,
          preview: lines[i].trim().slice(0, 160),
        });
      }
    }
  }

  if (violations.length === 0) {
    console.log(
      `✓ check:integrity — no unauthorized occurrences of the unverified-data label found.`
    );
    return;
  }

  console.error(
    `✗ check:integrity — ${violations.length} unauthorized occurrence(s) of the unverified-data label:\n`
  );
  for (const v of violations) {
    console.error(`  ${v.path}:${v.line}`);
    console.error(`    ${v.preview}`);
  }
  console.error(
    `\nThe canonical label is exported as UNVERIFIED_LABEL from\n` +
      `apps/models/lib/verified.ts and rendered through the\n` +
      `<DataNotVerified /> component. See VERIFICATION.md for the policy.`
  );
  process.exit(1);
}

main();
