/**
 * /api/reverification
 *
 * Machine-readable view of the reverification queue. Pure derivation
 * from the typed local data layer — no remote fetch, no secrets, no
 * env values surface. Same deterministic build-date semantics as the
 * UI page at /reverification, so a smoke test against this endpoint
 * sees exactly the same queue the page renders.
 */

import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/site-config";
import {
  getReverificationQueue,
  getReverificationSummary,
} from "@/lib/reverification";
import { REVERIFICATION_POLICY_NOTE } from "@/lib/source-freshness";

export const dynamic = "force-static";

export function GET() {
  const queue = getReverificationQueue();
  const summary = getReverificationSummary();
  return NextResponse.json(
    {
      name: "WebmasterID Models Reverification Queue",
      description:
        "Source-freshness review queue derived from the typed local data layer. Items are informational; no automatic mutation of verified values.",
      url: `${siteConfig.url}/reverification`,
      buildDate: siteConfig.buildDate,
      updatedDate: siteConfig.buildDate,
      policy: REVERIFICATION_POLICY_NOTE,
      summary,
      items: queue,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    }
  );
}
