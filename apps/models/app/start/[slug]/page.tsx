import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { StartPathSummary } from "@/components/onboarding/StartPathSummary";
import { StartRouteList } from "@/components/onboarding/StartRouteList";
import { StartPolicyNote } from "@/components/onboarding/StartPolicyNote";
import { buildMetadata, breadcrumbJsonLd, articleJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import {
  getOnboardingPath,
  getOnboardingPaths,
} from "@/lib/onboarding";

interface RouteParams {
  slug: string;
}

export function generateStaticParams(): RouteParams[] {
  return getOnboardingPaths().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const path = getOnboardingPath(slug);
  if (!path) {
    return buildMetadata({
      title: "Start here",
      path: `/start/${slug}`,
    });
  }
  return buildMetadata({
    title: `Start here — ${path.title}`,
    description: path.summary,
    path: `/start/${path.slug}`,
    keywords: [
      `ai usage onboarding ${path.slug}`,
      `${path.slug} learning path`,
      `${path.slug} model evaluation`,
    ],
  });
}

export default async function RoleStartPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const path = getOnboardingPath(slug);
  if (!path) notFound();

  const pagePath = `/start/${path.slug}`;
  const primaryCta = path.startRoutes.learningPath;
  const secondaryCta = path.startRoutes.kit ?? path.startRoutes.resourceFinder;

  return (
    <PageShell
      eyebrow={`Start here · ${path.audienceLabel}`}
      title={`Start here — ${path.title}`}
      intro={path.summary}
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Start here", href: "/start" },
          { name: path.title, href: pagePath },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Start here", href: "/start" },
            { name: path.title, href: pagePath },
          ]),
          articleJsonLd({
            type: "TechArticle",
            headline: `Start here — ${path.title}`,
            description: path.summary,
            path: pagePath,
            dateModified: siteConfig.buildDate,
          }),
        ]}
      />

      <section
        aria-label="At a glance"
        className="card-surface grid gap-3 p-5 text-sm sm:grid-cols-3"
      >
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Role
          </p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {path.title}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            First step
          </p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {path.firstStep}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Estimated time
          </p>
          <p className="mt-1 text-base font-semibold text-foreground">
            ~{path.estimatedMinutes} min
          </p>
        </div>
      </section>

      <StartPathSummary path={path} />

      <StartRouteList path={path} />

      <section
        aria-label="What you will produce"
        className="card-surface space-y-3 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          What you will produce
        </p>
        <p className="text-xs text-muted-foreground">
          Completion is the artifacts the path puts in your hands —
          not a certificate, badge, or progress bar.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {path.artifacts.map((a) => (
            <li key={a.href}>
              <Link
                href={a.href}
                className="card-surface block h-full space-y-1 p-3 transition hover:border-primary/30"
              >
                <p className="text-sm font-semibold text-foreground">
                  {a.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {a.description}
                </p>
                <p className="text-[11px] font-medium text-primary">
                  Open →
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="What this does not promise"
        className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          What this does not promise
        </p>
        <ul className="ml-5 list-disc space-y-1">
          {path.doesNotPromise.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </section>

      <StartPolicyNote />

      <SectionHeader
        eyebrow="Next step"
        title="Open the first route"
        description="Start with the learning path, or jump to the kit / finder if you already know the shape of the work."
        as="h2"
      />
      <section
        aria-label="Primary next-step CTAs"
        className="card-surface space-y-3 p-5 text-sm"
      >
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={primaryCta.href}
            className="inline-flex h-10 items-center rounded-lg border border-primary/40 bg-primary/15 px-4 text-sm font-semibold text-primary hover:bg-primary/20"
          >
            {primaryCta.label} →
          </Link>
          {secondaryCta.href !== primaryCta.href ? (
            <Link
              href={secondaryCta.href}
              className="inline-flex h-10 items-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground hover:border-primary/30"
            >
              {secondaryCta.label} →
            </Link>
          ) : null}
          <Link
            href="/resources"
            className="text-xs text-primary hover:underline"
          >
            Or browse all resources →
          </Link>
        </div>
      </section>

      <aside
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="Back to Start Here"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Back to Start Here
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <Link
              href="/start"
              className="text-primary hover:underline"
            >
              /start
            </Link>{" "}
            — all role start pages.
          </li>
          <li>
            <Link
              href="/docs/resource-map"
              className="text-primary hover:underline"
            >
              /docs/resource-map
            </Link>{" "}
            — how the product surfaces fit together.
          </li>
          <li>
            <Link href="/for" className="text-primary hover:underline">
              /for
            </Link>{" "}
            — audience entry points.
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
