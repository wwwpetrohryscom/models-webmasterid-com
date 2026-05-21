/**
 * Generic independent-HTTP-probe observer factory.
 *
 * What it does:
 *   Issues a single GET request from WebmasterID against a configured
 *   public, low-impact, NON-INFERENCE provider endpoint and produces a
 *   `StatusObservation` with `source: "independent_http_probe"`. The
 *   observation reports whether the host responded and how long the
 *   fetch took.
 *
 * What it explicitly is NOT:
 *   - It does not call inference endpoints. Callers MUST point it at a
 *     non-billing public surface (host root, public docs site, etc.).
 *   - The `latencyMs` field is wall-clock fetch time, NOT the provider's
 *     API latency. Probe wall-clock time can be relabelled neither by
 *     this module, nor by any caller.
 *   - It does not assert availability. A successful probe means the
 *     host responded once; nothing more.
 *
 * Safety:
 *   - Hourly cron only. Do not call from request handlers.
 *   - 5-second hard timeout via AbortSignal.timeout.
 *   - `cache: "no-store"` so we never serve a stale probe out of an
 *     edge cache.
 *   - User-Agent is a stable identification string so vendors can
 *     differentiate WebmasterID traffic from anonymous scraping.
 */

import {
  unknownObservation,
  type ObservedStatus,
  type StatusObservation,
  type StatusObserver,
} from "../status-observations";

export interface HttpProbeConfig {
  /** Provider slug this probe attributes to. */
  providerSlug: string;
  /** Short human-friendly description, e.g. "Anthropic API host probe". */
  description: string;
  /**
   * The exact URL to probe. MUST be a public, non-inference, non-billing
   * surface. The integrity guards in scripts/check-production-readiness.ts
   * reinforce this at the registry level.
   */
  url: string;
  /** Fetch timeout in milliseconds. Defaults to 5_000. */
  timeoutMs?: number;
  /**
   * Optional override for HTTP-status → ObservedStatus mapping. The
   * default treats 2xx/3xx/4xx as `operational` (host responded with a
   * valid HTTP layer) and 5xx as `degraded`. Network errors / timeouts
   * stay `unknown` and are NOT routed through this callback.
   */
  mapStatus?: (httpStatus: number) => ObservedStatus;
}

const DEFAULT_TIMEOUT_MS = 5_000;
const USER_AGENT = "WebmasterIDStatusProbe/1.0 (+https://models.webmasterid.com)";

function defaultMap(httpStatus: number): ObservedStatus {
  if (httpStatus >= 200 && httpStatus < 500) return "operational";
  if (httpStatus >= 500) return "degraded";
  return "unknown";
}

export function createHttpProbeObserver(
  cfg: HttpProbeConfig
): StatusObserver {
  const timeoutMs = cfg.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const mapStatus = cfg.mapStatus ?? defaultMap;

  return {
    providerSlug: cfg.providerSlug,
    source: "independent_http_probe",
    description: cfg.description,
    async run(): Promise<StatusObservation> {
      const startedAt = Date.now();
      try {
        const res = await fetch(cfg.url, {
          method: "GET",
          cache: "no-store",
          redirect: "manual",
          signal: AbortSignal.timeout(timeoutMs),
          headers: { "User-Agent": USER_AGENT },
        });
        const latencyMs = Date.now() - startedAt;
        return {
          providerSlug: cfg.providerSlug,
          source: "independent_http_probe",
          observedStatus: mapStatus(res.status),
          observedAt: new Date().toISOString(),
          sourceUrl: cfg.url,
          responseOk: res.status >= 200 && res.status < 500,
          httpStatus: res.status,
          latencyMs,
          note: `Independent HTTP probe. HTTP ${res.status} in ${latencyMs}ms (wall-clock fetch time, NOT the provider's request latency). A reachable host that responds is a reachability signal, not an availability measurement.`,
        };
      } catch (err) {
        const latencyMs = Date.now() - startedAt;
        const reason =
          err instanceof Error ? err.message : "unknown fetch failure";
        return unknownObservation({
          providerSlug: cfg.providerSlug,
          source: "independent_http_probe",
          sourceUrl: cfg.url,
          latencyMs,
          note: `Independent HTTP probe failed: ${reason}. No availability claim is implied.`,
        });
      }
    },
  };
}
