# Deployment

Production deployment is on Vercel. The canonical production domain is
[models.webmasterid.com](https://models.webmasterid.com).

This document captures Vercel project configuration, DNS, post-deploy
checks, and the steps to register the site with Google Search Console
and Bing Webmaster Tools.

---

## Vercel project settings

| Setting | Value |
| --- | --- |
| Repository | `wwwpetrohryscom/models-webmasterid-com` |
| Framework Preset | Next.js |
| Root Directory | `apps/models` |
| Build Command | (Vercel default — `next build`) |
| Output Directory | (Vercel default — `.next`) |
| Install Command | `npm install` (uses workspace root) |
| Node.js version | 20.x or newer |
| Production Branch | `main` |

### Environment variables

| Name | Where | Purpose |
| --- | --- | --- |
| `CRON_SECRET` | Vercel project env (Production + Preview) | Bearer token required by `/api/cron/status` in production. If unset, the cron endpoint refuses to run in production. Vercel Cron passes this automatically when configured as a project env. |
| `KV_REST_API_URL` | Vercel project env (Production + Preview) | Optional. REST endpoint of a Vercel KV / Upstash Redis instance used to persist status observations. Set together with `KV_REST_API_TOKEN`; setting only one is treated as unconfigured. |
| `KV_REST_API_TOKEN` | Vercel project env (Production + Preview) | Optional. Bearer token for the KV REST endpoint above. Never log, never echo into a build output. |

No other environment variables are required for the current scaffold.
When the KV pair is unset, the status pipeline still runs — the cron
writes report `skipped_no_store`, and read endpoints return clear empty
states with `storageConfigured: false`.

### Vercel Cron

[`apps/models/vercel.json`](apps/models/vercel.json) declares a **daily**
cron against `/api/cron/status` (`0 0 * * *`, midnight UTC). Because the
Vercel project's Root Directory is `apps/models`, `vercel.json` lives at
`apps/models/vercel.json` and the cron path is the route's path under
that root. Set `CRON_SECRET` on the Vercel project (Production +
Preview) so the endpoint is bearer-token-guarded; if it is missing in
production, the route returns HTTP 503 with a clear message rather than
running unguarded.

**Plan constraint.** Vercel Hobby (free) plans only allow one cron
invocation per day. An hourly schedule (`0 * * * *`) causes the
deployment itself to fail with the error "Hobby accounts are limited
to daily cron jobs." If the project is upgraded to Pro the schedule
can be tightened back to hourly — at that point bump it in
`vercel.json` to `0 * * * *` and bump the documentation. Until then
the sample threshold gating uptime exposure (24 observations) is
effectively three weeks of accumulated samples at one per day.

---

## DNS

| Record | Name | Target |
| --- | --- | --- |
| CNAME | `models` | `cname.vercel-dns.com` |

The apex `webmasterid.com` is managed elsewhere; only the `models`
subdomain points here.

---

## Pre-deploy local validation

Run the full validation flow before each production deploy:

```bash
npm run validate
```

Which expands to:

```bash
npm run lint
npm run typecheck
npm run check:integrity
npm run check:production
npm run build
```

`check:integrity` and `check:production` are zero-network preflight QA
checks — they verify that the routes, endpoints, and configuration the
deployment depends on actually exist in the source tree.

---

## Post-deploy smoke tests

Run these against the live URL immediately after a production deploy.
A `200` plus the expected `Content-Type` is the bar.

```bash
DOMAIN=https://models.webmasterid.com

curl -sS -o /dev/null -w "%{http_code}  %{content_type}  %{url_effective}\n" \
  "$DOMAIN/" \
  "$DOMAIN/models" \
  "$DOMAIN/models/claude-opus-4" \
  "$DOMAIN/providers" \
  "$DOMAIN/compare" \
  "$DOMAIN/sitemap.xml" \
  "$DOMAIN/robots.txt" \
  "$DOMAIN/llms.txt" \
  "$DOMAIN/rss.xml" \
  "$DOMAIN/opengraph-image" \
  "$DOMAIN/api/health" \
  "$DOMAIN/api/site" \
  "$DOMAIN/api/status/anthropic" \
  "$DOMAIN/api/status/anthropic/latest" \
  "$DOMAIN/api/status/anthropic/window?hours=24" \
  "$DOMAIN/api/status/google" \
  "$DOMAIN/api/status/google/latest" \
  "$DOMAIN/api/status/google/window?hours=24"
```

Every status endpoint must respond with HTTP 200 and
`Content-Type: application/json`. If any returns `text/html`, the
deployment is stale — the route file is not in the production bundle.
Re-deploy, then re-run the smoke test.

Expected:

| Path | Status | Content-Type | Notes |
| --- | --- | --- | --- |
| `/` | 200 | `text/html` | canonical = `https://models.webmasterid.com` |
| `/models` | 200 | `text/html` | hub indexable |
| `/models/claude-opus-4` | 200 | `text/html` | verified model |
| `/providers` | 200 | `text/html` | hub indexable |
| `/compare` | 200 | `text/html` | hub indexable |
| `/sitemap.xml` | 200 | `application/xml` | references the production URL |
| `/robots.txt` | 200 | `text/plain` | sitemap line points at production URL |
| `/llms.txt` | 200 | `text/plain` | includes verification policy |
| `/rss.xml` | 200 | `application/rss+xml` | |
| `/opengraph-image` | 200 | `image/png` | 1200×630 |
| `/api/health` | 200 | `application/json` | `status: "ok"`, `environment: "production"` |
| `/api/site` | 200 | `application/json` | `url` and `domain` match production; `statusEndpoints` listed |
| `/api/status/anthropic` | 200 | `application/json` | `observerCount >= 1`; observations include both `vendor_status_api` and `independent_http_probe` source values |
| `/api/status/google` | 200 | `application/json` | `observerCount >= 1`; observation `source` is `vendor_status_api` |
| `/api/status/[anthropic|google]/latest` | 200 | `application/json` | `storageConfigured` boolean present; `empty: true` is OK when no observations stored yet |
| `/api/status/[anthropic|google]/window?hours=24` | 200 | `application/json` | `windowHours: 24`, `uptimeEligible: false` (until 24+ observations) |

### Indexability

Spot-check `<meta name="robots">` on a few pages:

| Path | Expected `robots` |
| --- | --- |
| `/` | `index, follow` |
| `/models` | `index, follow` |
| `/models/claude-opus-4` | `index, follow` |
| `/compare/gpt-5-vs-claude-opus-4` | `index, follow` (one verified side) |
| `/compare/gemini-2-5-pro-vs-deepseek-r1` | `noindex, follow` (both unverified) |
| `/news` | `noindex, follow` |
| `/research` | `noindex, follow` |
| `/status` | `noindex, follow` |

The full policy is in [`apps/models/lib/should-index.ts`](apps/models/lib/should-index.ts).

### Canonical URL

The canonical URL emitted on every page should be
`https://models.webmasterid.com` followed by the route path. Verify on
the homepage and a model page:

```bash
curl -sS https://models.webmasterid.com/ | grep -i 'rel="canonical"'
curl -sS https://models.webmasterid.com/models/claude-opus-4 | grep -i 'rel="canonical"'
```

---

## Search Console setup

### Google Search Console

1. Add property `https://models.webmasterid.com` (URL-prefix type).
2. Verify via DNS TXT record on `webmasterid.com` (preferred — survives
   subdomain reconfiguration) or via HTML tag in the root layout.
3. Submit sitemap: `https://models.webmasterid.com/sitemap.xml`
4. URL inspection — request indexing for:
   - `/`
   - `/models`
   - `/models/claude-opus-4`
   - `/providers`
   - `/compare`
   - `/docs`

### Bing Webmaster Tools

1. Add site `https://models.webmasterid.com`.
2. Import settings from Google Search Console if available, otherwise
   verify via DNS or meta tag.
3. Submit sitemap: `https://models.webmasterid.com/sitemap.xml`
4. URL submission for the same priority routes as GSC.

### IndexNow (optional)

Bing, Yandex, and others support IndexNow for low-latency change pings.
Not currently wired — defer until verified content volume justifies it.

---

## Indexing policy summary

| Route family | Indexable | Reason |
| --- | --- | --- |
| `/` | ✅ | Homepage |
| `/models`, `/models/[slug]` | ✅ | Catalogue value even when metrics are unverified — stable entity identity and verification metadata |
| `/providers` | ✅ | Catalogue value |
| `/compare`, `/compare/[slug]` | ✅ / conditional | Hub indexable. Per-comparison: indexable only when at least one side is verified |
| `/benchmarks` | ✅ | Catalogue value |
| `/pricing` | ✅ | Table is substantive even with unverified rows |
| `/infrastructure` | ✅ | Catalogue value |
| `/docs` | ✅ | Documents the verification system |
| `/news` | ❌ | Intentionally empty until verified entries exist |
| `/research` | ❌ | Intentionally empty |
| `/status` | ❌ | No independent monitor yet |
| `/api/*` | ❌ | JSON endpoints — disallowed in `robots.txt` |

Per-page `robots: { index, follow }` is applied via
[`robotsMetadata()`](apps/models/lib/should-index.ts), which the
sitemap and `llms.txt` use as the single source of truth.

---

## Rollback

Vercel keeps every prior deployment. To roll back:

1. Open the Vercel dashboard → Deployments.
2. Pick the last known-good deployment.
3. Click "Promote to Production".

Rolling back is preferred over a hot-fix commit for any production-level
content integrity regression.

---

## Operational endpoints

| Endpoint | Purpose |
| --- | --- |
| `/api/health` | Liveness check. Returns version, environment, build timestamp. Safe for uptime monitors. |
| `/api/site` | Public site metadata: name, description, routes, sitemap/robots/llms/rss/health URLs, verification policy. Useful for partner integrations. |
| `/api/status/[provider]` | Runs every observer registered for the provider and returns the freshly-issued `StatusObservation`s. 404 when no observer is registered for the slug. Each observation carries its own `source` so vendor and probe signals are not conflated. Always 200 for known providers, even when upstream failures occur (failures surface as `observedStatus: "unknown"` with a note). |
| `/api/status/[provider]/latest` | Most-recent persisted observation for the provider, or an empty state. |
| `/api/status/[provider]/window?hours=N` | Windowed view of persisted observations; includes a `bySource` breakdown. Default 24h, clamped 1..720. Uptime gating policy applies (see Durable Status Storage section). |
| `/api/cron/status` | Runs every enabled status observer (across all providers and both source types). Returns a JSON summary including per-observation write outcomes. Bearer-token-guarded via `CRON_SECRET` in production. |

None of these endpoints expose secrets, vendor-internal incident
detail, or a fabricated uptime claim. All are explicitly disallowed
in `robots.txt`.

---

## Durable Status Storage

Status observations are optionally persisted via Vercel KV / Upstash
Redis. The storage layer is wired in [`apps/models/lib/status-store.ts`](apps/models/lib/status-store.ts)
and accessed through a single `getStatusStore()` factory.

| Component | Purpose |
| --- | --- |
| `noopStatusStore` | Default adapter when neither `KV_REST_API_URL` nor `KV_REST_API_TOKEN` is set. Writes report `skipped_no_store`; reads return empty. |
| KV adapter (Upstash REST) | Active when both env vars are present. Talks to the REST API directly via `fetch` (no extra runtime dependency). |
| `MINIMUM_OBSERVATIONS_FOR_UPTIME` | Constant gating uptime exposure. Currently `24`. |
| `MAX_STORED_OBSERVATIONS_PER_PROVIDER` | Bounded retention (`720` ≈ 30 days hourly). LTRIM keeps the list capped. |

### Cron flow

1. Vercel Cron calls `/api/cron/status` hourly (bearer-token-guarded
   via `CRON_SECRET` in production).
2. The cron iterates every enabled observer in
   [`lib/observers/index.ts`](apps/models/lib/observers/index.ts).
3. Each observation is passed to `store.writeObservation()`. The store
   `LPUSH`es the JSON payload onto the per-provider list, `LTRIM`s to
   the retention cap, and `SET`s a `:latest` pointer for fast reads.
4. The cron response reports both observations and per-write outcomes
   (`stored` / `skipped_no_store` / `failed`).

### Read endpoints

| Endpoint | Behaviour |
| --- | --- |
| `/api/status/anthropic/latest` | Returns the most recent persisted observation, or a clear empty state. Always includes `storageConfigured` and `sampleCount`. |
| `/api/status/anthropic/window?hours=N` | Returns a windowed view (default 24h, clamped 1..720). Includes `observations`, `sampleCount`, `uptimeEligible`, and `policyNote`. |

### Uptime gating policy

The window endpoint exposes a `uptimePercentage` field **only** when:

1. Durable storage is configured (`storageConfigured === true`).
2. `sampleCount >= MINIMUM_OBSERVATIONS_FOR_UPTIME` for the requested
   window.

Even then, the value is the share of stored observations whose
**vendor-reported** status was `operational` over the window — a
vendor-reported operational-sample rate, not an independently-measured
availability percentage. The `policyNote` field always carries an
explicit, human-readable explanation of the gating decision.

The `/status` page itself does not display this number.

### Local development

Leave the KV env vars unset. The status pipeline will continue to run
end-to-end against the no-op adapter; the cron returns its observations
with `outcome: "skipped_no_store"`. To exercise the KV path locally,
point the env vars at an Upstash database and run the cron manually:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/status
```

---

## Vercel deployment recovery checklist

Use this when production is serving a stale bundle (signs: `/api/site`
missing the `statusEndpoints` field; `/api/cron/status` returning HTML
404; `/coverage` or `/sources` 404; `/api/debug/deployment`
`routeSetVersion` older than the one in
[`apps/models/lib/route-contract.ts`](apps/models/lib/route-contract.ts)).

1. **Confirm the Git integration is connected.**
   - Project Settings → Git.
   - Repository: `wwwpetrohryscom/models-webmasterid-com`.
   - Production branch: `main`.
   - If "Disconnected", reconnect the integration; that usually replays
     missing deployment webhooks.

2. **Confirm project root and framework.**
   - Project Settings → General → Root Directory: `apps/models`.
   - Framework Preset: Next.js.
   - Install Command: `npm install` (from the workspace root).

3. **Confirm the latest production deployment matches `main`.**
   - Vercel dashboard → Deployments → Production environment.
   - Top deployment's commit SHA must match `git rev-parse origin/main`.
   - If older, that is the stale-deployment symptom.

4. **Trigger a manual redeploy.**
   - From the most recent successful deployment, click Redeploy.
   - Uncheck "Use existing build cache".
   - Pick the latest commit on `main`.
   - Watch the build logs in the dashboard for failures.

5. **Confirm required environment variables.**
   - `CRON_SECRET` (Production + Preview) — required by
     `/api/cron/status` in production; the endpoint returns HTTP 503
     when it is unset on a Vercel production deployment.
   - `KV_REST_API_URL` + `KV_REST_API_TOKEN` (Production + Preview) —
     required for durable status storage. When unset, cron writes
     return `outcome: "skipped_no_store"`. Both must be set together
     to enable storage; setting only one is treated as unconfigured.

6. **Run the production smoke test + indexing QA.**
   ```bash
   npm run smoke:production
   # or, with bearer-auth for the cron endpoint:
   CRON_SECRET=… npm run smoke:production

   # Crawler-facing markup + machine endpoints:
   npm run qa:indexing
   ```
   `smoke:production` checks API + page reachability and the
   route-contract shape. `qa:indexing` checks the HTML markup
   crawlers actually consume (titles, canonicals, JSON-LD, noindex
   on filtered URLs, sitemap / robots / llms.txt references). Both
   exit non-zero on failure.

7. **Expected post-deploy outcomes.**
   - `/api/site` JSON includes `statusEndpoints`, `debugEndpoints`,
     `routeSetVersion`, and the routes list includes `/coverage` and
     `/sources`.
   - `/api/debug/deployment` JSON has `build.routeSetVersion ===
     "status-api-v2"` (or newer) and `deployment.vercelGitCommitSha`
     matches the commit you redeployed.
   - `/coverage` and `/sources` pages return HTML 200.
   - Every `/api/status/*` URL returns `application/json`.
   - `/api/cron/status` returns 401 / 200 / 503 — never HTML 404.

8. **If the deployment is still stale after redeploy.**
   - Check the deployment's Build Logs in the Vercel dashboard.
   - Inspect Project Settings → Domains: confirm `models.webmasterid.com`
     is assigned to the project, not pinned to a specific old
     deployment.
   - Inspect Production Branch → Production Alias: confirm it points at
     the latest deployment, not a manually-pinned one.
   - As a last resort, disconnect and reconnect the Git integration so
     Vercel re-syncs the commit history.

---

## Status Monitoring Policy

Sprint 9 wires the foundation for status observations. The discipline:

- **Vendor-reported status is not independent uptime.** Observations
  whose `source` is `vendor_status_page` or `vendor_status_api` are
  the provider reporting on themselves. Every UI surface that renders
  one must label it as such ("Vendor-reported status observed by
  WebmasterID").
- **Independent HTTP probes are a separate signal.** They are not yet
  enabled for any provider. When enabled, they will be labelled
  `independent_http_probe` and kept distinct from vendor observations.
- **Uptime % requires durable observations over a meaningful window.**
  WebmasterID does not write observations to durable storage yet, so
  no uptime percentage is published. The cron is the prerequisite, not
  the conclusion.
- **No SLA claims.** Nothing on `/status` or in `/api/status/*` should
  be read as a service-level commitment or availability guarantee.
- **Probe wall-clock time is not API latency.** The `latencyMs` field
  on a `StatusObservation` is the wall-clock time of the fetch we made
  to the status source. It must never be relabelled as API latency.
