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

No environment variables are required for the current scaffold.

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

Neither endpoint exposes secrets, provider status, or fabricated uptime
claims. Both are explicitly disallowed in `robots.txt`.
