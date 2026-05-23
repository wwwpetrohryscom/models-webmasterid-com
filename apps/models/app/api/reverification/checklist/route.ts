/**
 * /api/reverification/checklist
 *
 * Operational checklist export. Same filters as /reverification:
 *   - ?priority=critical|high|medium|low
 *   - ?reason=<ReverificationReason>
 *   - ?provider=<provider slug>
 *   - ?entityType=<ReverificationEntityType>
 *   - ?freshness=<FreshnessState>
 *   - ?format=json (default: text/markdown)
 *
 * Pure local read — no fetch, no env reads, no Date.now(). No
 * secrets. Returns Markdown by default so a reviewer can paste it
 * into a notebook or a PR description. JSON variant exposed for
 * partner dashboards.
 */

import { NextResponse, type NextRequest } from "next/server";
import { siteConfig } from "@/lib/site-config";
import {
  getReverificationQueue,
  type ReverificationQueueItem,
} from "@/lib/reverification";
import {
  freshnessLabel,
  priorityLabel,
  reasonLabel,
  REVERIFICATION_POLICY_NOTE,
  type FreshnessPriority,
  type FreshnessState,
  type ReverificationReason,
} from "@/lib/source-freshness";

export const dynamic = "force-dynamic";

function applyFilters(
  items: ReverificationQueueItem[],
  filters: {
    priority?: FreshnessPriority;
    reason?: ReverificationReason;
    provider?: string;
    entityType?: string;
    freshness?: FreshnessState;
  }
): ReverificationQueueItem[] {
  return items.filter((item) => {
    if (filters.priority && item.priority !== filters.priority) return false;
    if (filters.reason && item.reason !== filters.reason) return false;
    if (filters.provider && item.providerSlug !== filters.provider)
      return false;
    if (filters.entityType && item.entityType !== filters.entityType)
      return false;
    if (filters.freshness && item.freshnessState !== filters.freshness)
      return false;
    return true;
  });
}

function buildMarkdown(
  items: ReverificationQueueItem[],
  filters: Record<string, string | undefined>
): string {
  const buf: string[] = [];
  buf.push("# WebmasterID Models Reverification Checklist");
  buf.push("");
  buf.push(`Build date: ${siteConfig.buildDate}`);
  buf.push(`Queue items: ${items.length}`);
  const activeFilters = Object.entries(filters)
    .filter(([, v]) => Boolean(v))
    .map(([k, v]) => `${k}=${v}`);
  if (activeFilters.length) {
    buf.push(`Filters: ${activeFilters.join(", ")}`);
  }
  buf.push("");
  buf.push(`> ${REVERIFICATION_POLICY_NOTE}`);
  buf.push("");

  const priorities: FreshnessPriority[] = [
    "critical",
    "high",
    "medium",
    "low",
  ];
  for (const priority of priorities) {
    const subset = items.filter((i) => i.priority === priority);
    if (!subset.length) continue;
    buf.push(
      `## ${priorityLabel(priority)} priority (${subset.length})`
    );
    buf.push("");
    for (const item of subset) {
      buf.push(`- [ ] **${item.title}**`);
      buf.push(`  - Entity type: \`${item.entityType}\``);
      if (item.providerSlug) {
        buf.push(`  - Provider: \`${item.providerSlug}\``);
      }
      buf.push(`  - Reason: ${reasonLabel(item.reason)}`);
      buf.push(
        `  - Freshness: ${freshnessLabel(item.freshnessState)}`
      );
      if (item.lastCheckedAt) {
        buf.push(`  - Last checked: ${item.lastCheckedAt}`);
      }
      if (item.sourceUrl) {
        buf.push(
          `  - Source: ${item.sourceName ? `${item.sourceName} — ` : ""}${item.sourceUrl}`
        );
      }
      if (item.blockedReason) {
        buf.push(`  - Blocked reason: \`${item.blockedReason}\``);
      }
      buf.push(
        `  - Affected routes: ${item.affectedRoutes
          .map((r) => `\`${r}\``)
          .join(", ")}`
      );
      buf.push(`  - Suggested action: ${item.suggestedAction}`);
      buf.push("");
    }
  }

  return buf.join("\n");
}

export function GET(req: NextRequest) {
  const url = new URL(req.url);
  const filters = {
    priority: (url.searchParams.get("priority") ?? undefined) as
      | FreshnessPriority
      | undefined,
    reason: (url.searchParams.get("reason") ?? undefined) as
      | ReverificationReason
      | undefined,
    provider: url.searchParams.get("provider") ?? undefined,
    entityType: url.searchParams.get("entityType") ?? undefined,
    freshness: (url.searchParams.get("freshness") ?? undefined) as
      | FreshnessState
      | undefined,
  };
  const format = url.searchParams.get("format") ?? "markdown";

  const items = applyFilters(getReverificationQueue(), filters);

  if (format === "json") {
    return NextResponse.json(
      {
        name: "WebmasterID Models Reverification Checklist",
        buildDate: siteConfig.buildDate,
        policy: REVERIFICATION_POLICY_NOTE,
        filters,
        count: items.length,
        items,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=300",
          "X-Robots-Tag": "noindex",
        },
      }
    );
  }

  const md = buildMarkdown(
    items,
    filters as unknown as Record<string, string | undefined>
  );
  return new NextResponse(md, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "X-Robots-Tag": "noindex",
    },
  });
}
