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

[`apps/models/vercel.json`](apps/models/vercel.json) declares an hourly
cron against `/api/cron/status` which runs every enabled status observer
(currently: Anthropic, vendor-reported). Because the Vercel project's
Root Directory is `apps/models`, `vercel.json` lives at
`apps/models/vercel.json` and the cron path is the route's path under
that root. Set `CRON_SECRET` on the Vercel project (Production +
Preview) so the endpoint is bearer-token-guarded; if it is missing in
production, the route returns HTTP 503 with a clear message rather than
running unguarded.

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
  "$DOMAIN/api/site"
```

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
| `/api/site` | 200 | `application/json` | `url` and `domain` match production |

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
| `/api/status/anthropic` | Single, freshly-issued vendor-reported status observation for Anthropic. Reads the Statuspage JSON feed and returns a normalised `StatusObservation`. Always 200; on upstream failure, `observedStatus` is `"unknown"` and the failure is captured in `httpStatus`/`note`. |
| `/api/cron/status` | Runs every enabled status observer. Returns a JSON summary. Bearer-token-guarded via `CRON_SECRET` in production. |

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
