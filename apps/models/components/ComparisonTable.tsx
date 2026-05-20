import type { ModelEntity } from "@/lib/types";
import { VerifiedField } from "./VerifiedField";

/**
 * Attribute-by-attribute side-by-side. Each cell is rendered through
 * `<VerifiedField>` so unsourced values cannot leak in — the table cannot
 * declare a winner because it does not assign one.
 */
export function ComparisonTable({
  a,
  b,
  providerA,
  providerB,
}: {
  a: ModelEntity;
  b: ModelEntity;
  providerA: string;
  providerB: string;
}) {
  const rows: {
    label: string;
    a: React.ReactNode;
    b: React.ReactNode;
  }[] = [
    {
      label: "Provider",
      a: providerA,
      b: providerB,
    },
    {
      label: "Snapshot date",
      a: <VerifiedField field={a.snapshotDate} label="snapshot date" />,
      b: <VerifiedField field={b.snapshotDate} label="snapshot date" />,
    },
    {
      label: "Context window (tokens)",
      a: (
        <VerifiedField
          field={a.contextWindow}
          format={(v) => v.toLocaleString("en-US")}
          label="context window"
        />
      ),
      b: (
        <VerifiedField
          field={b.contextWindow}
          format={(v) => v.toLocaleString("en-US")}
          label="context window"
        />
      ),
    },
    {
      label: "Max output (tokens)",
      a: (
        <VerifiedField
          field={a.maxOutputTokens}
          format={(v) => v.toLocaleString("en-US")}
          label="max output"
        />
      ),
      b: (
        <VerifiedField
          field={b.maxOutputTokens}
          format={(v) => v.toLocaleString("en-US")}
          label="max output"
        />
      ),
    },
    {
      label: "Modality",
      a: (
        <VerifiedField
          field={a.modality}
          format={(v) => v.join(", ")}
          label="modality"
        />
      ),
      b: (
        <VerifiedField
          field={b.modality}
          format={(v) => v.join(", ")}
          label="modality"
        />
      ),
    },
    {
      label: "Lifecycle",
      a: (
        <VerifiedField
          field={a.lifecycle}
          format={(v) =>
            v.retirementDate
              ? `${v.status} (retires ${v.retirementDate})`
              : v.status
          }
          label="lifecycle"
        />
      ),
      b: (
        <VerifiedField
          field={b.lifecycle}
          format={(v) =>
            v.retirementDate
              ? `${v.status} (retires ${v.retirementDate})`
              : v.status
          }
          label="lifecycle"
        />
      ),
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2 text-left">
              Attribute
            </th>
            <th scope="col" className="px-4 py-2 text-left">
              {a.name}
            </th>
            <th scope="col" className="px-4 py-2 text-left">
              {b.name}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-border">
              <th
                scope="row"
                className="px-4 py-2 text-left font-medium text-foreground"
              >
                {row.label}
              </th>
              <td className="px-4 py-2 align-top text-foreground">{row.a}</td>
              <td className="px-4 py-2 align-top text-foreground">{row.b}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        This table compares verified attributes only; cells with no verified
        value display the canonical unverified-data label. WebmasterID
        Models does not declare a winner.
      </p>
    </div>
  );
}
