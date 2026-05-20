import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { VerificationBadge } from "@/components/VerificationBadge";
import { VerifiedField } from "@/components/VerifiedField";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { models } from "@/data/models";
import { getProviderBySlug } from "@/data/providers";
import { formatUsd, unknownLabel } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "AI API Pricing",
  description:
    "API pricing across tracked AI models. Where rates have not been verified against official provider documentation, the platform marks them unverified rather than substituting estimates.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <PageShell
      eyebrow="Hub"
      title="AI API Pricing"
      intro="Per-unit API pricing for tracked models. Pricing values are only displayed when sourced from official provider documentation."
    >
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Pricing", href: "/pricing" },
        ])}
      />

      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-2 text-left">
                Model
              </th>
              <th scope="col" className="px-4 py-2 text-left">
                Provider
              </th>
              <th scope="col" className="px-4 py-2 text-right">
                Input / 1M tokens
              </th>
              <th scope="col" className="px-4 py-2 text-right">
                Output / 1M tokens
              </th>
              <th scope="col" className="px-4 py-2 text-right">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-card">
            {models.map((m) => {
              const p = getProviderBySlug(m.providerSlug);
              const input = m.pricing.find(
                (t) => t.unit === "1M input tokens"
              );
              const output = m.pricing.find(
                (t) => t.unit === "1M output tokens"
              );
              return (
                <tr key={m.slug} className="border-t border-border">
                  <th
                    scope="row"
                    className="px-4 py-2 text-left font-medium text-foreground"
                  >
                    <Link
                      href={`/models/${m.slug}`}
                      className="hover:underline"
                    >
                      {m.name}
                    </Link>
                  </th>
                  <td className="px-4 py-2 text-muted-foreground">
                    {p?.name ?? unknownLabel()}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    <VerifiedField
                      field={input?.amount}
                      format={formatUsd}
                      label="input rate"
                    />
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    <VerifiedField
                      field={output?.amount}
                      format={formatUsd}
                      label="output rate"
                    />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <VerificationBadge status={m.verificationStatus} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Pricing changes frequently. Once verified against provider
        documentation, each row will record sourceUrl, sourceName, and a
        lastCheckedAt timestamp.
      </p>
    </PageShell>
  );
}
