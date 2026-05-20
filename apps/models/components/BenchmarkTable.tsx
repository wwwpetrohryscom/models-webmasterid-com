import type { VerifiedBenchmarkScore } from "@/lib/types";
import { VerifiedField } from "./VerifiedField";
import { DataNotVerified } from "./DataNotVerified";

export function BenchmarkTable({
  scores,
  caption,
}: {
  scores: VerifiedBenchmarkScore[];
  caption?: string;
}) {
  if (!scores.length) {
    return <DataNotVerified />;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2 text-left">
              Benchmark
            </th>
            <th scope="col" className="px-4 py-2 text-left">
              Metric
            </th>
            <th scope="col" className="px-4 py-2 text-right">
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {scores.map((s) => (
            <tr key={s.benchmark} className="border-t border-border">
              <th
                scope="row"
                className="px-4 py-2 text-left font-medium text-foreground"
              >
                {s.benchmark}
              </th>
              <td className="px-4 py-2 text-muted-foreground">{s.metric}</td>
              <td className="px-4 py-2 text-right tabular-nums">
                <VerifiedField
                  field={s.score}
                  format={(v) => v.toFixed(1)}
                  label={`${s.benchmark} score`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
