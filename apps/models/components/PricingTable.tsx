import type { VerifiedPricingTier } from "@/lib/types";
import { isVerified } from "@/lib/verified";
import { VerifiedField } from "./VerifiedField";
import { DataNotVerified } from "./DataNotVerified";
import { formatUsd } from "@/lib/utils";

export function PricingTable({
  tiers,
  caption,
}: {
  tiers: VerifiedPricingTier[];
  caption?: string;
}) {
  if (!tiers.length) {
    return <DataNotVerified />;
  }
  const anyVerified = tiers.some((t) => isVerified(t.amount));

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2 text-left">
              Unit
            </th>
            <th scope="col" className="px-4 py-2 text-right">
              Price (USD)
            </th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((t) => (
            <tr key={t.unit} className="border-t border-border">
              <th
                scope="row"
                className="px-4 py-2 text-left font-medium text-foreground"
              >
                {t.unit}
              </th>
              <td className="px-4 py-2 text-right tabular-nums">
                <VerifiedField field={t.amount} format={formatUsd} label={t.unit} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!anyVerified ? (
        <p className="border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
          No verified rates for this model yet — see VERIFICATION.md.
        </p>
      ) : null}
    </div>
  );
}
