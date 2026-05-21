/**
 * Status observation storage.
 *
 * The status store is the optional durable layer behind the vendor-status
 * observers. Two adapters ship:
 *
 *   - `noopStatusStore`  — used when no storage credentials are present.
 *                          All writes report `skipped_no_store`; all reads
 *                          return empty. Local development and previews
 *                          stay ergonomic without a database.
 *   - `kvStatusStore`    — used when both KV_REST_API_URL and
 *                          KV_REST_API_TOKEN are set. Talks to Upstash /
 *                          Vercel KV over the REST API; no extra deps,
 *                          no secrets logged.
 *
 * Stored observation records are exactly the `StatusObservation` shape
 * defined in `lib/status-observations.ts`. Nothing else is persisted —
 * no user data, no analytics, no request bodies from end-users.
 *
 * The threshold for surfacing any uptime-like number on the read side is
 * declared here as a single constant, `MINIMUM_OBSERVATIONS_FOR_UPTIME`,
 * so the policy stays auditable. Surfacing a number BEFORE the threshold
 * is a policy violation and is blocked by the integrity guard suite.
 */

import type { StatusObservation } from "./status-observations";

/**
 * Minimum number of observations within a window required before any
 * uptime-shaped number may be exposed by `/api/status/<slug>/window`.
 *
 * The cron currently runs hourly, so a value of 24 corresponds to ~24
 * hours of continuous observation. The number is intentionally
 * conservative — a smaller window does not produce a meaningful
 * availability signal.
 */
export const MINIMUM_OBSERVATIONS_FOR_UPTIME = 24;

/** Bounded retention so the list does not grow without limit. */
export const MAX_STORED_OBSERVATIONS_PER_PROVIDER = 720; // ~30d hourly

export type StatusStoreWriteOutcome =
  | "stored"
  | "skipped_no_store"
  | "failed";

export interface StatusStoreWriteResult {
  outcome: StatusStoreWriteOutcome;
  providerSlug: string;
  /** When `outcome === "failed"`, a short reason string. */
  reason?: string;
}

export interface StatusObservationWindow {
  providerSlug: string;
  windowHours: number;
  /** ISO-8601 datetime; null when no observations available. */
  windowStart: string | null;
  /** ISO-8601 datetime; null when no observations available. */
  windowEnd: string | null;
  observations: StatusObservation[];
  sampleCount: number;
  uptimeEligible: boolean;
  /**
   * Vendor-reported operational-sample rate over the window, in percent.
   * **Only populated when `uptimeEligible === true`.** Even then, this is
   * the share of stored observations whose `observedStatus === "operational"`,
   * not an independently-measured availability percentage.
   */
  uptimePercentage: number | null;
  /** Human-readable explanation of the gating decision. */
  policyNote: string;
  /** True when a durable store is configured for this deployment. */
  storageConfigured: boolean;
}

export interface StatusStore {
  /**
   * `true` when the adapter is backed by durable storage; `false` for
   * the no-op adapter. Surfaced verbatim through the read endpoints.
   */
  readonly isConfigured: boolean;
  /** Short identifier for logging / observability. */
  readonly adapterName: string;
  writeObservation(
    observation: StatusObservation
  ): Promise<StatusStoreWriteResult>;
  getLatestObservation(
    providerSlug: string
  ): Promise<StatusObservation | null>;
  getObservationWindow(
    providerSlug: string,
    options: { hours: number }
  ): Promise<StatusObservationWindow>;
  getProviderObservationCount(providerSlug: string): Promise<number>;
}

// ---------------------------------------------------------------------------
// no-op adapter
// ---------------------------------------------------------------------------

function emptyWindow(
  providerSlug: string,
  hours: number,
  storageConfigured: boolean,
  reason: string
): StatusObservationWindow {
  return {
    providerSlug,
    windowHours: hours,
    windowStart: null,
    windowEnd: null,
    observations: [],
    sampleCount: 0,
    uptimeEligible: false,
    uptimePercentage: null,
    policyNote: reason,
    storageConfigured,
  };
}

