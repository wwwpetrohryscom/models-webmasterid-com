/**
 * Registry of enabled status observers.
 *
 * To add a provider observer:
 *   1. Implement a `StatusObserver` in `apps/models/lib/observers/<slug>.ts`.
 *   2. Add it to `ENABLED_OBSERVERS` below.
 *   3. Add a corresponding `<provider>StatusPage` citation in
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

export const ENABLED_OBSERVERS: StatusObserver[] = [anthropicStatusObserver];

export function findObserver(providerSlug: string): StatusObserver | undefined {
  return ENABLED_OBSERVERS.find((o) => o.providerSlug === providerSlug);
}
