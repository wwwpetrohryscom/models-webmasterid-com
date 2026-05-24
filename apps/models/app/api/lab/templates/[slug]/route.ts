/**
 * /api/lab/templates/[slug]
 *
 * Markdown export of a lab template. Pure local read — no fetch,
 * no env, no Date.now, no user input. The endpoint always sets
 * X-Robots-Tag: noindex so generated planning templates do not
 * enter the index from outside.
 *
 * Supported slugs:
 *   - /api/lab/templates/model-evaluation-plan
 *   - /api/lab/templates/prompt-test-matrix
 *   - /api/lab/templates/automation-risk-checklist
 *
 * Cache: public, max-age=300, s-maxage=300.
 */

import { NextResponse } from "next/server";
import {
  getLabTemplate,
  getLabTemplates,
  labTemplateToMarkdown,
} from "@/lib/lab-playbooks";

export const dynamic = "force-static";

export function generateStaticParams(): Array<{ slug: string }> {
  return getLabTemplates().map((t) => ({ slug: t.slug }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const template = getLabTemplate(slug);
  if (!template) {
    return new NextResponse("Template not found.\n", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Robots-Tag": "noindex",
      },
    });
  }

  const md = labTemplateToMarkdown(template);
  return new NextResponse(md, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "X-Robots-Tag": "noindex",
    },
  });
}
