/**
 * Shared scanner for the canonical unverified-data label.
 * Imported by check-data-not-verified-usage.ts (the integrity guard) and
 * by check-production-readiness.ts (the deploy QA).
 *
 * The phrase is assembled at runtime so this file does not match itself.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

export const UNVERIFIED_LABEL_PHRASE = [
  "Data",
  "not",
  "yet",
  "verified.",
].join(" ");

export const DEFAULT_ALLOWED_PATTERNS: RegExp[] = [
  /^README\.md$/,
  /^VERIFICATION\.md$/,
  /^DEPLOYMENT\.md$/,
  /^apps\/models\/components\/DataNotVerified\.tsx$/,
  /^apps\/models\/lib\/verified\.ts$/,
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

export interface Violation {
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

function toRelPosix(root: string, full: string): string {
  return relative(root, full).split(sep).join("/");
}

export function scanForLabel({
  root,
  allowed = DEFAULT_ALLOWED_PATTERNS,
}: {
  root: string;
  allowed?: RegExp[];
}): Violation[] {
  const files = walk(root);
  const violations: Violation[] = [];
  for (const abs of files) {
    const rel = toRelPosix(root, abs);
    if (allowed.some((re) => re.test(rel))) continue;
    let content: string;
    try {
      content = readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    if (!content.includes(UNVERIFIED_LABEL_PHRASE)) continue;
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(UNVERIFIED_LABEL_PHRASE)) {
        violations.push({
          path: rel,
          line: i + 1,
          preview: lines[i].trim().slice(0, 160),
        });
      }
    }
  }
  return violations;
}

export function formatViolations(violations: Violation[]): string {
  if (!violations.length) return "";
  const lines = [
    `${violations.length} unauthorized occurrence(s) of the unverified-data label:\n`,
  ];
  for (const v of violations) {
    lines.push(`  ${v.path}:${v.line}`);
    lines.push(`    ${v.preview}`);
  }
  lines.push(
    `\nThe canonical label is exported as UNVERIFIED_LABEL from\n` +
      `apps/models/lib/verified.ts and rendered through the\n` +
      `<DataNotVerified /> component. See VERIFICATION.md for the policy.`
  );
  return lines.join("\n");
}
