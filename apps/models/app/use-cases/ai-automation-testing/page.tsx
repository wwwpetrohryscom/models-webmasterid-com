import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OutcomePage } from "@/components/outcomes/OutcomePage";
import { buildMetadata } from "@/lib/seo";
import { getOutcomeUseCase } from "@/lib/outcome-use-cases";

const SLUG = "ai-automation-testing" as const;

export const metadata: Metadata = (() => {
  const o = getOutcomeUseCase(SLUG);
  return buildMetadata({
    title: o?.title ?? "AI automation testing",
    description: o?.summary,
    path: `/use-cases/${SLUG}`,
    keywords: [
      "ai automation testing",
      "automation workflow testing",
      "model regression testing",
      "automation robustness",
    ],
  });
})();

export default function Page() {
  const outcome = getOutcomeUseCase(SLUG);
  if (!outcome) notFound();
  return <OutcomePage outcome={outcome} />;
}
