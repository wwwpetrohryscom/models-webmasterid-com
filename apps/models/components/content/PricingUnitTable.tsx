import type { PricingUnit } from "@/lib/types";

/**
 * Reference table for the PricingUnit enum. Used by /docs/pricing-fields
 * and /research/api-pricing-methodology. Static, source-discipline-safe.
 *
 * IMPORTANT: this table documents the *vocabulary*, not specific amounts.
 * Per-provider verified amounts live on model records and render
 * through the existing PricingTable component.
 */
interface PricingUnitRow {
  unit: PricingUnit;
  family: "Base" | "Cache" | "Prompt-size tier" | "Batch" | "Non-token" | "Placeholder";
  meaning: string;
  /** Provider examples — only mention providers WITH verified pricing for that unit. */
  verifiedAt?: string;
  notes?: string;
}

const ROWS: PricingUnitRow[] = [
  {
    unit: "1M input tokens",
    family: "Base",
    meaning: "Per-million-tokens input rate for synchronous requests.",
    verifiedAt: "Anthropic, Google, DeepSeek",
  },
  {
    unit: "1M output tokens",
    family: "Base",
    meaning: "Per-million-tokens output rate for synchronous requests.",
    verifiedAt: "Anthropic, Google, DeepSeek",
  },
  {
    unit: "1M cache write tokens (5m)",
    family: "Cache",
    meaning: "Anthropic-style TTL cache write fee — 5-minute window.",
    verifiedAt: "Anthropic",
  },
  {
    unit: "1M cache write tokens (1h)",
    family: "Cache",
    meaning: "Anthropic-style TTL cache write fee — 1-hour window.",
    verifiedAt: "Anthropic",
  },
  {
    unit: "1M cache read tokens",
    family: "Cache",
    meaning:
      "Anthropic-style cache read; also used for DeepSeek-style cache-hit input.",
    verifiedAt: "Anthropic, DeepSeek",
  },
  {
    unit: "1M cache storage / hour",
    family: "Cache",
    meaning:
      "Google-style per-hour cache storage rate. Independent of cache write fee.",
    verifiedAt: "Google",
    notes:
      "NOT interchangeable with the Anthropic TTL units — different semantics.",
  },
  {
    unit: "1M input tokens (>200k context)",
    family: "Prompt-size tier",
    meaning:
      "Surcharge rate for input on prompts exceeding 200k tokens.",
    verifiedAt: "Google",
  },
  {
    unit: "1M output tokens (>200k context)",
    family: "Prompt-size tier",
    meaning: "Output surcharge for prompts exceeding 200k tokens.",
    verifiedAt: "Google",
  },
  {
    unit: "1M cache write tokens (>200k context)",
    family: "Prompt-size tier",
    meaning: "Cache write surcharge for prompts exceeding 200k tokens.",
    verifiedAt: "Google",
  },
  {
    unit: "1M batch input tokens",
    family: "Batch",
    meaning:
      "Batch-API input rate (typically 50% of synchronous; higher latency).",
    verifiedAt: "Anthropic, Google",
  },
  {
    unit: "1M batch output tokens",
    family: "Batch",
    meaning:
      "Batch-API output rate (typically 50% of synchronous; higher latency).",
    verifiedAt: "Anthropic, Google",
  },
  {
    unit: "1M batch input tokens (>200k context)",
    family: "Batch",
    meaning: "Batch surcharge for inputs exceeding 200k tokens.",
    verifiedAt: "Google",
  },
  {
    unit: "1M batch output tokens (>200k context)",
    family: "Batch",
    meaning: "Batch surcharge for outputs exceeding 200k tokens.",
    verifiedAt: "Google",
  },
  {
    unit: "request",
    family: "Non-token",
    meaning: "Per-request fee. Rare across the providers tracked.",
  },
  {
    unit: "image",
    family: "Non-token",
    meaning:
      "Per-image fee for image generation or vision-pricing schedules.",
  },
  {
    unit: "minute",
    family: "Non-token",
    meaning: "Per-minute fee for audio/transcription products.",
  },
  {
    unit: "unknown",
    family: "Placeholder",
    meaning:
      "Reserved for rows whose unit semantics have not been verified.",
    notes:
      "Integrity guard refuses any row with a verified amount AND this unit.",
  },
];

export function PricingUnitTable() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-sm">
        <caption className="sr-only">
          PricingUnit enum reference
        </caption>
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 text-left">
              Unit
            </th>
            <th scope="col" className="px-3 py-2 text-left">
              Family
            </th>
            <th scope="col" className="px-3 py-2 text-left">
              Meaning
            </th>
            <th scope="col" className="px-3 py-2 text-left">
              Verified for
            </th>
          </tr>
        </thead>
        <tbody className="bg-card">
          {ROWS.map((r) => (
            <tr key={r.unit} className="border-t border-border align-top">
              <th
                scope="row"
                className="px-3 py-2 text-left font-mono text-xs font-medium text-foreground"
              >
                {r.unit}
              </th>
              <td className="px-3 py-2 text-xs text-muted-foreground">
                {r.family}
              </td>
              <td className="px-3 py-2 text-sm text-foreground">
                {r.meaning}
                {r.notes ? (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {r.notes}
                  </span>
                ) : null}
              </td>
              <td className="px-3 py-2 text-xs text-muted-foreground">
                {r.verifiedAt ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
