import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Docs",
  description:
    "How WebmasterID Models structures, verifies, and surfaces AI model intelligence.",
  path: "/docs",
});

export default function DocsPage() {
  return (
    <PageShell
      eyebrow="Documentation"
      title="Docs"
      intro="How WebmasterID Models is structured, how data is verified, and how to read the verification badges that appear across the platform."
    >
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Docs", href: "/docs" },
        ])}
      />

      <article className="card-surface space-y-4 p-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-base font-semibold text-foreground">
            Entity model
          </h2>
          <p className="mt-2">
            WebmasterID Models is built around a small set of entity types:
            <strong className="text-foreground"> ModelEntity</strong>,
            <strong className="text-foreground"> ProviderEntity</strong>,
            <strong className="text-foreground"> BenchmarkEntity</strong>,
            <strong className="text-foreground"> PricingEntity</strong>,
            <strong className="text-foreground"> ComparisonEntity</strong>,
            <strong className="text-foreground"> RegionEntity</strong>, and
            <strong className="text-foreground"> StatusEntity</strong>. Each
            has a stable slug, a description, and verification metadata.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            Verification states
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong className="text-foreground">Verified</strong> — fields
              confirmed against an official primary source within the latest
              check interval.
            </li>
            <li>
              <strong className="text-foreground">Partial</strong> — entity
              identity is confirmed but some fields are unverified.
            </li>
            <li>
              <strong className="text-foreground">Unverified</strong> — the
              entity is known to exist but no fields have been confirmed
              against a primary source yet.
            </li>
            <li>
              <strong className="text-foreground">Deprecated</strong> — the
              entity is no longer current and is retained for reference only.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            “Data not yet verified.”
          </h2>
          <p className="mt-2">
            When a metric — pricing, latency, uptime, benchmark score,
            release date — has not been confirmed against an official source,
            it is rendered as “Data not yet verified.” rather than an
            estimate. The platform does not extrapolate, average, or
            interpolate values.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            Sources
          </h2>
          <p className="mt-2">
            Each entity supports{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              sourceUrl
            </code>
            ,{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              sourceName
            </code>
            ,{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              sourceType
            </code>
            ,{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              lastCheckedAt
            </code>
            , and{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              confidenceLevel
            </code>{" "}
            fields. Preference is given to official vendor documentation and
            primary sources over secondary summaries.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-foreground">
            Crawler endpoints
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <Link
                href="/sitemap.xml"
                className="text-primary hover:underline"
              >
                /sitemap.xml
              </Link>
            </li>
            <li>
              <Link href="/robots.txt" className="text-primary hover:underline">
                /robots.txt
              </Link>
            </li>
            <li>
              <Link href="/llms.txt" className="text-primary hover:underline">
                /llms.txt
              </Link>
            </li>
            <li>
              <Link href="/rss.xml" className="text-primary hover:underline">
                /rss.xml
              </Link>
            </li>
          </ul>
        </section>
      </article>
    </PageShell>
  );
}
