#!/usr/bin/env node
/**
 * Local smoke test.
 *
 * Usage:
 *   npm run build
 *   npm run start   # in another shell
 *   npm run smoke:local
 *
 * Optional env:
 *   PORT          Override port (default: 3000)
 *   CRON_SECRET   Bearer token for /api/cron/status (usually unset
 *                 locally; the cron then runs unguarded in dev and
 *                 returns 200)
 */

import { runSmoke } from "./lib/smoke.mjs";

const port = process.env.PORT ?? "3000";
const baseUrl = process.env.DOMAIN ?? `http://localhost:${port}`;
const cronSecret = process.env.CRON_SECRET ?? null;

process.stdout.write(
  `smoke:local — base=${baseUrl} cronSecret=${cronSecret ? "set" : "unset"}\n\n`
);

await runSmoke({ baseUrl, cronSecret, mode: "local" });
