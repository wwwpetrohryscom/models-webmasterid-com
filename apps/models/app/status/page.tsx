import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { ProviderLogoBadge } from "@/components/ProviderLogoBadge";
import { VerificationBadge } from "@/components/VerificationBadge";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { robotsMetadata } from "@/lib/should-index";
import { status } from "@/data/status";
import { getProviderBySlug } from "@/data/providers";
import { unknownLabel } from "@/lib/utils";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "AI Provider Status",
    description:
      "Operational status across tracked AI providers. WebmasterID Models only publishes a status when independently verified.",
    path: "/status",
  }),
  robots: robotsMetadata(false),
};

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  operational: {
    label: "Operational",
    tone: "border-success/30 bg-success/10 text-success",
  },
  degraded: {
    label: "Degraded",
    tone: "border-warning/30 bg-warning/10 text-warning",
  },
  outage: {
    label: "Outage",
    tone: "border-red-500/30 bg-red-500/10 text-red-600",
  },
  unknown: {
    label: "Not yet monitored",
    tone: "border-muted-foreground/20 bg-muted text-muted-foreground",
  },
};

export default function StatusPage() {
  return (
    <PageShell
      eyebrow="Hub"
      title="Provider Status"
      intro="Operational status tracking is not yet live. Until WebmasterID Models has an independent monitor for a provider, status reads 'Not yet monitored' rather than mirroring vendor-reported state."
    >
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Status", href: "/status" },
        ])}
      />
      <ul className="grid gap-3 sm:grid-cols-2">
        {status.map((s) => {
          const p = getProviderBySlug(s.providerSlug);
          const stat = STATUS_LABEL[s.status] ?? STATUS_LABEL.unknown;
          return (
            <li
              key={s.slug}
              className="card-surface flex items-center justify-between gap-3 p-5"
            >
              <div className="flex items-center gap-3">
                <ProviderLogoBadge
                  slug={s.providerSlug}
                  name={p?.name ?? "Unknown"}
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {p?.name ?? unknownLabel()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last incident: {s.lastIncidentDate ?? unknownLabel()}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${stat.tone}`}
                >
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full bg-current"
                  />
                  {stat.label}
                </span>
                <VerificationBadge status={s.verificationStatus} />
              </div>
            </li>
          );
        })}
      </ul>
    </PageShell>
  );
}
