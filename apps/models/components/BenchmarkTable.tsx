import type { BenchmarkScore } from "@/lib/types";
import { unknownLabel } from "@/lib/utils";

export function BenchmarkTable({
  scores,
  caption,
}: {
  scores: BenchmarkScore[];
  caption?: string;
}) {
  if (!scores.length) {
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
              <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                {s.score === null ? unknownLabel() : s.score.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
