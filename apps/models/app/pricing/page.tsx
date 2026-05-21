import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { VerificationBadge } from "@/components/VerificationBadge";
import { VerifiedField } from "@/components/VerifiedField";
import { DataNotVerified } from "@/components/DataNotVerified";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { models } from "@/data/models";
import { getProviderBySlug } from "@/data/providers";
import { formatDateISO, formatUsd, unknownLabel } from "@/lib/utils";
import { isVerified } from "@/lib/verified";

export const metadata: Metadata = buildMetadata({
  title: "AI API Pricing",
  description:
    "API pricing across tracked AI models. Where rates have not been verified against official provider documentation, the platform marks them unverified rather than substituting estimates.",
  path: "/pricing",
});

export default function PricingPage() {
  const verifiedRows = models.filter((m) =>
    m.pricing.some((t) => isVerified(t.amount))
  );
  const unverifiedRows = models.filter(
    (m) => !m.pricing.some((t) => isVerified(t.amount))
  );

  return (
    <PageShell
      eyebrow="Hub"
      title="AI API Pricing"
      intro="Per-unit API pricing for tracked models. Pricing values are only displayed when sourced from official provider documentation. Cache and batch pricing surface here when published by the vendor."
    >
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Pricing", href: "/pricing" },
        ])}
      />

      <aside
        role="note"
        aria-label="Pricing caveat"
        className="card-surface p-4 text-sm text-muted-foreground"
      >
        <p>
          Pricing changes frequently. Each verified row links back to the
          vendor's official pricing page and records when the value was
          last retrieved. Always confirm against the live source before
          making cost projections.
        </p>
      </aside>

      <section aria-label="Cache-pricing semantics" className="card-surface p-4 text-sm text-muted-foreground">
        <h2 className="text-base font-semibold text-foreground">
          Cache-pricing semantics differ across providers
        </h2>
        <p className="mt-2">
          We do not collapse provider-specific cache pricing into a single
          row. Anthropic publishes per-token TTL cache writes (5-minute and
          1-hour windows) and per-token cache reads. Google publishes a
          per-hour cache <em>storage</em> rate alongside a one-shot cache
          write fee. DeepSeek publishes an input cache-hit rate. Each row
          on this page carries the unit semantics published by the vendor —
          the &quot;Cache hit / 1M&quot; column below shows the cache-read
          (or cache-hit-input) rate where the provider publishes one, and
          renders <DataNotVerified /> otherwise.
        </p>
      </section>

      <section aria-label="Verified pricing" className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          Verified pricing ({verifiedRows.length})
        </h2>
        {verifiedRows.length ? (
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
                    Input / 1M
                  </th>
                  <th scope="col" className="px-4 py-2 text-right">
                    Output / 1M
                  </th>
                  <th scope="col" className="px-4 py-2 text-right">
                    Cache hit / 1M
                  </th>
                  <th scope="col" className="px-4 py-2 text-right">
                    Batch in / 1M
                  </th>
                  <th scope="col" className="px-4 py-2 text-left">
                    Source
                  </th>
                  <th scope="col" className="px-4 py-2 text-left">
                    Last checked
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card">
                {verifiedRows.map((m) => {
                  const p = getProviderBySlug(m.providerSlug);
                  const input = m.pricing.find(
                    (t) => t.unit === "1M input tokens"
                  );
                  const output = m.pricing.find(
                    (t) => t.unit === "1M output tokens"
                  );
                  const cacheRead = m.pricing.find(
                    (t) => t.unit === "1M cache read tokens"
                  );
                  const batchIn = m.pricing.find(
                    (t) => t.unit === "1M batch input tokens"
                  );
                  const sourceCitation =
                    [input?.amount, output?.amount]
                      .filter((f) => f && isVerified(f))
                      .map((f) => isVerified(f) && f.citation)[0] || null;
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
                        {p ? (
                          <Link
                            href={`/providers/${p.slug}`}
                            className="hover:underline"
                          >
                            {p.name}
                          </Link>
                        ) : (
                          unknownLabel()
                        )}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        <VerifiedField
                          field={input?.amount}
                          format={formatUsd}
                          label="input rate"
                          inlineCitation={false}
                        />
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        <VerifiedField
                          field={output?.amount}
                          format={formatUsd}
                          label="output rate"
                          inlineCitation={false}
                        />
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        <VerifiedField
                          field={cacheRead?.amount}
                          format={formatUsd}
                          label="cache hit"
                          inlineCitation={false}
                        />
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        <VerifiedField
                          field={batchIn?.amount}
                          format={formatUsd}
                          label="batch input"
                          inlineCitation={false}
                        />
                      </td>
                      <td className="px-4 py-2 text-left">
                        {sourceCitation ? (
                          <Link
                            href={sourceCitation.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline"
                            title={sourceCitation.name}
                          >
                            {sourceCitation.name.split(" — ")[0]}
                          </Link>
                        ) : (
                          <DataNotVerified />
                        )}
                      </td>
                      <td className="px-4 py-2 text-left text-xs text-muted-foreground">
                        {formatDateISO(m.lastCheckedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="card-surface p-4 text-sm text-muted-foreground">
            No verified pricing rows yet.
          </p>
        )}
      </section>

      <section aria-label="Pending verification" className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          Pending verification ({unverifiedRows.length})
        </h2>
        {unverifiedRows.length ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {unverifiedRows.map((m) => {
              const p = getProviderBySlug(m.providerSlug);
              return (
                <li
                  key={m.slug}
                  className="card-surface flex items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/models/${m.slug}`}
                      className="block truncate text-sm font-medium text-foreground hover:underline"
                    >
                      {m.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {p?.name ?? unknownLabel()} ·{" "}
                      <Link
                        href={`/providers/${m.providerSlug}`}
                        className="hover:underline"
                      >
                        provider page
                      </Link>
                    </p>
                  </div>
                  <VerificationBadge status={m.verificationStatus} />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="card-surface p-4 text-sm text-muted-foreground">
            All catalogue entries have at least one verified pricing row.
          </p>
        )}
      </section>
    </PageShell>
  );
}
