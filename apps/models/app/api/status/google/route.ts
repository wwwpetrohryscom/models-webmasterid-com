/**
 * /api/status/google — literal-segment route. Forwards to the shared
 * handler. See the architecture note on
 * `app/api/status/anthropic/route.ts` for why literal + dynamic
 * coexist.
 */

import { handleStatusObservation } from "@/lib/status-handlers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return handleStatusObservation("google");
}
