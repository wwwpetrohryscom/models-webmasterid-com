/**
 * Status observation primitives for WebmasterID Models.
 *
 * A "status observation" is a single, timestamped record of how a
 * provider's service looked from one specific source at one specific
 * moment. The vocabulary is deliberately narrow:
 *
 *   - `vendor_status_page`  — the provider's own public status page.
 *   - `vendor_status_api`   — the provider's machine-readable status
 *                             feed (e.g. Statuspage's `/api/v2/...`).
 *   - `independent_http_probe` — a request issued by WebmasterID itself
 *                                against the vendor's API. NOT YET
 *                                ENABLED.
 *
 * What this module is NOT:
 *   - It is not an uptime calculator. A single observation cannot prove
 *     availability over time. The `observedStatus` records what we saw,
 *     not what fraction of the past month the provider was up.
 *   - It is not a vendor-replacement status page. Vendor-reported status
 *     is reported by the vendor about themselves and must be labelled
 *     as such in every UI that surfaces it.
 *   - `latencyMs` is the wall-clock time of the fetch request we made
 *     against the status source. It is NOT the provider's API latency.
 */

export type StatusObservationSource =
  | "vendor_status_page"
  | "vendor_status_api"
  | "independent_http_probe";

export type ObservedStatus =
  | "operational"
  | "degraded"
  | "partial_outage"
  | "major_outage"
  | "maintenance"
  | "unknown";

export interface StatusObservation {
  providerSlug: string;
  source: StatusObservationSource;
  observedStatus: ObservedStatus;
  /** ISO-8601 UTC datetime of the observation. */
  observedAt: string;
  /** The exact URL that was probed. */
  sourceUrl: string;
  /** True when the source responded with a 2xx that we could parse. */
  responseOk: boolean;
  /** HTTP status code if a response was received; absent on network errors. */
  httpStatus?: number;
  /**
   * Wall-clock time of the fetch we made to the status source, in ms.
   * This is NOT the provider's API latency and must never be relabelled
   * as such in any UI or response payload.
   */
  latencyMs?: number | null;
  /** Free-text disambiguation (vendor description string, error reason). */
  note?: string;
}

export interface StatusObserver {
  providerSlug: string;
  /**
   * Declarative source category for this observer. Must match the
   * `source` field on every observation the observer produces — UI code
   * uses this to group observers without inspecting their run output.
   */
  source: StatusObservationSource;
  /** Human-friendly description of what this observer reads. */
  description: string;
  run: () => Promise<StatusObservation>;
}

/**
 * Map a Statuspage `status.indicator` value to our canonical
 * `ObservedStatus` vocabulary. The Statuspage indicator vocabulary is
 * documented at https://doers.statuspage.io/api/v2/components/ — values:
 * `none`, `minor`, `major`, `critical`, `maintenance`.
 */
export function mapStatuspageIndicator(
  indicator: unknown
): ObservedStatus {
  switch (indicator) {
    case "none":
      return "operational";
    case "minor":
      return "degraded";
    case "major":
      return "partial_outage";
    case "critical":
      return "major_outage";
    case "maintenance":
      return "maintenance";
    default:
      return "unknown";
  }
}

/**
 * Helper: build an "unknown" observation for use when an observer cannot
 * reach its source or the response cannot be interpreted. Callers should
 * fill in `httpStatus`, `latencyMs`, and `note` where they have them.
 */
export function unknownObservation(input: {
  providerSlug: string;
  source: StatusObservationSource;
  sourceUrl: string;
  httpStatus?: number;
  latencyMs?: number | null;
  note?: string;
}): StatusObservation {
  return {
    providerSlug: input.providerSlug,
    source: input.source,
    observedStatus: "unknown",
    observedAt: new Date().toISOString(),
    sourceUrl: input.sourceUrl,
    responseOk: false,
    httpStatus: input.httpStatus,
    latencyMs: input.latencyMs ?? null,
    note: input.note,
  };
}

export const OBSERVED_STATUS_LABEL: Record<ObservedStatus, string> = {
  operational: "Operational",
  degraded: "Degraded",
  partial_outage: "Partial outage",
  major_outage: "Major outage",
  maintenance: "Maintenance",
  unknown: "Unknown",
};

export const SOURCE_LABEL: Record<StatusObservationSource, string> = {
  vendor_status_page: "Vendor status page",
  vendor_status_api: "Vendor status API",
  independent_http_probe: "Independent HTTP probe",
};
