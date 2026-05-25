import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OutcomePage } from "@/components/outcomes/OutcomePage";
import { buildMetadata } from "@/lib/seo";
import { getOutcomeUseCase } from "@/lib/outcome-use-cases";

const SLUG = "ai-model-selection-for-product-teams" as const;

export const metadata: Metadata = (() => {
  const o = getOutcomeUseCase(SLUG);
  return buildMetadata({
    title: o?.title ?? "AI model selection for product teams",
    description: o?.summary,
    path: `/use-cases/${SLUG}`,
    keywords: [
      "ai model selection for product teams",
      "product team model selection",
      "decision brief",
      "model evaluation",
    ],
  });
})();

export default function Page() {
  const outcome = getOutcomeUseCase(SLUG);
  if (!outcome) notFound();
  return <OutcomePage outcome={outcome} />;
}
