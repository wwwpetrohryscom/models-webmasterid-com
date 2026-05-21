import type { Metadata } from "next";
import Link from "next/link";
import { ContentPageShell } from "@/components/ContentPageShell";
import { buildMetadata } from "@/lib/seo";
import { getContentPage } from "@/lib/content";
import { MINIMUM_OBSERVATIONS_FOR_UPTIME } from "@/lib/status-store";

const SLUG = "/research/ai-provider-status-monitoring";

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
      breadcrumbParent={{ name: "Research", href: "/research" }}
      toc={[
        { id: "three-signals", label: "Three signals, not one" },
        { id: "vendor-status", label: "Vendor-reported status" },
        { id: "independent-probes", label: "Independent HTTP probes" },
        { id: "computed-uptime", label: "Computed uptime windows" },
        { id: "sample-threshold", label: "The sample threshold" },
        { id: "current-observers", label: "Currently observed providers" },
        { id: "what-we-do-not-claim", label: "What we do not claim" },
      ]}
      verifiedToday={[
        {
          label: "Anthropic vendor-status observer",
          detail:
            "Reads status.anthropic.com/api/v2/status.json (Statuspage feed) hourly. Live at /api/status/anthropic.",
        },
        {
          label: "Anthropic independent HTTP probe",
          detail:
            "Single unauthenticated GET against api.anthropic.com/ (host root, no inference, no API key). A 4xx response confirms host reachability without invoking any billing endpoint.",
        },
        {
          label: "Google vendor-status observer",
          detail:
            "Reads status.cloud.google.com/incidents.json hourly and filters to active incidents touching Gemini / Vertex AI / AI Studio products.",
        },
      ]}
      dataGaps={[
        {
          label: "DeepSeek / Mistral / OpenAI status",
          detail:
            "No observer wired yet. Provider status pages exist but have not been onboarded into the observation pipeline.",
        },
        {
          label: "Independent probes for non-Anthropic providers",
          detail:
            "Probe observers are only enabled for Anthropic. Other providers are vendor-reported only.",
        },
        {
          label: "Uptime percentage",
          detail: `Not published. Requires ≥ ${MINIMUM_OBSERVATIONS_FOR_UPTIME} stored observations in the window AND durable storage AND independent-probe samples to be a useful availability number. Currently only vendor observations are stored and the durable storage layer requires KV credentials.`,
        },
      ]}
      relatedLinks={[
        {
          href: "/status",
          label: "Status",
          description: "Per-provider observer matrix and live endpoint links.",
        },
        {
          href: "/coverage",
          label: "Coverage",
          description: "Status observation coverage summary.",
        },
        {
          href: "/docs/status-observations",
          label: "Status observation reference",
          description: "Schema for StatusObservation and the gating policy.",
        },
        {
          href: "/sources",
          label: "Sources",
          description: "Status monitoring sources are listed alongside model citations.",
        },
      ]}
    >
      <section id="three-signals">
        <h2>Three signals, not one</h2>
        <p>
          WebmasterID Models keeps three distinct signals separate at
          every layer of the platform. They answer different questions
          and they are not interchangeable; conflating them is the
          fastest way to publish a misleading reliability claim.
        </p>
        <ol>
          <li>
            <strong>Vendor-reported status.</strong> The provider tells
            us about themselves via their public status feed.
          </li>
          <li>
            <strong>Independent HTTP probe.</strong> WebmasterID issues
            an HTTP request from our own infrastructure against a
            public, non-inference vendor endpoint.
          </li>
          <li>
            <strong>Computed uptime window.</strong> A derived metric
            over a meaningful window of stored observations.
          </li>
        </ol>
        <p>
          Every observation we store records its{" "}
          <code className="rounded bg-muted px-1">source</code> as one
          of these three values. UI surfaces, the dynamic status
          endpoints, and the integrity guards all key off that field so
          a vendor signal cannot be silently relabelled as an
          independent measurement.
        </p>
      </section>

      <section id="vendor-status">
        <h2>Vendor-reported status</h2>
        <p>
          A vendor-reported observation is the provider&apos;s own
          characterisation of their service health. It is the cheapest,
          fastest, and most-widely-available signal — but it is the
          provider reporting on themselves. We surface it because it
          is useful as a colour signal, not because it is an
          availability measurement. Every UI surface that renders one
          is labelled &quot;Vendor-reported status observed by
          WebmasterID&quot;.
        </p>
        <p>
          The Anthropic observer maps the Statuspage{" "}
          <code className="rounded bg-muted px-1">
            status.indicator
          </code>{" "}
          enum (<code className="rounded bg-muted px-1">none / minor /
          major / critical / maintenance</code>) into our canonical{" "}
          <code className="rounded bg-muted px-1">ObservedStatus</code>{" "}
          vocabulary. The Google observer filters the Cloud incidents
          feed to entries whose{" "}
          <code className="rounded bg-muted px-1">affected_products</code>{" "}
          mention Gemini / Vertex AI / AI Studio. Both observers run
          hourly via Vercel Cron at{" "}
          <code className="rounded bg-muted px-1">
            /api/cron/status
          </code>
          .
        </p>
      </section>

      <section id="independent-probes">
        <h2>Independent HTTP probes</h2>
        <p>
          An independent probe is a request issued by WebmasterID
          itself against a public, non-inference, non-billing vendor
          endpoint. The Anthropic probe targets{" "}
          <code className="rounded bg-muted px-1">
            https://api.anthropic.com/
          </code>{" "}
          (host root with no path) — an unauthenticated GET returns
          HTTP 404, which is exactly the signal we want: DNS resolves,
          TLS negotiates, the socket connects, and the API gateway
          processes the request. No API key is sent. No inference is
          triggered. No prompt or completion is produced. No billing is
          invoked.
        </p>
        <p>
          A 5xx from the same endpoint means the API gateway itself is
          failing — that is the genuine &quot;vendor degraded&quot;
          signal a reachability probe gives us. A network error or
          timeout maps to{" "}
          <code className="rounded bg-muted px-1">unknown</code>{" "}
          rather than to a guess at the cause.
        </p>
        <p>
          The probe&apos;s wall-clock fetch time is recorded as{" "}
          <code className="rounded bg-muted px-1">latencyMs</code>. The
          codebase documents this as fetch wall-clock time only and
          forbids it being relabelled as the provider&apos;s request
          latency. An integrity guard refuses to ship a build where any
          status pipeline file contains the literal phrase &quot;API
          latency&quot;.
        </p>
      </section>

      <section id="computed-uptime">
        <h2>Computed uptime windows</h2>
        <p>
          Uptime is a derived metric over a window of durable
          observations. The platform does not publish an uptime
          percentage today. When one is published, it will be the share
          of stored observations whose{" "}
          <code className="rounded bg-muted px-1">observedStatus</code>{" "}
          was{" "}
          <code className="rounded bg-muted px-1">operational</code>{" "}
          over the requested window — labelled precisely as a
          &quot;vendor-reported operational-sample rate&quot; (or
          &quot;probe-reachability sample rate&quot; for probe-only
          windows). It will not be labelled &quot;uptime&quot; without
          qualification.
        </p>
      </section>

      <section id="sample-threshold">
        <h2>The sample threshold</h2>
        <p>
          The minimum number of observations required before any
          uptime-shaped number can be exposed is{" "}
          <strong>{MINIMUM_OBSERVATIONS_FOR_UPTIME}</strong> samples in
          the requested window — declared as a single constant in{" "}
          <code className="rounded bg-muted px-1">lib/status-store.ts</code>{" "}
          and verified by an integrity guard. Below the threshold, the{" "}
          <code className="rounded bg-muted px-1">
            uptimePercentage
          </code>{" "}
          field on the window endpoint is{" "}
          <code className="rounded bg-muted px-1">null</code> and the
          response&apos;s{" "}
          <code className="rounded bg-muted px-1">policyNote</code>{" "}
          explains the gating decision explicitly.
        </p>
      </section>

      <section id="current-observers">
        <h2>Currently observed providers</h2>
        <p>
          Two providers have observers wired: Anthropic (vendor + probe)
          and Google (vendor only). The live status hub at{" "}
          <Link href="/status" className="text-primary hover:underline">
            /status
          </Link>{" "}
          renders the observer matrix; the per-provider live and
          windowed endpoints are at{" "}
          <code className="rounded bg-muted px-1">
            /api/status/&lt;slug&gt;
          </code>
          ,{" "}
          <code className="rounded bg-muted px-1">
            /api/status/&lt;slug&gt;/latest
          </code>
          , and{" "}
          <code className="rounded bg-muted px-1">
            /api/status/&lt;slug&gt;/window?hours=24
          </code>
          .
        </p>
      </section>

      <section id="what-we-do-not-claim">
        <h2>What we do not claim</h2>
        <p>
          The platform does not assert availability, does not make SLA
          commitments, does not produce a continuously-updated availability number,
          and does not relabel probe wall-clock time as request
          latency. Vendor-reported status is published with that
          framing on every surface it appears on; the moment it is
          rendered as anything else, an integrity guard refuses the
          build. See{" "}
          <Link
            href="/docs/status-observations"
            className="text-primary hover:underline"
          >
            /docs/status-observations
          </Link>{" "}
          for the schema and policy in reference form.
        </p>
      </section>
    </ContentPageShell>
  );
}
