import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { ProviderLogo } from "@/components/ProviderLogo";
import { SectionHeader } from "@/components/SectionHeader";
import { DataNotVerified } from "@/components/DataNotVerified";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { robotsMetadata } from "@/lib/should-index";
import { providers, getProviderBySlug } from "@/data/providers";
import {
  ENABLED_OBSERVERS,
  findObserversForProvider,
  providersWithObservers,
} from "@/lib/observers";
import {
  isStatusStorageConfigured,
  MINIMUM_OBSERVATIONS_FOR_UPTIME,
} from "@/lib/status-store";
import {
  SOURCE_LABEL,
  type StatusObservationSource,
} from "@/lib/status-observations";

// `StatusObservationSource` is also used by SOURCE_TONE below; the type
// import stays even though the literal source value comes from each
// observer entity at runtime.

export const metadata: Metadata = {
  ...buildMetadata({
    title: "AI Provider Status",
    description:
      "Status observation hub for tracked AI providers. WebmasterID Models clearly separates vendor-reported status from independent HTTP probes and does not publish uptime percentages without durable observations.",
    path: "/status",
  }),
  robots: robotsMetadata(false),
};

const SOURCE_TONE: Record<StatusObservationSource, string> = {
  vendor_status_api: "border-primary/30 bg-primary/10 text-primary",
  vendor_status_page: "border-primary/30 bg-primary/10 text-primary",
  independent_http_probe:
    "border-success/30 bg-success/10 text-success",
};

