/**
 * Registry of enabled status observers.
 *
 * To add a provider observer:
 *   1. Implement a `StatusObserver` in `apps/models/lib/observers/<slug>.ts`.
 *   2. Add it to `ENABLED_OBSERVERS` below.
 *   3. Add a corresponding `<provider>StatusPage` (vendor) or
 *      `<provider>ProbeTarget` (independent probe) citation in
 *      `data/citations.ts`.
 *   4. Update the "Status observation coverage" panel on /coverage.
 *
 * Vendor-reported observers and independent HTTP probes coexist here,
 * but every observer must self-identify its `source` on each
 * `StatusObservation` it returns — readers of this registry must NOT
 * assume vendor-reported and independent-probe observations are
 * interchangeable.
 */

import type { StatusObserver } from "../status-observations";
import { anthropicStatusObserver } from "./anthropic";
import { anthropicIndependentProbe } from "./anthropic-probe";
import { googleStatusObserver } from "./google";

export const ENABLED_OBSERVERS: StatusObserver[] = [
  anthropicStatusObserver,
  anthropicIndependentProbe,
  googleStatusObserver,
];

/**
 * Returns ANY observer for a provider — useful for "does this provider
 * have status monitoring?" checks. If a provider has multiple observers
 * registered (e.g. a vendor + a probe for Anthropic), the first match
 * in registration order is returned.
 */
export function findObserver(providerSlug: string): StatusObserver | undefined {
  return ENABLED_OBSERVERS.find((o) => o.providerSlug === providerSlug);
}

/** Returns every observer registered for a provider, in order. */
export function findObserversForProvider(
  providerSlug: string
): StatusObserver[] {
  return ENABLED_OBSERVERS.filter((o) => o.providerSlug === providerSlug);
}

/** Stable list of provider slugs that have at least one observer. */
export function providersWithObservers(): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const o of ENABLED_OBSERVERS) {
    if (!seen.has(o.providerSlug)) {
      seen.add(o.providerSlug);
      order.push(o.providerSlug);
    }
  }
  return order;
}
