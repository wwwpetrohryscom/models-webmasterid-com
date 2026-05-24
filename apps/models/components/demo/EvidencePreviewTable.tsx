import Link from "next/link";
import { getModelBySlug } from "@/data/models";
import { hostedPricingForModel } from "@/data/hosted-pricing";
import { isVerified } from "@/lib/verified";
import {
  freshnessClasses,
  freshnessLabel,
  getFreshnessState,
} from "@/lib/source-freshness";

/**
 * EvidencePreviewTable — renders the verified-field evidence for a
 * set of model slugs as a compact table. Every cell comes from the
 * existing data layer; unknown values render an em-dash, not an
 * invented number. Includes a small footer line that names the
 * preview as derived from current catalogue data.
 */
export function EvidencePreviewTable({
  modelSlugs,
  caption,
}: {
  modelSlugs: string[];
  caption?: string;
}) {
  const rows = modelSlugs
    .map((slug) => getModelBySlug(slug))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));
  if (!rows.length) {
    return (
      <p className="card-surface p-4 text-sm text-muted-foreground">
        No models in this preview yet.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {caption ? (
        <p className="text-[10px] uppercase tracking-[0.18em] text-primary">
          {caption}
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-2 text-left">
                Model
              </th>
              <th scope="col" className="px-4 py-2 text-left">
                Lifecycle
              </th>
              <th scope="col" className="px-4 py-2 text-right">
                Context
              </th>
              <th scope="col" className="px-4 py-2 text-left">
                Modalities
              </th>
              <th scope="col" className="px-4 py-2 text-left">
                Hosted
              </th>
              <th scope="col" className="px-4 py-2 text-right">
                Sources
              </th>
              <th scope="col" className="px-4 py-2 text-left">
                Freshness
              </th>
            </tr>
          </thead>
          <tbody className="bg-card text-xs">
            {rows.map((m) => {
              const hosted = hostedPricingForModel(m.slug);
              const freshness = getFreshnessState(m.lastCheckedAt, {
                category: "model",
              });
              return (
                <tr
                  key={m.slug}
                  className="border-t border-border align-top"
                >
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
                    {isVerified(m.lifecycle)
                      ? m.lifecycle.value.status
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {isVerified(m.contextWindow)
                      ? m.contextWindow.value.toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {isVerified(m.modality)
                      ? m.modality.value.join(", ")
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {hosted.length
                      ? hosted
                          .map((r) => r.billingProviderSlug)
                          .join(", ")
                      : "—"}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {m.citations.length}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${freshnessClasses(freshness)}`}
                    >
                      {freshnessLabel(freshness)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Preview generated from current catalogue data. Every value
        is rendered straight from the verified data layer; unknown
        values stay null.
      </p>
    </div>
  );
}
