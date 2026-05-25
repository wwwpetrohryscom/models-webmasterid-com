import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OutcomePage } from "@/components/outcomes/OutcomePage";
import { buildMetadata } from "@/lib/seo";
import { getOutcomeUseCase } from "@/lib/outcome-use-cases";

const SLUG = "llm-prompt-evaluation" as const;

export const metadata: Metadata = (() => {
  const o = getOutcomeUseCase(SLUG);
  return buildMetadata({
    title: o?.title ?? "LLM prompt evaluation",
    description: o?.summary,
    path: `/use-cases/${SLUG}`,
    keywords: [
      "llm prompt evaluation",
      "evaluation prompt sets",
      "prompt testing",
      "model regression suite",
    ],
  });
})();

export default function Page() {
  const outcome = getOutcomeUseCase(SLUG);
  if (!outcome) notFound();
  return <OutcomePage outcome={outcome} />;
}
