import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { VerificationBadge } from "@/components/VerificationBadge";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { regions } from "@/data/regions";
import { providers, getProviderBySlug } from "@/data/providers";

export const metadata: Metadata = buildMetadata({
  title: "AI Inference Infrastructure",
  description:
    "Inference infrastructure intelligence: regions, providers, latency, and uptime — when verified.",
  path: "/infrastructure",
});

export default function InfrastructurePage() {
  return (
    <PageShell
      eyebrow="Hub"
      title="Inference Infrastructure"
      intro="Where models actually run, who serves them, and how reliably. This hub aggregates region availability and provider coverage. Performance metrics are only shown once independently verified."
    >
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Infrastructure", href: "/infrastructure" },
        ])}
      />

      <section aria-label="Regions" className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Regions</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {regions.map((r) => (
            <li key={r.slug} className="card-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    {r.name}
                  </h3>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {r.countryCode}
                  </p>
                </div>
                <VerificationBadge status={r.verificationStatus} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {r.description}
              </p>
              <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
                Providers tracked in this region
              </p>
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {r.providersAvailable.map((slug) => {
                  const p = getProviderBySlug(slug);
                  return (
                    <li key={slug} className="pill">
                      {p?.name ?? slug}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Providers" className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          Provider footprint
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {providers.map((p) => (
            <li
              key={p.slug}
              className="card-surface flex items-center justify-between p-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {p.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {p.headquarters ?? "—"}
                </p>
              </div>
              <VerificationBadge status={p.verificationStatus} />
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
