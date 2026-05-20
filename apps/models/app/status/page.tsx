import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { ProviderLogo } from "@/components/ProviderLogo";
import { DataNotVerified } from "@/components/DataNotVerified";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { robotsMetadata } from "@/lib/should-index";
import { providers } from "@/data/providers";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "AI Provider Status",
    description:
      "Operational status across tracked AI providers. WebmasterID Models only publishes a status when independently verified.",
    path: "/status",
  }),
  robots: robotsMetadata(false),
};

type MonitoringState = "not_monitored" | "planned" | "active";

const MONITORING_STATE: Record<string, MonitoringState> = {};

const STATE_LABEL: Record<MonitoringState, { label: string; tone: string }> = {
  not_monitored: {
    label: "Not monitored",
    tone: "border-muted-foreground/30 bg-muted text-muted-foreground",
  },
  planned: {
    label: "Planned",
    tone: "border-primary/30 bg-primary/10 text-primary",
  },
  active: {
    label: "Active",
    tone: "border-success/30 bg-success/10 text-success",
  },
};

export default function StatusPage() {
  return (
    <PageShell
      eyebrow="Hub"
      title="Provider Status"
      intro="WebmasterID Models does not currently run an independent uptime monitor for any provider. This page is intentionally honest about that until live monitoring exists."
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
        <p>
          <strong className="text-foreground">
            Vendor-reported status is not independent monitoring.
          </strong>{" "}
          The vendor status pages linked below are operated by the
          providers themselves. WebmasterID Models will publish a per-
          provider uptime number only after an independent monitor is
          wired up. Until then, this hub links to the vendor's own page
          and explicitly records "Not monitored" for the independent
          check.
        </p>
      </aside>

      <ul className="grid gap-3 sm:grid-cols-2">
        {providers.map((p) => {
          const state: MonitoringState =
            MONITORING_STATE[p.slug] ?? "not_monitored";
          const tone = STATE_LABEL[state];
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
                      Independent monitor status
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone.tone}`}
                >
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full bg-current"
                  />
                  {tone.label}
                </span>
              </div>
              <dl className="space-y-1 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">
                    Last independent check
                  </dt>
                  <dd>
                    <DataNotVerified />
                  </dd>
                </div>
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
              </dl>
            </li>
          );
        })}
      </ul>
    </PageShell>
  );
}
