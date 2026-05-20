/**
 * Repository guard: blocks unauthorized occurrences of the canonical
 * unverified-data label (see UNVERIFIED_LABEL in apps/models/lib/verified.ts).
 *
 * The scan logic is shared with check-production-readiness.ts via
 * scripts/lib/scan-label.ts.
 *
 * Run with: npm run check:integrity
 */

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { scanForLabel, formatViolations } from "./lib/scan-label.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");

function main(): void {
  const violations = scanForLabel({ root: ROOT });
  if (violations.length === 0) {
    console.log(
      `✓ check:integrity — no unauthorized occurrences of the unverified-data label found.`
    );
    return;
  }
  console.error(`✗ check:integrity — ${formatViolations(violations)}`);
  process.exit(1);
}

main();
