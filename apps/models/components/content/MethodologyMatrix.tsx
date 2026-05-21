import type { ReactNode } from "react";

/**
 * Generic responsive matrix for cross-cutting comparisons used across
 * research and docs pages. Pure server component, semantic <table>,
 * accessible caption, sticky-friendly first column.
 *
 * Cells accept plain text or ReactNode (for rendering verified-field
 * components, links, inline code, etc.). The intent is methodology
 * comparison — DO NOT use this to publish unverified per-model
 * metrics; for that use the existing VerifiedField + PricingTable
 * pipeline.
 */
export interface MatrixRow {
  label: string;
  /** Same length as `columns`, indexed positionally. */
  cells: ReactNode[];
  /** Optional supporting note rendered under the label. */
  note?: string;
}

export function MethodologyMatrix({
  caption,
  columns,
  rows,
  ariaLabel,
}: {
  caption: string;
  columns: string[];
  rows: MatrixRow[];
  ariaLabel?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-sm" aria-label={ariaLabel ?? caption}>
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2 text-left">
              {/* label column header intentionally blank — the row label is the axis */}
            </th>
            {columns.map((c) => (
              <th key={c} scope="col" className="px-4 py-2 text-left">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-card">
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-border align-top">
              <th
                scope="row"
                className="px-4 py-3 text-left text-sm font-medium text-foreground"
              >
                <span className="block">{row.label}</span>
                {row.note ? (
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    {row.note}
                  </span>
                ) : null}
              </th>
              {row.cells.map((cell, i) => (
                <td
                  key={`${row.label}-${i}`}
                  className="px-4 py-3 text-sm text-foreground"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
