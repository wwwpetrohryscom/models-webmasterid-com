/**
 * Anthropic vendor-status observer.
 *
 * Reads Anthropic's public Statuspage JSON feed at
 *   https://status.anthropic.com/api/v2/status.json
 * (which redirects to https://status.claude.com). The response shape is
 * documented by Statuspage and we only consume two fields:
 *   - `status.indicator`   — mapped to our `ObservedStatus` vocabulary
 *   - `status.description` — surfaced as the observation's `note`
 *
 * IMPORTANT — this observer is a VENDOR-REPORTED source. The provider
 * tells us about themselves; this is not an independent uptime probe.
 * Every UI surface that renders the result must label it as such.
 */

import {
  mapStatuspageIndicator,
  unknownObservation,
  type StatusObservation,
  type StatusObserver,
} from "../status-observations";

const ANTHROPIC_STATUS_URL =
  "https://status.anthropic.com/api/v2/status.json";

const FETCH_TIMEOUT_MS = 5_000;

interface StatuspageResponse {
  status?: { indicator?: string; description?: string };
  page?: { updated_at?: string };
}

async function fetchAnthropicStatus(): Promise<StatusObservation> {
  const startedAt = Date.now();
  const sourceUrl = ANTHROPIC_STATUS_URL;
  try {
    const res = await fetch(sourceUrl, {
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
    const latencyMs = Date.now() - startedAt;

    if (!res.ok) {
      return unknownObservation({
        providerSlug: "anthropic",
        source: "vendor_status_api",
        sourceUrl,
        httpStatus: res.status,
        latencyMs,
        note: `Vendor status endpoint returned HTTP ${res.status}.`,
      });
    }

    let body: StatuspageResponse | null = null;
    try {
      body = (await res.json()) as StatuspageResponse;
    } catch {
      return unknownObservation({
        providerSlug: "anthropic",
        source: "vendor_status_api",
        sourceUrl,
        httpStatus: res.status,
        latencyMs,
        note: "Vendor status endpoint returned a non-JSON response.",
      });
    }

    const indicator = body?.status?.indicator;
    const description = body?.status?.description;

    return {
      providerSlug: "anthropic",
      source: "vendor_status_api",
      observedStatus: mapStatuspageIndicator(indicator),
      observedAt: new Date().toISOString(),
      sourceUrl,
      responseOk: true,
      httpStatus: res.status,
      latencyMs,
      note:
        typeof description === "string" && description.length > 0
          ? description
          : undefined,
    };
  } catch (err) {
    const latencyMs = Date.now() - startedAt;
    const reason =
      err instanceof Error ? err.message : "unknown fetch failure";
    return unknownObservation({
      providerSlug: "anthropic",
      source: "vendor_status_api",
      sourceUrl,
      latencyMs,
      note: `Fetch failed: ${reason}`,
    });
  }
}

export const anthropicStatusObserver: StatusObserver = {
  providerSlug: "anthropic",
  description:
    "Reads the public Anthropic Statuspage JSON feed (vendor-reported status, NOT an independent uptime probe).",
  run: fetchAnthropicStatus,
};
