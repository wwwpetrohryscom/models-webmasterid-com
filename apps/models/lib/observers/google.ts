/**
 * Google vendor-status observer.
 *
 * Reads `https://status.cloud.google.com/incidents.json` — Google
 * Cloud's public, JSON-formatted incidents feed. The shape is an array
 * of incident objects with fields including `most_recent_update.status`
 * ("AVAILABLE" / "SERVICE_DISRUPTION"), `severity` ("low" | "medium" |
 * "high"), `status_impact`, and `affected_products` (list of `{ title,
 * id }`).
 *
 * Google Cloud is a multi-product platform; almost all incidents
 * concern services WebmasterID does not track. We filter the feed to
 * incidents whose `affected_products` reference Gemini, Generative
 * Language, Vertex AI, or AI Studio — the surfaces the catalogue tracks
 * as "Google Gemini API". An open incident matching the filter maps to
 * a degraded / partial-outage / major-outage state via severity. Anything
 * else (or an empty filter result) maps to `operational`.
 *
 * IMPORTANT — this is a VENDOR-REPORTED source. The provider reports on
 * themselves. Every UI surface that renders it must label it as such.
 */

import {
  mapStatuspageIndicator,
  unknownObservation,
  type ObservedStatus,
  type StatusObservation,
  type StatusObserver,
} from "../status-observations";

const GOOGLE_INCIDENTS_URL =
  "https://status.cloud.google.com/incidents.json";

const FETCH_TIMEOUT_MS = 5_000;

/** Keywords that identify an incident as touching Google's Gemini surface. */
const GEMINI_PRODUCT_KEYWORDS = [
  /gemini/i,
  /generative\s+language/i,
  /vertex\s*ai/i,
  /ai\s*studio/i,
];

interface IncidentUpdate {
  status?: string;
  text?: string;
}

interface IncidentProduct {
  title?: string;
  id?: string;
}

interface Incident {
  id?: string;
  external_desc?: string;
  most_recent_update?: IncidentUpdate;
  severity?: string;
  status_impact?: string;
  affected_products?: IncidentProduct[];
  begin?: string;
  end?: string | null;
}

function affectsGemini(incident: Incident): boolean {
  const products = incident.affected_products ?? [];
  for (const p of products) {
    const title = `${p.title ?? ""} ${p.id ?? ""}`;
    if (GEMINI_PRODUCT_KEYWORDS.some((re) => re.test(title))) return true;
  }
  return false;
}

function isActive(incident: Incident): boolean {
  // Google reports `end` as the resolution timestamp; absent or null
  // means still active. The `most_recent_update.status` field is also a
  // signal — "SERVICE_DISRUPTION" means unresolved.
  const ended = incident.end !== null && incident.end !== undefined;
  if (ended) return false;
  return incident.most_recent_update?.status !== "AVAILABLE";
}

function mapSeverity(severity: string | undefined): ObservedStatus {
  switch ((severity ?? "").toLowerCase()) {
    case "high":
      return "major_outage";
    case "medium":
      return "partial_outage";
    case "low":
      return "degraded";
    default:
      // Map by Statuspage analogue when severity is missing.
      return mapStatuspageIndicator("minor");
  }
}

async function fetchGoogleStatus(): Promise<StatusObservation> {
  const startedAt = Date.now();
  try {
    const res = await fetch(GOOGLE_INCIDENTS_URL, {
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
    const latencyMs = Date.now() - startedAt;

    if (!res.ok) {
      return unknownObservation({
        providerSlug: "google",
        source: "vendor_status_api",
        sourceUrl: GOOGLE_INCIDENTS_URL,
        httpStatus: res.status,
        latencyMs,
        note: `Vendor incidents feed returned HTTP ${res.status}.`,
      });
    }

    let body: unknown;
    try {
      body = await res.json();
    } catch {
      return unknownObservation({
        providerSlug: "google",
        source: "vendor_status_api",
        sourceUrl: GOOGLE_INCIDENTS_URL,
        httpStatus: res.status,
        latencyMs,
        note: "Vendor incidents feed returned non-JSON.",
      });
    }

    if (!Array.isArray(body)) {
      return unknownObservation({
        providerSlug: "google",
        source: "vendor_status_api",
        sourceUrl: GOOGLE_INCIDENTS_URL,
        httpStatus: res.status,
        latencyMs,
        note: "Vendor incidents feed had unexpected shape (not an array).",
      });
    }

    const incidents = body as Incident[];
    const matching = incidents.filter(
      (i) => isActive(i) && affectsGemini(i)
    );

    if (matching.length === 0) {
      return {
        providerSlug: "google",
        source: "vendor_status_api",
        observedStatus: "operational",
        observedAt: new Date().toISOString(),
        sourceUrl: GOOGLE_INCIDENTS_URL,
        responseOk: true,
        httpStatus: res.status,
        latencyMs,
        note: "No active Google Cloud incidents touching Gemini / Vertex AI / AI Studio in the public incidents feed.",
      };
    }

    // Pick the highest-severity matching incident as the headline.
    const severityRank = { high: 3, medium: 2, low: 1 } as const;
    type Rank = keyof typeof severityRank;
    const headline = matching.reduce((acc, cur) => {
      const a = severityRank[(acc.severity ?? "") as Rank] ?? 0;
      const b = severityRank[(cur.severity ?? "") as Rank] ?? 0;
      return b > a ? cur : acc;
    });

    const products =
      headline.affected_products
        ?.map((p) => p.title)
        .filter((x): x is string => Boolean(x))
        .join(", ") ?? "(products unspecified)";

    return {
      providerSlug: "google",
      source: "vendor_status_api",
      observedStatus: mapSeverity(headline.severity),
      observedAt: new Date().toISOString(),
      sourceUrl: GOOGLE_INCIDENTS_URL,
      responseOk: true,
      httpStatus: res.status,
      latencyMs,
      note: `Google Cloud reports ${matching.length} active incident(s) touching Gemini-related products. Headline severity: ${headline.severity ?? "unspecified"}. Affected: ${products}.`,
    };
  } catch (err) {
    const latencyMs = Date.now() - startedAt;
    const reason =
      err instanceof Error ? err.message : "unknown fetch failure";
    return unknownObservation({
      providerSlug: "google",
      source: "vendor_status_api",
      sourceUrl: GOOGLE_INCIDENTS_URL,
      latencyMs,
      note: `Fetch failed: ${reason}`,
    });
  }
}

export const googleStatusObserver: StatusObserver = {
  providerSlug: "google",
  source: "vendor_status_api",
  description:
    "Reads the Google Cloud public incidents feed and reports the headline state of active incidents touching Gemini / Vertex AI / AI Studio. Vendor-reported, NOT an independent uptime probe.",
  run: fetchGoogleStatus,
};
