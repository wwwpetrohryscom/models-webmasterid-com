import type { ModelEntity } from "@/lib/types";
import { unknownLabel } from "@/lib/utils";

function val(v: unknown): string {
  if (v === null || v === undefined) return unknownLabel();
  if (Array.isArray(v)) return v.length ? v.join(", ") : unknownLabel();
  return String(v);
}

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
  const rows: { label: string; a: string; b: string }[] = [
    { label: "Provider", a: providerA, b: providerB },
    { label: "Release date", a: val(a.releaseDate), b: val(b.releaseDate) },
    {
      label: "Context window",
      a: val(a.contextWindow),
      b: val(b.contextWindow),
    },
    {
      label: "Modality",
      a: val(a.modality),
      b: val(b.modality),
    },
    {
      label: "Regions",
      a: val(a.infrastructure.regions),
      b: val(b.infrastructure.regions),
    },
    {
      label: "Avg latency (ms)",
      a: val(a.infrastructure.avgLatencyMs),
      b: val(b.infrastructure.avgLatencyMs),
    },
    {
      label: "Uptime (%)",
      a: val(a.infrastructure.uptimePercent),
      b: val(b.infrastructure.uptimePercent),
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
              <td className="px-4 py-2 text-muted-foreground">{row.a}</td>
              <td className="px-4 py-2 text-muted-foreground">{row.b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
