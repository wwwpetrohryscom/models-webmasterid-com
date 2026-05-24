/**
 * /api/briefs/decision
 *
 * Decision-brief export endpoint. Accepts the same filter params as
 * /briefs/build:
 *   - ?models=<comma-list>
 *   - ?useCase=<slug>
 *   - ?fields=<comma-list>
 *   - ?format=markdown | json (default: markdown)
 *
 * Pure local derivation. No fetch, no env, no Date.now. The brief is
 * an evidence pack — never a recommendation. The response always
 * sets X-Robots-Tag: noindex so generated briefs do not enter the
 * index from outside.
 */

import { NextResponse, type NextRequest } from "next/server";
import {
  buildDecisionBrief,
  decisionBriefToJson,
  decisionBriefToMarkdown,
  DECISION_BRIEF_DEFAULT_FIELDS,
  getDecisionBriefDefaults,
  type DecisionBriefField,
} from "@/lib/decision-briefs";
import type { ModelUseCaseSlug } from "@/lib/use-cases";

export const dynamic = "force-dynamic";

function splitParam(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function GET(req: NextRequest) {
  const url = new URL(req.url);
  const useCase = (url.searchParams.get("useCase") ?? undefined) as
    | ModelUseCaseSlug
    | undefined;
  const modelSlugs = splitParam(url.searchParams.get("models"));
  const fieldParam = splitParam(
    url.searchParams.get("fields")
  ) as DecisionBriefField[];
  const format = url.searchParams.get("format") ?? "markdown";

  let effectiveSlugs = modelSlugs;
  if (effectiveSlugs.length === 0 && useCase) {
    effectiveSlugs = getDecisionBriefDefaults(useCase).modelSlugs;
  }
  const fields =
    fieldParam.length > 0 ? fieldParam : DECISION_BRIEF_DEFAULT_FIELDS;

  const brief = buildDecisionBrief({
    modelSlugs: effectiveSlugs,
    useCase,
    fields,
  });

  if (format === "json") {
    return NextResponse.json(decisionBriefToJson(brief), {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300",
        "X-Robots-Tag": "noindex",
      },
    });
  }

  // Default: markdown.
  const md = decisionBriefToMarkdown(brief);
  return new NextResponse(md, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "X-Robots-Tag": "noindex",
    },
  });
}
