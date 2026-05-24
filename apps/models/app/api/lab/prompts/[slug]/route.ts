/**
 * /api/lab/prompts/[slug]
 *
 * Markdown export of an evaluation prompt set. Pure local read — no
 * fetch, no env, no Date.now, no user input beyond the slug. Sets
 * X-Robots-Tag: noindex so generated evaluation prompts never enter
 * the index from outside.
 *
 * Supported slugs:
 *   - summarization-quality
 *   - structured-extraction
 *   - long-context-recall
 *   - instruction-following
 *   - refusal-boundary
 *   - automation-robustness
 *
 * Cache: public, max-age=300, s-maxage=300.
 */

import { NextResponse } from "next/server";
import {
  getEvaluationPromptSet,
  getEvaluationPromptSets,
  promptSetToMarkdown,
} from "@/lib/evaluation-prompts";

export const dynamic = "force-static";

export function generateStaticParams(): Array<{ slug: string }> {
  return getEvaluationPromptSets().map((s) => ({ slug: s.slug }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const set = getEvaluationPromptSet(slug);
  if (!set) {
    return new NextResponse("Prompt set not found.\n", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Robots-Tag": "noindex",
      },
    });
  }

  const md = promptSetToMarkdown(set);
  return new NextResponse(md, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "X-Robots-Tag": "noindex",
    },
  });
}
