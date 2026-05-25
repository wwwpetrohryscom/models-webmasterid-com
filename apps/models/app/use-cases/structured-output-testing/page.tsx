import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OutcomePage } from "@/components/outcomes/OutcomePage";
import { buildMetadata } from "@/lib/seo";
import { getOutcomeUseCase } from "@/lib/outcome-use-cases";

const SLUG = "structured-output-testing" as const;

export const metadata: Metadata = (() => {
  const o = getOutcomeUseCase(SLUG);
  return buildMetadata({
    title: o?.title ?? "Structured output testing",
    description: o?.summary,
    path: `/use-cases/${SLUG}`,
    keywords: [
      "structured output testing",
      "json mode validation",
      "tool calling tests",
      "schema regression",
    ],
  });
})();

export default function Page() {
  const outcome = getOutcomeUseCase(SLUG);
  if (!outcome) notFound();
  return <OutcomePage outcome={outcome} />;
}
