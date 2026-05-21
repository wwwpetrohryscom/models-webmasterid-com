/**
 * /api/status/[provider]/window
 *
 * Dynamic generic route — see `app/api/status/[provider]/route.ts` for
 * the full architecture note. Delegates to the shared handler.
 *
 * Uptime gating policy and `bySource` semantics are documented in
 * `lib/status-handlers.ts`. Probe-success rate is NOT relabelled as
 * request latency or availability.
 */

import {
  handleStatusWindow,
  parseWindowHours,
} from "@/lib/status-handlers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface RouteParams {
  provider: string;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<RouteParams> }
) {
  const { provider } = await params;
  const url = new URL(req.url);
  const hours = parseWindowHours(url.searchParams.get("hours"));
  return handleStatusWindow(provider, hours);
}
