/**
 * /api/status/google/latest — literal-segment route. Forwards to the
 * shared handler.
 */

import { handleStatusLatest } from "@/lib/status-handlers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return handleStatusLatest("google");
}
