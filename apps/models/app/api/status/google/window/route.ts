/**
 * /api/status/google/window — literal-segment route. Forwards to the
 * shared handler. Same `?hours=` semantics as the dynamic route.
 */

import {
  handleStatusWindow,
  parseWindowHours,
} from "@/lib/status-handlers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const hours = parseWindowHours(url.searchParams.get("hours"));
  return handleStatusWindow("google", hours);
}
