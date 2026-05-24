import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { AudienceCard } from "@/components/audience/AudienceCard";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { getAudiences } from "@/lib/audiences";

export const metadata: Metadata = buildMetadata({
  title: "Who AiModels WebmasterID is for",
  description:
    "Choose the learning path and workflow that matches how you evaluate, test, or govern AI model usage. Audience-specific landing pages for developers, product teams, automation specialists, and governance teams.",
  path: "/for",
  keywords: [
    "ai model evaluation for developers",
    "ai model selection for product teams",
    "ai automation evaluation",
    "ai model governance review",
    "ai usage learning platform",
  ],
});

export default function AudienceHubPage() {
  const audiences = getAudiences();
  return (
    <PageShell
      eyebrow="For"
      title="Who AiModels WebmasterID is for"
      intro="Choose the learning path and workflow that matches how you evaluate, test, or govern AI model usage. Each audience page sequences a learning path, a lab playbook or template, a guided demo, and the workspaces that produce a paste-ready evidence brief."
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "For", href: "/for" },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "For", href: "/for" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "AiModels WebmasterID — audience landing",
            url: `${siteConfig.url}/for`,
            description:
              "Audience-specific entry points: developers, product teams, automation specialists, governance teams.",
            dateModified: siteConfig.buildDate,
            isPartOf: { "@type": "WebSite", url: siteConfig.url },
            hasPart: audiences.map((a) => ({
              "@type": "WebPage",
              name: a.title,
              url: `${siteConfig.url}/for/${a.slug}`,
              description: a.summary,
            })),
          },
        ]}
      />

      <aside
        role="note"
        aria-label="Audience policy"
        className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          One platform, four entry points.
        </p>
        <p>
          Every audience uses the same verified-data backbone, the
          same Learn → Apply → Verify → Test loop, and the same
          evidence artifacts. The audience pages only change the
          starting order — the underlying lessons, exercises, lab
          playbooks, and workspaces stay the same.
        </p>
      </aside>

      <section aria-label="Audience cards" className="space-y-3">
        <SectionHeader
          eyebrow="Choose your entry"
          title={`${audiences.length} audience entry points`}
          description="Pick the audience that matches your work. You can always switch — the lessons and workflows are shared."
          as="h2"
        />
        <ul className="grid gap-3 md:grid-cols-2">
          {audiences.map((a) => (
            <li key={a.slug}>
              <AudienceCard audience={a} />
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="What every audience gets"
        className="card-surface space-y-3 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          What every audience gets
        </p>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Concept lessons", href: "/learn" },
            { label: "Practical exercises", href: "/learn/exercises" },
            { label: "Selection / compare / brief workspaces", href: "/select" },
            { label: "Source-backed model data", href: "/sources" },
            { label: "Decision evidence briefs", href: "/briefs/build" },
            { label: "Lab playbooks + templates", href: "/lab" },
            { label: "Evaluation prompt sets", href: "/lab/prompts" },
            { label: "Reverification queue", href: "/reverification" },
            { label: "Coverage audit", href: "/coverage" },
          ].map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-lg border border-border bg-card p-3 transition hover:border-primary/30"
              >
                <p className="text-sm font-semibold text-foreground">
                  {item.label} →
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="What this platform does not do"
        className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          What this platform does not do
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>Rank models against each other.</li>
          <li>Provide live pricing quotes.</li>
          <li>Certify a model for any regulatory regime.</li>
          <li>
            Guarantee automation reliability, SEO outcomes, or
            production readiness.
          </li>
          <li>
            Issue badges, credentials, or course-completion
            certificates.
          </li>
        </ul>
      </section>

      <aside
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="Related references"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Related references
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <Link
              href="/docs/platform-positioning"
              className="text-primary hover:underline"
            >
              /docs/platform-positioning
            </Link>{" "}
            — what this platform is, what it is not, and how to use
            it responsibly.
          </li>
          <li>
            <Link
              href="/how-it-works"
              className="text-primary hover:underline"
            >
              /how-it-works
            </Link>{" "}
            — the five-step decision workflow without the audience
            framing.
          </li>
          <li>
            <Link
              href="/learn/paths"
              className="text-primary hover:underline"
            >
              /learn/paths
            </Link>{" "}
            — all role-based learning paths.
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
