import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { VerificationBadge } from "@/components/VerificationBadge";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { benchmarks } from "@/data/benchmarks";

export const metadata: Metadata = buildMetadata({
  title: "AI Benchmarks",
  description:
    "Benchmarks tracked by WebmasterID Models — reasoning, coding, math, knowledge, multimodal, and agentic evaluation suites.",
  path: "/benchmarks",
});

export default function BenchmarksPage() {
  return (
    <PageShell
      eyebrow="Hub"
      title="AI Benchmarks"
      intro="Catalogue of evaluation suites tracked across the model graph. Per-model scores live on individual model pages so they can be verified independently."
    >
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Benchmarks", href: "/benchmarks" },
        ])}
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {benchmarks.map((b) => (
          <li key={b.slug} className="card-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold text-foreground">
                {b.name}
              </h2>
              <VerificationBadge status={b.verificationStatus} />
            </div>
            <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
              {b.category}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">{b.description}</p>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
