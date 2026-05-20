import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { ModelBadge } from "@/components/ModelBadge";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata, breadcrumbJsonLd, datasetJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { models } from "@/data/models";
import { getProviderBySlug } from "@/data/providers";

export const metadata: Metadata = buildMetadata({
  title: "AI Models",
  description:
    "Browse tracked AI models across OpenAI, Anthropic, Google, Meta, Mistral, DeepSeek, and more.",
  path: "/models",
});

export default function ModelsIndexPage() {
  return (
    <PageShell
      eyebrow="Catalogue"
      title="AI Models"
      intro="Structured catalogue of AI models with provider attribution, verification status, and links to deeper intelligence. Unknown metrics are explicitly marked as not yet verified."
    >
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Models", href: "/models" },
          ]),
          datasetJsonLd({
            name: `${siteConfig.name} — Models`,
            description: "Catalogue of AI models tracked by WebmasterID Models.",
            path: "/models",
            dateModified: siteConfig.buildDate,
          }),
        ]}
      />

      <section aria-label="Filter and search" className="card-surface p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">Search</span>
            <input
              type="search"
              placeholder="Filter by model name…"
              readOnly
              aria-label="Search models"
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">Provider</span>
            <select
              defaultValue=""
              aria-label="Filter by provider"
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">All providers</option>
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">
              Verification
            </span>
            <select
              defaultValue=""
              aria-label="Filter by verification status"
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">Any status</option>
            </select>
          </label>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Filters are a visual placeholder. Server-side filtering ships in the
          next iteration.
        </p>
      </section>

      <section aria-label="Models">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((m) => {
            const p = getProviderBySlug(m.providerSlug);
            return (
              <li key={m.slug}>
                <ModelBadge model={m} providerName={p?.name ?? "Unknown"} />
              </li>
            );
          })}
        </ul>
      </section>

      <aside className="card-surface p-5 text-sm text-muted-foreground">
        <p>
          Need a side-by-side view? See{" "}
          <Link href="/compare" className="text-primary hover:underline">
            Compare
          </Link>
          , or browse{" "}
          <Link href="/providers" className="text-primary hover:underline">
            Providers
          </Link>{" "}
          to scope by lab.
        </p>
      </aside>
    </PageShell>
  );
}
