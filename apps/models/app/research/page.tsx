import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Research",
  description:
    "Structured research and analysis grounded in the WebmasterID Models entity graph.",
  path: "/research",
});

export default function ResearchPage() {
  return (
    <PageShell
      eyebrow="Analysis"
      title="Research"
      intro="Long-form analyses built on top of the verified entity graph. Every published research note links back to the underlying model, provider, and benchmark records so claims can be checked against source data."
    >
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Research", href: "/research" },
        ])}
      />

      <article className="card-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">
          Research notes are coming
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The first research notes will cover the structure of the model graph
          itself: how WebmasterID Models defines a model entity, how
          verification works, and how comparisons are constructed without
          fabricated metrics. Notes will only ship once they cite verified
          source material end-to-end.
        </p>
      </article>
    </PageShell>
  );
}
