import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { ProviderLogo } from "@/components/ProviderLogo";
import { SectionHeader } from "@/components/SectionHeader";
import { DataNotVerified } from "@/components/DataNotVerified";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { robotsMetadata } from "@/lib/should-index";
import { providers } from "@/data/providers";
import { ENABLED_OBSERVERS, findObserver } from "@/lib/observers";

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

  return (
    <PageShell
      eyebrow="Hub"
      title="Provider Status"
      intro="Status observation hub. WebmasterID Models records vendor-reported status as a vendor-reported observation, and runs independent HTTP probes only when explicitly enabled. This page does not publish an uptime percentage."
    >
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
            Uptime is a fraction of observations over time. WebmasterID is
            not yet writing observations to durable storage, so no honest
            denominator exists yet.
          </li>
          <li>
            Vendor-reported indicators are useful as a colour signal, but
            they are not an availability measurement.
          </li>
          <li>
            Once the cron writes observations and a meaningful window has
            accumulated, an uptime row will appear with a citation back to
            the observation log — and only then.
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
