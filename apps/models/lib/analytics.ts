/**
 * Public analytics configuration.
 *
 * The tracker is loaded as a script tag (see app/layout.tsx) rather than
 * via an SDK to avoid an extra dependency on the runtime. The site
 * identifier (`siteId`) is a PUBLIC identifier — there are no secrets
 * in this file.
 *
 * Single source of truth for the loaded script's id, source URL,
 * endpoint, and site id. Anything that needs to verify analytics is
 * wired correctly (such as scripts/check-production-readiness.ts)
 * should read from here.
 */
export const webmasterIdAnalytics = {
  /** DOM id assigned to the injected <script> tag. */
  scriptId: "webmasterid-tracker",
  /** Public site identifier issued by WebmasterID. NOT a secret. */
  siteId: "wm_64pnpqrfcgfwttwi",
  /** Ingest endpoint the tracker beacons to. */
  endpoint: "https://webmasterid-ingest-api.vercel.app/api/events",
  /** URL of the IIFE tracker bundle. */
  scriptSrc: "https://webmasterid.com/tracker.iife.min.js",
} as const;

export type WebmasterIdAnalyticsConfig = typeof webmasterIdAnalytics;
