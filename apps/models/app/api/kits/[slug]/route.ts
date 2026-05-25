/**
 * /api/kits/[slug]
 *
 * Markdown export of a workflow kit. Pure local read — no fetch,
 * no env, no Date.now, no user input beyond the slug. Sets
 * X-Robots-Tag: noindex so generated work documents never enter
 * the index from outside.
 *
 * Supported slugs:
 *   - /api/kits/developer-model-evaluation
 *   - /api/kits/automation-workflow-testing
 *   - /api/kits/product-model-selection
 *   - /api/kits/governance-review
 *
 * Cache: public, max-age=300, s-maxage=300.
 */

import { NextResponse } from "next/server";
import {
  getWorkflowKit,
  getWorkflowKits,
  workflowKitToMarkdown,
} from "@/lib/workflow-kits";

export const dynamic = "force-static";

export function generateStaticParams(): Array<{ slug: string }> {
  return getWorkflowKits().map((k) => ({ slug: k.slug }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const kit = getWorkflowKit(slug);
  if (!kit) {
    return new NextResponse("Workflow kit not found.\n", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Robots-Tag": "noindex",
      },
    });
  }

  const md = workflowKitToMarkdown(kit);
  return new NextResponse(md, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "X-Robots-Tag": "noindex",
    },
  });
}
