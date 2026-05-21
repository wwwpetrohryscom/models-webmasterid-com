/**
 * Anthropic independent HTTP probe.
 *
 * Targets `https://api.anthropic.com/` — the bare API host root with no
 * path. The endpoint returns HTTP 404 to an unauthenticated GET (the
 * host is up but there is no resource at `/`). For our purposes that is
 * exactly the right signal:
 *
 *   - DNS resolves → host has a record
 *   - TLS negotiates → cert is valid
 *   - socket connects → infrastructure is reachable
 *   - HTTP responds with 4xx → load-balancer / API gateway is processing
 *     requests
 *
 * We are NOT calling /v1/messages or any other inference endpoint. No
 * API key is sent. No prompt or completion is produced. No billing is
 * triggered. The probe is a reachability check, never an inference test.
 *
 * A 5xx from the same URL means the API gateway is itself failing — that
 * is the genuine "vendor degraded" signal we care about.
 */

import { createHttpProbeObserver } from "./http-probe";

export const anthropicIndependentProbe = createHttpProbeObserver({
  providerSlug: "anthropic",
  description:
    "Independent HTTP probe of api.anthropic.com — host-root reachability only, NOT an inference call.",
  url: "https://api.anthropic.com/",
  timeoutMs: 5_000,
});
