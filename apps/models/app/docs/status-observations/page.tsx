import type { Metadata } from "next";
import Link from "next/link";
import { ContentPageShell } from "@/components/ContentPageShell";
import { buildMetadata } from "@/lib/seo";
import { getContentPage } from "@/lib/content";
import { MINIMUM_OBSERVATIONS_FOR_UPTIME } from "@/lib/status-store";

const SLUG = "/docs/status-observations";

export const metadata: Metadata = (() => {
  const page = getContentPage(SLUG)!;
  return buildMetadata({
    title: page.title,
    description: page.description,
    path: page.slug,
    keywords: page.keywords,
  });
})();

export default function Page() {
  const page = getContentPage(SLUG)!;
  return (
    <ContentPageShell
      page={page}
      breadcrumbParent={{ name: "Docs", href: "/docs" }}
      toc={[
        { id: "shape", label: "StatusObservation shape" },
        { id: "source", label: "Source values" },
        { id: "observed-status", label: "ObservedStatus values" },
        { id: "latency", label: "latencyMs semantics" },
        { id: "gating", label: "Uptime gating policy" },
        { id: "no-sla", label: "No SLA, no availability claim" },
      ]}
      relatedLinks={[
        {
          href: "/status",
          label: "Status",
          description: "Per-provider observer matrix.",
        },
        {
          href: "/research/ai-provider-status-monitoring",
          label: "AI provider status monitoring",
          description: "Methodology behind these schemas.",
        },
        {
          href: "/coverage",
          label: "Coverage",
          description: "Status observation coverage panel.",
        },
      ]}
    >
      <section id="shape">
        <h2>StatusObservation shape</h2>
        <pre className="overflow-x-auto rounded-lg border border-border bg-background/60 p-3 text-[12px] leading-relaxed">
          {`interface StatusObservation {
  providerSlug: string;
  source: StatusObservationSource;
  observedStatus: ObservedStatus;
  observedAt: string;           // ISO-8601
  sourceUrl: string;            // exact URL probed / read
  responseOk: boolean;           // upstream was 2xx and parseable
  httpStatus?: number;
  latencyMs?: number | null;
  note?: string;
}`}
        </pre>
        <p>
          Every observation carries its own source attribution. The
          UI groups observers by{" "}
          <code className="rounded bg-muted px-1">source</code> and
          renders each side independently — vendor-reported and
          independent-probe results never appear in the same column.
        </p>
      </section>

      <section id="source">
        <h2>Source values</h2>
        <ul>
          <li>
            <code className="rounded bg-muted px-1">vendor_status_api</code> —
            programmatic vendor feed (e.g. Statuspage JSON, Google
            Cloud incidents JSON).
          </li>
          <li>
            <code className="rounded bg-muted px-1">vendor_status_page</code> —
            HTML vendor status page consumed without a structured feed
            (rare; reserved for vendors who do not publish JSON).
          </li>
          <li>
            <code className="rounded bg-muted px-1">independent_http_probe</code>{" "}
            — an HTTP request from WebmasterID against a public,
            non-inference vendor endpoint. The probe target is recorded
            as a primary-source citation; the request carries no
            authentication and does not invoke any inference endpoint.
          </li>
        </ul>
      </section>

      <section id="observed-status">
        <h2>ObservedStatus values</h2>
        <ul>
          <li>
            <code className="rounded bg-muted px-1">operational</code> —
            no detected impact at this observation time. For probes:
            host responded with 2xx/3xx/4xx.
          </li>
          <li>
            <code className="rounded bg-muted px-1">degraded</code> —
            minor incident affecting the tracked product. Probes:
            response delayed beyond expected envelope (rare; not yet
            wired).
          </li>
          <li>
            <code className="rounded bg-muted px-1">partial_outage</code>{" "}
            — partial unavailability. Vendor sources map this from
            their own severity vocabulary.
          </li>
          <li>
            <code className="rounded bg-muted px-1">major_outage</code> —
            broad unavailability.
          </li>
          <li>
            <code className="rounded bg-muted px-1">maintenance</code> —
            announced maintenance window.
          </li>
          <li>
            <code className="rounded bg-muted px-1">unknown</code> —
            could not determine. Probes set this on timeout/network
            error; vendor observers set this when the upstream feed
            could not be parsed.
          </li>
        </ul>
      </section>

      <section id="latency">
        <h2>latencyMs semantics</h2>
        <p>
          <code className="rounded bg-muted px-1">latencyMs</code> is
          the wall-clock time of the fetch WebmasterID made to the
          status source — never the provider&apos;s request latency.
          The codebase documents this explicitly and an integrity
          guard refuses to ship a build where any status pipeline file
          contains the literal phrase &quot;API latency&quot;.
        </p>
      </section>

      <section id="gating">
        <h2>Uptime gating policy</h2>
        <p>
          The window endpoint at{" "}
          <code className="rounded bg-muted px-1">
            /api/status/&lt;slug&gt;/window
          </code>{" "}
          can return an{" "}
          <code className="rounded bg-muted px-1">uptimePercentage</code>{" "}
          number, but only when:
        </p>
        <ol>
          <li>Durable storage is configured.</li>
          <li>
            Sample count in the requested window is at least{" "}
            <strong>{MINIMUM_OBSERVATIONS_FOR_UPTIME}</strong>{" "}
            observations.
          </li>
        </ol>
        <p>
          When the gate fails,{" "}
          <code className="rounded bg-muted px-1">uptimePercentage</code>{" "}
          is{" "}
          <code className="rounded bg-muted px-1">null</code> and the
          response&apos;s{" "}
          <code className="rounded bg-muted px-1">policyNote</code>{" "}
          explains the gating decision in plain English. Even when the
          gate passes, the number is the share of stored observations
          whose{" "}
          <code className="rounded bg-muted px-1">observedStatus</code>{" "}
          was{" "}
          <code className="rounded bg-muted px-1">operational</code> —
          a vendor-reported operational-sample rate, not an independent
          availability percentage.
        </p>
      </section>

      <section id="no-sla">
        <h2>No SLA, no availability claim</h2>
        <p>
          Nothing the platform publishes should be read as an SLA, a
          guarantee, or a substitute for a vendor&apos;s own status
          communication. /status surfaces the data; the methodology
          behind that framing is at{" "}
          <Link
            href="/research/ai-provider-status-monitoring"
            className="text-primary hover:underline"
          >
            /research/ai-provider-status-monitoring
          </Link>
          .
        </p>
      </section>
    </ContentPageShell>
  );
}
