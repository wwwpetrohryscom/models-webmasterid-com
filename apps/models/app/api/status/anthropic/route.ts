/**
 * /api/status/anthropic — literal-segment route.
 *
 * Sprint 12B restored the literal anthropic / google routes alongside
 * the dynamic `[provider]` route as a deployment-safety belt-and-
 * suspenders. Both this route and the dynamic counterpart delegate to
 * the same `handleStatusObservation()` helper in
 * `lib/status-handlers.ts`, so the response shape is identical and the
 * two routes cannot drift apart.
 */

import { handleStatusObservation } from "@/lib/status-handlers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return handleStatusObservation("anthropic");
}