export const noopStatusStore: StatusStore = {
  isConfigured: false,
  adapterName: "noop",
  async writeObservation(
    observation: StatusObservation
  ): Promise<StatusStoreWriteResult> {
    return {
      outcome: "skipped_no_store",
      providerSlug: observation.providerSlug,
    };
  },
  async getLatestObservation(): Promise<StatusObservation | null> {
    return null;
  },
  async getObservationWindow(
    providerSlug: string,
    options: { hours: number }
  ): Promise<StatusObservationWindow> {
    return emptyWindow(
      providerSlug,
      options.hours,
      false,
      "No durable storage is configured on this deployment. Observations are not persisted, so no window can be computed."
    );
  },
  async getProviderObservationCount(): Promise<number> {
    return 0;
  },
};

// ---------------------------------------------------------------------------
// Upstash / Vercel KV adapter
//
// Uses the Upstash REST API (the same protocol the official @vercel/kv
// client wraps). We talk to it directly via `fetch` so no extra runtime
// dependency is required. Single-command POST shape:
//
//   POST <KV_REST_API_URL>/
//   Authorization: Bearer <KV_REST_API_TOKEN>
//   Content-Type:  application/json
//   Body:          ["COMMAND", "arg1", "arg2", ...]
//
// Response shape: `{ "result": <unknown> }` for success or
// `{ "error": "<string>" }` for failure. Errors are caught and surfaced
// as `outcome: "failed"` write results / `null` reads, never thrown into
// the cron loop.
// ---------------------------------------------------------------------------

function listKey(providerSlug: string): string {
  return `status:obs:${providerSlug}:list`;
}
function latestKey(providerSlug: string): string {
  return `status:obs:${providerSlug}:latest`;
}

interface KvSuccess<T> {
  result: T;
}
interface KvFailure {
  error: string;
}
type KvResponse<T> = KvSuccess<T> | KvFailure;

const KV_FETCH_TIMEOUT_MS = 4_000;

async function kvCommand<T>(
  url: string,
  token: string,
  command: (string | number)[]
): Promise<KvResponse<T>> {
  try {
    const res = await fetch(url, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(KV_FETCH_TIMEOUT_MS),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });
    if (!res.ok) {
      return { error: `HTTP ${res.status}` };
    }
    const body = (await res.json()) as KvResponse<T>;
    return body;
  } catch (err) {
    const reason = err instanceof Error ? err.message : "unknown fetch failure";
    return { error: reason };
  }
}

function isSuccess<T>(r: KvResponse<T>): r is KvSuccess<T> {
  return "result" in r;
}

interface KvAdapterConfig {
  url: string;
  token: string;
}

