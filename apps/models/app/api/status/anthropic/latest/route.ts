/**
 * /api/status/anthropic/latest — literal-segment route. Forwards to the
 * shared handler so the response is identical to
 * /api/status/[provider]/latest with provider=anthropic.
 */

import { handleStatusLatest } from "@/lib/status-handlers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return handleStatusLatest("anthropic");
}
