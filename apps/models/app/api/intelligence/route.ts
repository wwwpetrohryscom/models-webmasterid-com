/**
 * /api/intelligence
 *
 * Machine-readable counterpart to /intelligence. Pure local read —
 * no fetch, no env reads, no Date.now(). Returns the workspace
 * summary and canonical destination URLs.
 */

import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/site-config";
import { ROUTE_SET_VERSION } from "@/lib/route-contract";
import {
  getIntelligenceSummary,
  getWorkspaceLinks,
} from "@/lib/intelligence-summary";

export const dynamic = "force-static";

export function GET() {
  const summary = getIntelligenceSummary();
  const links = getWorkspaceLinks();
  const absolute = (path: string) => `${siteConfig.url}${path}`;
  return NextResponse.json(
    {
      name: "WebmasterID Models Intelligence Workspace",
      description:
        "AI model infrastructure intelligence workspace — verified entity counts and canonical destination URLs.",
      url: absolute("/intelligence"),
      buildDate: siteConfig.buildDate,
      updatedDate: siteConfig.buildDate,
      routeSetVersion: ROUTE_SET_VERSION,
      summary: {
        verifiedModels: summary.verifiedModels,
        partiallyVerifiedModels: summary.partiallyVerifiedModels,
        activeModels: summary.activeModels,
        historicalModels: summary.historicalModels,
        verifiedProviders: summary.verifiedProviders,
        partialProviders: summary.partialProviders,
        firstPartyPricingReferences: summary.firstPartyPricingReferences,
        hostedPricingReferences: summary.hostedPricingReferences,
        hostedAvailabilityRecords: summary.hostedAvailabilityRecords,
        twoSidedVerifiedComparisons: summary.twoSidedVerifiedComparisons,
        oneSidedVerifiedComparisons: summary.oneSidedVerifiedComparisons,
        pendingComparisons: summary.pendingComparisons,
        statusObservers: summary.statusObservers,
        sourceCitations: summary.sourceCitations,
        reverificationItems: summary.reverificationItems,
        reverificationCritical: summary.reverificationCritical,
        reverificationHigh: summary.reverificationHigh,
        blockedVendorDocs: summary.blockedVendorDocs,
      },
      routes: {
        models: absolute("/models"),
        providers: absolute("/providers"),
        pricing: absolute("/pricing"),
        compare: absolute("/compare"),
        coverage: absolute("/coverage"),
        sources: absolute("/sources"),
        status: absolute("/status"),
        reverification: absolute("/reverification"),
        research: absolute("/research"),
        docs: absolute("/docs"),
        reverificationApi: absolute("/api/reverification"),
        reverificationChecklist: absolute(
          "/api/reverification/checklist"
        ),
      },
      workspaceLinks: links.map((link) => ({
        label: link.label,
        url: absolute(link.href),
        description: link.description,
      })),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    }
  );
}
