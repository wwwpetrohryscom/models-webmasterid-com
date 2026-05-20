import type { PricingTier } from "@/lib/types";
import { formatUsd, unknownLabel } from "@/lib/utils";

export function PricingTable({
  tiers,
  caption,
}: {
  tiers: PricingTier[];
  caption?: string;
}) {
  if (!tiers.length) {
    return (
      <p className="text-sm text-muted-foreground">{unknownLabel()}</p>
    );
  }
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
              <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                {formatUsd(t.amountUsd)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
