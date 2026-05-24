import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { AudienceHero } from "@/components/audience/AudienceHero";
import { AudienceArtifactList } from "@/components/audience/AudienceArtifactList";
import { AudienceWorkflow } from "@/components/audience/AudienceWorkflow";
import { AudienceDoesNotPromise } from "@/components/audience/AudienceDoesNotPromise";
import { buildMetadata, breadcrumbJsonLd, articleJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { getAudience, getAudiences } from "@/lib/audiences";

interface RouteParams {
  slug: string;
}

export function generateStaticParams(): RouteParams[] {
  return getAudiences().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const audience = getAudience(slug);
  if (!audience) {
    return buildMetadata({ title: "Audience", path: `/for/${slug}` });
  }
  return buildMetadata({
    title: audience.title,
    description: audience.summary,
    path: `/for/${audience.slug}`,
    keywords: [
      `ai model platform for ${audience.slug.replace(/-/g, " ")}`,
      "ai model evaluation",
      "decision evidence brief",
    ],
  });
}

export default async function AudienceDetailPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const audience = getAudience(slug);
  if (!audience) notFound();

  const path = `/for/${audience.slug}`;

  return (
    <PageShell
      eyebrow={`For · ${audience.title.replace(/^For\s+/, "")}`}
      title={audience.title}
      intro={audience.summary}
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "For", href: "/for" },
          { name: audience.title, href: path },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "For", href: "/for" },
            { name: audience.title, href: path },
          ]),
          articleJsonLd({
            type: "TechArticle",
            headline: audience.headline,
            description: audience.summary,
            path,
            dateModified: siteConfig.buildDate,
          }),
        ]}
      />

      <AudienceHero audience={audience} />

      {audience.exampleSituation ? (
        <section
          aria-label="Example situation"
          className="card-surface space-y-2 p-5 text-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Example situation
          </p>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Illustrative — not a recommendation.
          </p>
          <p className="text-muted-foreground">
            {audience.exampleSituation}
          </p>
        </section>
      ) : null}

      {audience.bestStartingPoint ? (
        <section
          aria-label="Start here"
          className="card-surface space-y-2 p-5 text-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Start here
          </p>
          <p>
            <Link
              href={audience.bestStartingPoint.href}
              className="text-base font-semibold text-primary hover:underline"
            >
              {audience.bestStartingPoint.label} →
            </Link>
          </p>
          <p className="text-muted-foreground">
            {audience.bestStartingPoint.reason}
          </p>
        </section>
      ) : null}

      <section
        aria-label="Who this is for"
        className="card-surface space-y-2 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Who this is for
        </p>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          {audience.whoThisIsFor.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Common problems we hear"
        className="card-surface space-y-2 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Common problems we hear
        </p>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          {audience.commonProblems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section aria-label="What you can do here" className="space-y-3">
        <SectionHeader
          eyebrow="What you can do here"
          title={`${audience.whatYouCanDo.length} entry points`}
          description="Each card opens the canonical surface the workflow routes through — no parallel UI."
          as="h2"
        />
        <ul className="grid gap-3 md:grid-cols-2">
          {audience.whatYouCanDo.map((cap) => (
            <li key={cap.href}>
              <Link
                href={cap.href}
                className="card-surface block h-full space-y-1.5 p-4 transition hover:border-primary/30 hover:shadow-elevated"
              >
                <p className="text-sm font-semibold text-foreground">
                  {cap.title} →
                </p>
                <p className="text-xs text-muted-foreground">
                  {cap.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <AudienceArtifactList artifacts={audience.artifactsYouCanProduce} />

      {audience.artifactWalkthrough ? (
        <section
          aria-label="Artifact walkthrough"
          className="card-surface space-y-3 p-5 text-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Artifact walkthrough
          </p>
          <p className="text-xs text-muted-foreground">
            Per-artifact instructions — open the route, capture the
            output, paste into the brief. Substitute your own values.
          </p>
          <ul className="space-y-3">
            {audience.artifactWalkthrough.map((step) => (
              <li
                key={step.artifact}
                className="rounded-lg border border-border bg-card p-3"
              >
                <p className="text-sm font-semibold text-foreground">
                  {step.artifact}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {step.howToProduce}
                </p>
                <p className="mt-2 text-xs">
                  <Link
                    href={step.route}
                    className="text-primary hover:underline"
                  >
                    Open {step.route} →
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <AudienceWorkflow audience={audience} />

      <AudienceDoesNotPromise items={audience.doesNotPromise} />

      <aside
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="Related routes"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Related routes
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <Link href="/learn" className="text-primary hover:underline">
              /learn
            </Link>{" "}
            — concept lessons.
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
          <li>
            <Link href="/lab" className="text-primary hover:underline">
              /lab
            </Link>{" "}
            — testing playbooks + templates + prompt sets.
          </li>
          <li>
            <Link href="/demos" className="text-primary hover:underline">
              /demos
            </Link>{" "}
            — guided workflow walkthroughs.
          </li>
          <li>
            <Link href="/select" className="text-primary hover:underline">
              /select
            </Link>{" "}
            ·{" "}
            <Link
              href="/compare/build"
              className="text-primary hover:underline"
            >
              /compare/build
            </Link>{" "}
            ·{" "}
            <Link
              href="/briefs/build"
              className="text-primary hover:underline"
            >
              /briefs/build
            </Link>{" "}
            — workspaces every path opens.
          </li>
          <li>
            <Link href="/sources" className="text-primary hover:underline">
              /sources
            </Link>{" "}
            ·{" "}
            <Link href="/coverage" className="text-primary hover:underline">
              /coverage
            </Link>{" "}
            — verified-data backbone.
          </li>
          <li>
            <Link
              href="/docs/platform-positioning"
              className="text-primary hover:underline"
            >
              /docs/platform-positioning
            </Link>{" "}
            — what this platform is, what it is not.
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
