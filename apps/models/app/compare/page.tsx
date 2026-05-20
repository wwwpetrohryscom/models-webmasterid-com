import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { VerificationBadge } from "@/components/VerificationBadge";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { comparisons } from "@/data/comparisons";

export const metadata: Metadata = buildMetadata({
  title: "Compare AI Models",
  description:
    "Side-by-side AI model comparisons across pricing, benchmarks, infrastructure, and use cases.",
  path: "/compare",
});

export default function CompareIndexPage() {
  return (
    <PageShell
      eyebrow="Side-by-side"
      title="Compare AI Models"
      intro="Each comparison is a structured entity backed by the same model and provider records used across WebmasterID Models. Where values are unverified, they are explicitly marked."
    >
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Compare", href: "/compare" },
        ])}
      />
      <ul className="grid gap-4 sm:grid-cols-2">
        {comparisons.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/compare/${c.slug}`}
              className="card-surface flex h-full flex-col p-5 transition hover:border-primary/30 hover:shadow-elevated"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-foreground">
                  {c.name}
                </h2>
                <VerificationBadge status={c.verificationStatus} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {c.description}
              </p>
              <p className="mt-4 text-xs font-medium text-primary">
                View comparison →
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
