import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { VerificationBadge } from "@/components/VerificationBadge";
import { DataNotVerified } from "@/components/DataNotVerified";
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
      intro="Catalogue of evaluation suites tracked across the model graph. The benchmark itself is what we verify here; per-model scores are not yet verified by this platform and are deliberately not published."
    >
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Benchmarks", href: "/benchmarks" },
        ])}
      />

      <aside
        role="note"
        aria-label="Benchmark policy"
        className="card-surface p-4 text-sm text-muted-foreground"
      >
        <p>
          <strong className="text-foreground">Two separate states:</strong>{" "}
          <em>benchmark definition</em> can be verified — the suite exists,
          its category and what it measures can be confirmed against a
          primary source. <em>Benchmark scores</em> for specific models are
          not verified by this platform until an independent reference is
          recorded. Vendor-reported leaderboard numbers are not republished
          here.
        </p>
      </aside>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {benchmarks.map((b) => (
          <li key={b.slug} className="card-surface flex flex-col p-5">
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
            <dl className="mt-4 space-y-1 text-xs">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Definition</dt>
                <dd className="font-medium text-success">verified</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Per-model scores</dt>
                <dd>
                  <DataNotVerified />
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