function makeKvAdapter(cfg: KvAdapterConfig): StatusStore {
  const { url, token } = cfg;

  return {
    isConfigured: true,
    adapterName: "kv-rest",

    async writeObservation(
      observation: StatusObservation
    ): Promise<StatusStoreWriteResult> {
      const payload = JSON.stringify(observation);
      const list = listKey(observation.providerSlug);
      const latest = latestKey(observation.providerSlug);

      // 1. LPUSH the observation onto the per-provider list.
      const push = await kvCommand<number>(url, token, [
        "LPUSH",
        list,
        payload,
      ]);
      if (!isSuccess(push)) {
        return {
          outcome: "failed",
          providerSlug: observation.providerSlug,
          reason: `LPUSH failed: ${push.error}`,
        };
      }

      // 2. Cap the list. LTRIM is fire-and-forget — if it fails the write
      //    is still considered stored; retention just drifts upward.
      await kvCommand(url, token, [
        "LTRIM",
        list,
        0,
        MAX_STORED_OBSERVATIONS_PER_PROVIDER - 1,
      ]);

      // 3. SET the latest pointer for fast reads.
      await kvCommand(url, token, ["SET", latest, payload]);

      return { outcome: "stored", providerSlug: observation.providerSlug };
    },

    async getLatestObservation(
      providerSlug: string
    ): Promise<StatusObservation | null> {
      const res = await kvCommand<string | null>(url, token, [
        "GET",
        latestKey(providerSlug),
      ]);
      if (!isSuccess(res) || !res.result) return null;
      try {
        return JSON.parse(res.result) as StatusObservation;
      } catch {
        return null;
      }
    },

    async getProviderObservationCount(providerSlug: string): Promise<number> {
      const res = await kvCommand<number>(url, token, [
        "LLEN",
        listKey(providerSlug),
      ]);
      if (!isSuccess(res)) return 0;
      return typeof res.result === "number" ? res.result : 0;
    },

    async getObservationWindow(
      providerSlug: string,
      options: { hours: number }
    ): Promise<StatusObservationWindow> {
      const hours = Math.max(1, Math.floor(options.hours));
      // Fetch the whole bounded list — it is at most
      // MAX_STORED_OBSERVATIONS_PER_PROVIDER entries — and filter by
      // observedAt against the window. Simple and predictable.
      const res = await kvCommand<string[]>(url, token, [
        "LRANGE",
        listKey(providerSlug),
        0,
        MAX_STORED_OBSERVATIONS_PER_PROVIDER - 1,
      ]);
      if (!isSuccess(res) || !Array.isArray(res.result)) {
        return emptyWindow(
          providerSlug,
          hours,
          true,
          "Durable storage is configured but the LRANGE read failed."
        );
      }

      const all: StatusObservation[] = [];
      for (const entry of res.result) {
        try {
          all.push(JSON.parse(entry) as StatusObservation);
        } catch {
          // Skip malformed entries silently — they are bugs, not data.
        }
      }

      const cutoffMs = Date.now() - hours * 60 * 60 * 1000;
      const observations = all
        .filter((o) => Date.parse(o.observedAt) >= cutoffMs)
        .sort(
          (a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt)
        );
      const sampleCount = observations.length;

      const eligible = sampleCount >= MINIMUM_OBSERVATIONS_FOR_UPTIME;
      const operationalCount = observations.filter(
        (o) => o.observedStatus === "operational"
      ).length;

      const policyNote = eligible
        ? `Vendor-reported operational-sample rate computed over ${sampleCount} observations in the last ${hours}h. NOT an independently-measured availability percentage.`
        : `Uptime calculation is gated: ${sampleCount}/${MINIMUM_OBSERVATIONS_FOR_UPTIME} observations available in the last ${hours}h. Threshold must be met before any uptime-shaped number is exposed.`;

      return {
        providerSlug,
        windowHours: hours,
        windowStart: observations.length
          ? observations[observations.length - 1].observedAt
          : null,
        windowEnd: observations.length ? observations[0].observedAt : null,
        observations,
        sampleCount,
        uptimeEligible: eligible,
        uptimePercentage: eligible
          ? Math.round((operationalCount / sampleCount) * 1000) / 10
          : null,
        policyNote,
        storageConfigured: true,
      };
    },
  };
}

// ---------------------------------------------------------------------------
// factory
// ---------------------------------------------------------------------------

let cachedStore: StatusStore | null = null;

/**
 * Resolve the active store from the current environment. The first call
 * inspects `process.env` and caches the result for the lifetime of the
 * process; subsequent calls return the cached adapter.
 *
 * Credentials are never logged. The factory exposes `isConfigured` on
 * the returned adapter so UI code can render storage state without
 * touching env directly.
 */
export function getStatusStore(): StatusStore {
  if (cachedStore) return cachedStore;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (url && token) {
    cachedStore = makeKvAdapter({ url, token });
  } else {
    cachedStore = noopStatusStore;
  }
  return cachedStore;
}

/**
 * Lightweight helper for render-time storage-state checks. Reads only
 * env presence (NOT secrets) and returns a stable boolean. Safe to call
 * from server components.
 */
export function isStatusStorageConfigured(): boolean {
  return Boolean(
    process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  );
}
