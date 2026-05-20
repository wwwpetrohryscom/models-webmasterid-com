import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { ProviderLogo } from "@/components/ProviderLogo";
import { VerificationBadge } from "@/components/VerificationBadge";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { providers } from "@/data/providers";
import { models } from "@/data/models";
import { unknownLabel } from "@/lib/utils";

export const metadata: Metadata = buildMetadata({
  title: "AI Providers",
  description:
    "Frontier AI labs and inference platforms tracked by WebmasterID Models — OpenAI, Anthropic, Google, Meta, Mistral, DeepSeek, Groq, Together AI.",
  path: "/providers",
});

export default function ProvidersIndexPage() {
  return (
    <PageShell
      eyebrow="Catalogue"
      title="AI Providers"
      intro="Frontier labs, foundation model makers, and inference platforms. Each provider is an entity in the WebmasterID Models graph with stable slugs and verification metadata."
    >
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Providers", href: "/providers" },
        ])}
      />

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {providers.map((p) => {
          const providerModels = models.filter(
            (m) => m.providerSlug === p.slug
          );
          return (
            <li
              key={p.slug}
              id={p.slug}
              className="card-surface flex flex-col p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ProviderLogo slug={p.slug} name={p.name} size="lg" />
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      <Link
                        href={`/providers/${p.slug}`}
                        className="hover:underline"
                      >
                        {p.name}
                      </Link>
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {p.headquarters ?? unknownLabel()}
                    </p>
                  </div>
                </div>
                <VerificationBadge status={p.verificationStatus} />
              </div>

              <p className="mt-3 text-sm text-muted-foreground">
                {p.description}
              </p>

              <div className="mt-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Tracked models ({providerModels.length})
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {providerModels.length ? (
                    providerModels.map((m) => (
                      <li key={m.slug}>
                        <Link
                          href={`/models/${m.slug}`}
                          className="pill hover:border-primary/30 hover:text-foreground"
                        >
                          {m.name}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-muted-foreground">
                      {unknownLabel()}
                    </li>
                  )}
                </ul>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 text-xs font-medium">
                <Link
                  href={`/providers/${p.slug}`}
                  className="text-primary hover:underline"
                >
                  Provider page →
                </Link>
                {p.website ? (
                  <Link
                    href={p.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Official site ↗
                  </Link>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </PageShell>
  );
}
