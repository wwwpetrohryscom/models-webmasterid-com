import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OutcomePage } from "@/components/outcomes/OutcomePage";
import { buildMetadata } from "@/lib/seo";
import { getOutcomeUseCase } from "@/lib/outcome-use-cases";

const SLUG = "ai-model-evaluation-for-developers" as const;

export const metadata: Metadata = (() => {
  const o = getOutcomeUseCase(SLUG);
  return buildMetadata({
    title: o?.title ?? "AI model evaluation for developers",
    description: o?.summary,
    path: `/use-cases/${SLUG}`,
    keywords: [
      "ai model evaluation for developers",
      "developer model evaluation",
      "model evaluation workflow",
      "evidence brief",
    ],
  });
})();

export default function Page() {
  const outcome = getOutcomeUseCase(SLUG);
  if (!outcome) notFound();
  return <OutcomePage outcome={outcome} />;
}
