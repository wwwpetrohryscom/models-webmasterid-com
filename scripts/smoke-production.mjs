#!/usr/bin/env node
/**
 * Production smoke test.
 *
 * Usage:
 *   npm run smoke:production
 *
 * Optional env:
 *   DOMAIN        Base URL (default: https://models.webmasterid.com)
 *   CRON_SECRET   Bearer token for /api/cron/status (optional —
 *                 without it, the cron is expected to 401 / 503 in
 *                 production, which still counts as a pass)
 *
 * Exits non-zero if any check fails. Designed to be safe to run from
 * any environment — no Vercel CLI, no dependencies, no secrets ever
 * logged.
 */

import { runSmoke } from "./lib/smoke.mjs";

const baseUrl = process.env.DOMAIN ?? "https://models.webmasterid.com";
const cronSecret = process.env.CRON_SECRET ?? null;

process.stdout.write(
  `smoke:production — base=${baseUrl} cronSecret=${cronSecret ? "set" : "unset"}\n\n`
);

await runSmoke({ baseUrl, cronSecret, mode: "production" });
