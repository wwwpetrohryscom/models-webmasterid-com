/**
 * /api/status/[provider]/latest
 *
 * Dynamic generic route — see `app/api/status/[provider]/route.ts` for
 * the full architecture note. Delegates to the shared handler.
 */

import { handleStatusLatest } from "@/lib/status-handlers";

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
  return handleStatusLatest(provider);
}
