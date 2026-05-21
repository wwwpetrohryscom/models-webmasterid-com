/**
 * /api/status/[provider]
 *
 * Dynamic generic route. Delegates to the shared handler in
 * `lib/status-handlers.ts`. Literal-segment counterparts at
 * `app/api/status/anthropic/route.ts` and `app/api/status/google/route.ts`
 * call the same handler with a hardcoded slug, so consumers can rely on
 * both URL shapes returning identical JSON.
 *
 * Next.js routes literal segments with higher precedence than dynamic
 * segments, so a request for `/api/status/anthropic` is served by the
 * literal route file; requests for any other slug fall through to this
 * dynamic route. Either way the behaviour is the same.
 */

import { handleStatusObservation } from "@/lib/status-handlers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface RouteParams {
  provider: string;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<RouteParams> }
) {
  const { provider } = await params;
  return handleStatusObservation(provider);
}