export default function StatusPage() {
  const observerCount = ENABLED_OBSERVERS.length;
  const observedProviderSlugs = providersWithObservers();
  const observedProviders = observedProviderSlugs
    .map((slug) => getProviderBySlug(slug))
    .filter(
      (p): p is NonNullable<ReturnType<typeof getProviderBySlug>> =>
        Boolean(p)
    );
  const storageConfigured = isStatusStorageConfigured();
  const probeCount = ENABLED_OBSERVERS.filter(
    (o) => o.source === "independent_http_probe"
  ).length;

  return (
    <PageShell
      eyebrow="Hub"
      title="Provider Status"
      intro="Status observation hub. WebmasterID Models records vendor-reported status as a vendor-reported observation, runs independent HTTP probes against non-inference public endpoints, and keeps the two signals strictly separate. This page does not publish an uptime percentage."
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Status", href: "/status" },
        ]}
      />

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Status", href: "/status" },
        ])}
      />

      <aside
        role="note"
        aria-label="Monitoring policy"
        className="card-surface p-4 text-sm text-muted-foreground"
      >
        <h2 className="text-base font-semibold text-foreground">
          Monitoring policy
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong className="text-foreground">
              Vendor-reported status is not independent uptime.
            </strong>{" "}
            When the vendor publishes a status feed, WebmasterID records it
            as a vendor-reported observation. The vendor is reporting on
            themselves.
          </li>
          <li>
            <strong className="text-foreground">
              Independent HTTP probes are a separate signal.
            </strong>{" "}
            They are runs of an HTTP request issued by WebmasterID against
            a public, non-inference endpoint (host-root reachability only,
            no API key sent, no billing triggered). A successful probe is
            a reachability signal, not an availability measurement.
          </li>
          <li>
            <strong className="text-foreground">
              Probe wall-clock time is not the provider&apos;s request latency.
            </strong>{" "}
            The duration of our fetch is wall-clock fetch time and it is
            never relabelled as the provider&apos;s end-to-end request
            latency.
          </li>
          <li>
            <strong className="text-foreground">
              Uptime percentages require durable observations.
            </strong>{" "}
            A single observation cannot prove availability over a window.
            Until {MINIMUM_OBSERVATIONS_FOR_UPTIME} observations have
            accumulated in the window, no uptime percentage is exposed.
          </li>
          <li>
            <strong className="text-foreground">No SLA claims.</strong>{" "}
            Nothing on this page should be read as a service-level
            commitment, an availability guarantee, or a substitute for the
            provider&apos;s own status communication.
          </li>
        </ul>
      </aside>

      <section
        aria-label="Observers"
        className="space-y-3"
      >
        <SectionHeader
          eyebrow="Per provider"
          title={`Observers (${observerCount} total across ${observedProviders.length} provider${observedProviders.length === 1 ? "" : "s"})`}
          description="Each provider card lists every observer registered against it. Vendor-status observers read the provider's own public feed; independent HTTP probes hit a public, non-inference endpoint from WebmasterID."
          as="h2"
        />
        <ul className="grid gap-3 sm:grid-cols-2">
          {providers.map((p) => {
            const observers = findObserversForProvider(p.slug);
            const observerEnabled = observers.length > 0;
            const liveEndpoint = observerEnabled
              ? `/api/status/${p.slug}`
              : null;
            const latestEndpoint = observerEnabled
              ? `/api/status/${p.slug}/latest`
              : null;
            const windowEndpoint = observerEnabled
              ? `/api/status/${p.slug}/window?hours=24`
              : null;
            return (
              <li
                key={p.slug}
                className="card-surface flex flex-col gap-3 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ProviderLogo slug={p.slug} name={p.name} size="md" />
                    <div>
                      <Link
                        href={`/providers/${p.slug}`}
                        className="text-sm font-semibold text-foreground hover:underline"
                      >
                        {p.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {observerEnabled
                          ? `${observers.length} observer${observers.length === 1 ? "" : "s"} enabled`
                          : "No observer enabled"}
                      </p>
                    </div>
                  </div>
                </div>
                {observerEnabled ? (
                  <ul className="space-y-1.5 text-xs">
                    {observers.map((o, idx) => {
                      const isProbe =
                        o.source === "independent_http_probe";
                      return (
                        <li
                          key={`${o.providerSlug}-${idx}`}
                          className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background/40 p-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-foreground">
                              {isProbe
                                ? "Independent HTTP probe"
                                : "Vendor status observation"}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {o.description}
                            </p>
                          </div>
                          <span
                            className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${SOURCE_TONE[o.source]}`}
                          >
                            <span
                              aria-hidden="true"
                              className="h-1.5 w-1.5 rounded-full bg-current"
                            />
                            {SOURCE_LABEL[o.source]}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
                <dl className="space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">
                      Vendor status page
                    </dt>
                    <dd>
                      {p.statusPageUrl ? (
                        <Link
                          href={p.statusPageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline"
                        >
                          {p.statusPageUrl.replace(/^https?:\/\//, "")}
                        </Link>
                      ) : (
                        <DataNotVerified />
                      )}
                    </dd>
                  </div>
                  {liveEndpoint ? (
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">
                        Run all observers now
                      </dt>
                      <dd>
                        <Link
                          href={liveEndpoint}
                          className="text-primary hover:underline"
                          prefetch={false}
                        >
                          {liveEndpoint}
                        </Link>
                      </dd>
                    </div>
                  ) : null}
                  {latestEndpoint ? (
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">
                        Latest stored observation
                      </dt>
                      <dd>
                        <Link
                          href={latestEndpoint}
                          className="text-primary hover:underline"
                          prefetch={false}
                        >
                          {latestEndpoint}
                        </Link>
                      </dd>
                    </div>
                  ) : null}
                  {windowEndpoint ? (
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-muted-foreground">
                        24h window
                      </dt>
                      <dd>
                        <Link
                          href={windowEndpoint}
                          className="text-primary hover:underline"
                          prefetch={false}
                        >
                          {windowEndpoint}
                        </Link>
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        aria-label="Independent HTTP probes"
        className="card-surface p-5"
      >
        <SectionHeader
          eyebrow="Source: independent probe"
          title={`Independent HTTP probes (${probeCount} active)`}
          description={
            probeCount > 0
              ? "Independent probes hit a public, non-inference endpoint and report whether the host responded. No API key is sent, no inference is triggered, no billing is invoked. Probe wall-clock time is never relabelled as the provider&apos;s request latency."
              : "Probes are not yet enabled for any provider. When they are, their observations will be labelled with source = independent_http_probe and kept separate from vendor-reported ones."
          }
          as="h2"
        />
      </section>

      <section
        aria-label="Durable observation storage"
        className="card-surface p-5"
      >
        <SectionHeader
          eyebrow="Persistence"
          title="Durable observation storage"
          description="Observations only become useful as a window once they are persisted. The storage layer is optional; when it is not configured, observations are fire-and-forget and no window can be computed."
          as="h2"
        />
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-background/40 p-3">
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              Storage state
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              {storageConfigured ? (
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="inline-block h-2 w-2 rounded-full bg-success"
                  />
                  Durable storage configured
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="inline-block h-2 w-2 rounded-full bg-warning"
                  />
                  No durable storage configured
                </span>
              )}
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-background/40 p-3">
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              Providers with observers
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              {observedProviders.length}
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-background/40 p-3">
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              Read endpoint shape
            </dt>
            <dd className="mt-1 font-mono text-sm text-foreground">
              /api/status/[provider]/latest
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-background/40 p-3">
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              Uptime calculation
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              Not yet eligible — requires{" "}
              {MINIMUM_OBSERVATIONS_FOR_UPTIME} stored observations in
              the window.
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          Storage is configured via the <code className="rounded bg-muted px-1">KV_REST_API_URL</code> /{" "}
          <code className="rounded bg-muted px-1">KV_REST_API_TOKEN</code>{" "}
          env pair on the Vercel project. When unset, the cron still runs
          but each observation reports{" "}
          <code className="rounded bg-muted px-1">skipped_no_store</code>{" "}
          and nothing is persisted.
        </p>
      </section>

      <section
        aria-label="Why no uptime percentage is shown"
        className="card-surface p-5"
      >
        <SectionHeader
          eyebrow="Honest gaps"
          title="Why no uptime percentage is shown"
          as="h2"
        />
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            Uptime is a fraction of observations over time. Until the
            cron has persisted at least{" "}
            {MINIMUM_OBSERVATIONS_FOR_UPTIME} observations in a window,
            no honest denominator exists.
          </li>
          <li>
            Vendor-reported indicators are useful as a colour signal, but
            they are not an availability measurement. Probe-success rate
            is a reachability signal, not full API uptime. Any future
            published number computed from either will be labelled
            precisely — &quot;vendor-reported operational-sample rate&quot;
            or &quot;probe-reachability sample rate&quot; — never
            &quot;uptime&quot; without qualification.
          </li>
          <li>
            Once the threshold is met, the per-provider window endpoint
            will expose a `uptimePercentage` field with the gating
            decision explained in its `policyNote`. The /status page
            itself does not display this number.
          </li>
        </ul>
      </section>

      <section
        aria-label="Cron policy"
        className="card-surface p-5 text-sm text-muted-foreground"
      >
        <h2 className="text-base font-semibold text-foreground">
          How observations are scheduled
        </h2>
        <p className="mt-2">
          Every observer is wired to{" "}
          <code className="rounded bg-muted px-1">/api/cron/status</code>,
          which Vercel Cron calls hourly. When{" "}
          <code className="rounded bg-muted px-1">CRON_SECRET</code> is
          set on the deployment, the endpoint requires a bearer token. In
          production, the cron refuses to run unguarded.
        </p>
      </section>

      <aside
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="Methodology"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Methodology and reference
        </p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          <li>
            <Link
              href="/research/ai-provider-status-monitoring"
              className="text-primary hover:underline"
            >
              AI provider status monitoring
            </Link>{" "}
            — the methodology behind the three signals.
          </li>
          <li>
            <Link
              href="/docs/status-observations"
              className="text-primary hover:underline"
            >
              Status observation reference
            </Link>{" "}
            — schema and gating policy.
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
