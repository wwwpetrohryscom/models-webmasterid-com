import Link from "next/link";
import { providers } from "@/data/providers";
import { models } from "@/data/models";
import { isVerified } from "@/lib/verified";
import { findObserversForProvider } from "@/lib/observers";

/**
 * Live coverage matrix derived from the data layer.
 *
 * Rows are the providers in the catalogue (in declaration order). Columns
 * are the verification dimensions WebmasterID Models tracks. Every cell
 * is computed from the typed local data — nothing here is asserted.
 *
 * Pure server component. Used by /providers, /coverage, and
 * /docs/provider-coverage.
 */
export function ProviderCoverageMatrix() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-sm" aria-label="Provider coverage matrix">
        <caption className="sr-only">
          Provider coverage by verified dimension
        </caption>
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 text-left">
              Provider
            </th>
            <th scope="col" className="px-3 py-2 text-left">
              Status
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              Verified models
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              Verified pricing rows
            </th>
            <th scope="col" className="px-3 py-2 text-left">
              API docs
            </th>
            <th scope="col" className="px-3 py-2 text-left">
              Pricing docs
            </th>
            <th scope="col" className="px-3 py-2 text-left">
              Status observer
            </th>
          </tr>
        </thead>
        <tbody className="bg-card">
          {providers.map((p) => {
            const providerModels = models.filter(
              (m) => m.providerSlug === p.slug
            );
            const verifiedCount = providerModels.filter(
              (m) => m.verificationStatus === "verified"
            ).length;
            const verifiedPricingRows = providerModels.flatMap((m) =>
              m.pricing.filter((t) => isVerified(t.amount))
            );
            const observer = findObserversForProvider(p.slug);
            return (
              <tr key={p.slug} className="border-t border-border align-top">
                <th
                  scope="row"
                  className="px-3 py-2 text-left font-medium text-foreground"
                >
                  <Link
                    href={`/providers/${p.slug}`}
                    className="hover:underline"
                  >
                    {p.name}
                  </Link>
                </th>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {p.verificationStatus}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {verifiedCount}{" "}
                  <span className="text-xs text-muted-foreground">
                    / {providerModels.length}
                  </span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {verifiedPricingRows.length}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {p.apiDocsUrl ? (
                    <Link
                      href={p.apiDocsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      linked
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {p.pricingUrl ? (
                    <Link
                      href={p.pricingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      linked
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {observer.length > 0
                    ? `${observer.length} observer${observer.length === 1 ? "" : "s"}`
                    : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
