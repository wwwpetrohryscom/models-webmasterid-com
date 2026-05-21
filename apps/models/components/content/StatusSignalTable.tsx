import Link from "next/link";
import { ENABLED_OBSERVERS } from "@/lib/observers";
import { SOURCE_LABEL } from "@/lib/status-observations";

/**
 * Two-row reference table for the status-monitoring pipeline:
 *
 *   - The taxonomy of source values a StatusObservation can carry.
 *   - The set of observers currently registered, derived from
 *     lib/observers/index.ts at render time so the doc cannot drift.
 */
export function StatusSignalTable() {
  // Build a slug → list of source labels map from the registry.
  type Row = { slug: string; sources: string[] };
  const byProvider = new Map<string, Row>();
  for (const o of ENABLED_OBSERVERS) {
    const row = byProvider.get(o.providerSlug) ?? {
      slug: o.providerSlug,
      sources: [],
    };
    row.sources.push(SOURCE_LABEL[o.source]);
    byProvider.set(o.providerSlug, row);
  }
  const observerRows = Array.from(byProvider.values());

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm" aria-label="Status signal taxonomy">
          <caption className="sr-only">Status signal taxonomy</caption>
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2 text-left">
                Signal
              </th>
              <th scope="col" className="px-3 py-2 text-left">
                What it measures
              </th>
              <th scope="col" className="px-3 py-2 text-left">
                Not the same as
              </th>
            </tr>
          </thead>
          <tbody className="bg-card">
            <tr className="border-t border-border align-top">
              <th
                scope="row"
                className="px-3 py-2 text-left font-mono text-xs font-medium text-foreground"
              >
                vendor_status_api
              </th>
              <td className="px-3 py-2 text-sm text-foreground">
                Programmatic vendor feed (Statuspage JSON, Google Cloud
                incidents JSON, etc.). The provider reports on themselves.
              </td>
              <td className="px-3 py-2 text-xs text-muted-foreground">
                an independent uptime measurement
              </td>
            </tr>
            <tr className="border-t border-border align-top">
              <th
                scope="row"
                className="px-3 py-2 text-left font-mono text-xs font-medium text-foreground"
              >
                vendor_status_page
              </th>
              <td className="px-3 py-2 text-sm text-foreground">
                HTML status page consumed without a structured feed.
                Reserved for vendors without JSON.
              </td>
              <td className="px-3 py-2 text-xs text-muted-foreground">
                an independent uptime measurement
              </td>
            </tr>
            <tr className="border-t border-border align-top">
              <th
                scope="row"
                className="px-3 py-2 text-left font-mono text-xs font-medium text-foreground"
              >
                independent_http_probe
              </th>
              <td className="px-3 py-2 text-sm text-foreground">
                Unauthenticated GET issued by WebmasterID against a public,
                non-inference vendor endpoint. Host reachability only — no
                API key, no inference, no billing.
              </td>
              <td className="px-3 py-2 text-xs text-muted-foreground">
                an API request-latency measurement
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table
          className="w-full text-sm"
          aria-label="Currently registered status observers"
        >
          <caption className="sr-only">
            Currently registered status observers
          </caption>
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2 text-left">
                Provider
              </th>
              <th scope="col" className="px-3 py-2 text-left">
                Observer sources
              </th>
              <th scope="col" className="px-3 py-2 text-left">
                Live endpoints
              </th>
            </tr>
          </thead>
          <tbody className="bg-card">
            {observerRows.map((row) => (
              <tr key={row.slug} className="border-t border-border align-top">
                <th
                  scope="row"
                  className="px-3 py-2 text-left font-medium text-foreground"
                >
                  <Link
                    href={`/providers/${row.slug}`}
                    className="hover:underline"
                  >
                    {row.slug}
                  </Link>
                </th>
                <td className="px-3 py-2 text-sm text-foreground">
                  {row.sources.join(" + ")}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  <code className="rounded bg-muted px-1">
                    /api/status/{row.slug}
                  </code>
                  {" · "}
                  <code className="rounded bg-muted px-1">
                    /api/status/{row.slug}/latest
                  </code>
                  {" · "}
                  <code className="rounded bg-muted px-1">
                    /api/status/{row.slug}/window
                  </code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
