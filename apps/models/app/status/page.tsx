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
import { providers } from "@/data/providers";
import { ENABLED_OBSERVERS, findObserver } from "@/lib/observers";
import {
  isStatusStorageConfigured,
  MINIMUM_OBSERVATIONS_FOR_UPTIME,
} from "@/lib/status-store";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "AI Provider Status",
    description:
      "Status observation hub for tracked AI providers. WebmasterID Models clearly separates vendor-reported status from independent HTTP probes and does not publish uptime percentages without durable observations.",
    path: "/status",
  }),
  robots: robotsMetadata(false),
};

type ObserverState = "vendor_reported" | "not_enabled";

interface ObserverRow {
  state: ObserverState;
  label: string;
  tone: string;
}

function describeVendorObserver(providerSlug: string): ObserverRow {
  const observer = findObserver(providerSlug);
  if (observer) {
    return {
      state: "vendor_reported",
      label: "Vendor status observer: enabled",
      tone: "border-primary/30 bg-primary/10 text-primary",
    };
  }
  return {
    state: "not_enabled",
    label: "Vendor status observer: not enabled",
    tone: "border-muted-foreground/30 bg-muted text-muted-foreground",
  };
}

export default function StatusPage() {
  const vendorObserverCount = ENABLED_OBSERVERS.length;
  const storageConfigured = isStatusStorageConfigured();

  return (
    <PageShell
      eyebrow="Hub"
      title="Provider Status"
      intro="Status observation hub. WebmasterID Models records vendor-reported status as a vendor-reported observation, and runs independent HTTP probes only when explicitly enabled. This page does not publish an uptime percentage."
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
            the vendor&apos;s API. Independent probes are{" "}
            <em>not yet enabled</em> for any provider.
          </li>
          <li>
            <strong className="text-foreground">
              Uptime percentages require durable observations.
            </strong>{" "}
            A single observation cannot prove availability over a window.
            Until WebmasterID is recording observations to durable storage
            over a meaningful window, no uptime percentage is shown.
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
        aria-label="Vendor-reported status observations"
        className="space-y-3"
      >
        <SectionHeader
          eyebrow="Source: vendor status feed"
          title={`Vendor-reported status observations (${vendorObserverCount} observer${vendorObserverCount === 1 ? "" : "s"})`}
          description="Each enabled observer reads the provider's own public status page or feed and normalises the result into a single observation. The observation is not a vendor-replacement status page; consult the provider's own page for incident detail."
          as="h2"
        />
        <ul className="grid gap-3 sm:grid-cols-2">
          {providers.map((p) => {
            const row = describeVendorObserver(p.slug);
            const liveEndpoint =
              row.state === "vendor_reported"
                ? `/api/status/${p.slug}`
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
                        Vendor-reported status observed by WebmasterID
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${row.tone}`}
                  >
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full bg-current"
                    />
                    {row.label}
                  </span>
                </div>
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
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted-foreground">
                      Latest observation
                    </dt>
                    <dd>
                      {liveEndpoint ? (
                        <Link
                          href={liveEndpoint}
                          className="text-primary hover:underline"
                          prefetch={false}
                        >
                          {liveEndpoint}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </dd>
                  </div>
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
          title="Independent HTTP probes — not yet enabled"
          description="A future probe layer will issue HTTP requests from WebmasterID against each provider's API and record the outcome. No probes are enabled today. When probes are enabled, their observations will be labelled with source = independent_http_probe and kept separate from vendor-reported ones."
          as="h2"
        />
        <p className="mt-3 text-sm text-muted-foreground">
          Probe wall-clock time is not the provider&apos;s end-to-end
          request latency, and WebmasterID does not relabel it that way.
        </p>
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
              Latest stored observation (Anthropic)
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              <Link
                href="/api/status/anthropic/latest"
                prefetch={false}
                className="text-primary hover:underline"
              >
                /api/status/anthropic/latest
              </Link>
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-background/40 p-3">
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">
              24h observation window (Anthropic)
            </dt>
            <dd className="mt-1 font-medium text-foreground">
              <Link
                href="/api/status/anthropic/window?hours=24"
                prefetch={false}
                className="text-primary hover:underline"
              >
                /api/status/anthropic/window?hours=24
              </Link>
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
            they are not an availability measurement. Any future
            published number computed from them will be labelled
            &quot;vendor-reported operational-sample rate&quot;, never
            &quot;uptime&quot; without qualification.
          </li>
          <li>
            Once the threshold is met, the{" "}
            <Link
              href="/api/status/anthropic/window?hours=24"
              prefetch={false}
              className="text-primary hover:underline"
            >
              window endpoint
            </Link>{" "}
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
          Vendor observers are wired to{" "}
          <code className="rounded bg-muted px-1">/api/cron/status</code>,
          which Vercel Cron is configured to call hourly. When{" "}
          <code className="rounded bg-muted px-1">CRON_SECRET</code> is
          set on the deployment, the endpoint requires a bearer token. In
          production, the cron refuses to run unguarded.
        </p>
      </section>
    </PageShell>
  );
}
