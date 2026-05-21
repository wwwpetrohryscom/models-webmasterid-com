import type { ReactNode } from "react";

/**
 * Reference-style table for documenting an enum or a record schema —
 * used by /docs pages to render VerificationStatus, SourceType,
 * ObservedStatus, ModelEntity fields, etc.
 *
 * Each row carries an identifier (rendered in monospace), a human-
 * friendly title, a definition, and optional rules notes. Pure server
 * component.
 */
export interface FieldDefinitionRow {
  identifier: string;
  title?: string;
  definition: ReactNode;
  rule?: ReactNode;
}

export function FieldDefinitionTable({
  caption,
  identifierHeader = "Identifier",
  rows,
}: {
  caption: string;
  identifierHeader?: string;
  rows: FieldDefinitionRow[];
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-sm" aria-label={caption}>
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 text-left">
              {identifierHeader}
            </th>
            <th scope="col" className="px-3 py-2 text-left">
              Definition
            </th>
            <th scope="col" className="px-3 py-2 text-left">
              Rule / note
            </th>
          </tr>
        </thead>
        <tbody className="bg-card">
          {rows.map((row) => (
            <tr key={row.identifier} className="border-t border-border align-top">
              <th
                scope="row"
                className="px-3 py-2 text-left font-mono text-xs font-medium text-foreground"
              >
                <span className="block">{row.identifier}</span>
                {row.title ? (
                  <span className="mt-0.5 block font-sans text-[11px] font-normal text-muted-foreground">
                    {row.title}
                  </span>
                ) : null}
              </th>
              <td className="px-3 py-2 text-sm text-foreground">
                {row.definition}
              </td>
              <td className="px-3 py-2 text-xs text-muted-foreground">
                {row.rule ?? <span aria-hidden>—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
