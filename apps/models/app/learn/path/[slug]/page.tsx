import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { LearningPathTimeline } from "@/components/learn/LearningPathTimeline";
import { LearningPathProduces } from "@/components/learn/LearningPathProduces";
import { NoProgressPolicy } from "@/components/learn/NoProgressPolicy";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import {
  getLearningPath,
  getLearningPaths,
} from "@/lib/learning-paths";

interface RouteParams {
  slug: string;
}

export function generateStaticParams(): RouteParams[] {
  return getLearningPaths().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const path = getLearningPath(slug);
  if (!path) {
    return buildMetadata({
      title: "Learning path",
      path: `/learn/path/${slug}`,
    });
  }
  return buildMetadata({
    title: `${path.title} — learning path`,
    description: path.summary,
    path: `/learn/path/${path.slug}`,
    keywords: [
      "learn ai model selection",
      "ai model selection path",
      `ai ${path.audience} learning path`,
    ],
  });
}

export default async function LearningPathDetailPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const path = getLearningPath(slug);
  if (!path) notFound();

  const firstStep = path.steps[0];

  return (
    <PageShell
      eyebrow={`Learn · Path · ${path.audienceLabel}`}
      title={path.title}
      intro={path.summary}
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Learn", href: "/learn" },
          { name: "Paths", href: "/learn/paths" },
          { name: path.title, href: `/learn/path/${path.slug}` },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Learn", href: "/learn" },
            { name: "Paths", href: "/learn/paths" },
            { name: path.title, href: `/learn/path/${path.slug}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Course",
            name: path.title,
            description: path.summary,
            url: `${siteConfig.url}/learn/path/${path.slug}`,
            provider: {
              "@type": "Organization",
              name: siteConfig.ecosystem,
              url: "https://webmasterid.com",
            },
            isAccessibleForFree: true,
            inLanguage: siteConfig.locale,
            dateModified: siteConfig.buildDate,
            timeRequired: `PT${path.estimatedMinutes}M`,
            educationalLevel: path.difficulty,
            hasPart: path.steps.map((s) => ({
              "@type": "Action",
              name: s.title,
              description: s.purpose,
              url:
                s.type === "lesson"
                  ? `${siteConfig.url}/learn/${s.slug}`
                  : s.type === "exercise"
                    ? `${siteConfig.url}/learn/exercises/${s.slug}`
                    : `${siteConfig.url}${s.href}`,
            })),
          },
        ]}
      />

      <aside
        role="note"
        aria-label="Path policy"
        className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          A path, not a certification.
        </p>
        <p>{path.policyNote}</p>
      </aside>

      <section
        aria-label="At a glance"
        className="card-surface grid gap-3 p-5 text-sm sm:grid-cols-3"
      >
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Audience
          </p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {path.audienceLabel}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Difficulty
          </p>
          <p className="mt-1 text-base font-semibold text-foreground capitalize">
            {path.difficulty}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Estimated time
          </p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {path.estimatedMinutes} min · {path.steps.length} steps
          </p>
        </div>
      </section>

      <LearningPathProduces path={path} />

      <section
        aria-label="Prerequisites"
        className="card-surface space-y-2 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Prerequisites
        </p>
        {path.prerequisites.length ? (
          <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
            {path.prerequisites.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">
            No prior catalogue knowledge required.
          </p>
        )}
      </section>

      <section aria-label="Timeline" className="space-y-3">
        <SectionHeader
          eyebrow="Timeline"
          title={`${path.steps.length} steps`}
          description="Open each step in the order shown. The route on every step is the canonical workspace or lesson — no parallel UI."
          as="h2"
        />
        <LearningPathTimeline steps={path.steps} />
      </section>

      {firstStep ? (
        <section
          aria-label="Start next"
          className="card-surface space-y-2 p-5 text-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Start next
          </p>
          <p className="text-foreground">
            <span className="font-semibold">Step 1 of {path.steps.length}:</span>{" "}
            {firstStep.title}
          </p>
          <p className="text-muted-foreground">{firstStep.purpose}</p>
          <p>
            <Link
              href={
                firstStep.type === "lesson"
                  ? `/learn/${firstStep.slug}`
                  : firstStep.type === "exercise"
                    ? `/learn/exercises/${firstStep.slug}`
                    : firstStep.href
              }
              className="inline-flex h-9 items-center rounded-lg border border-primary/40 bg-primary/10 px-3 text-sm font-medium text-primary hover:bg-primary/15"
            >
              Open first step →
            </Link>
          </p>
        </section>
      ) : null}

      <section
        aria-label="What this path does not promise"
        className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          What this path does not promise
        </p>
        <ul className="ml-5 list-disc space-y-1">
          {path.doesNotPromise.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        aria-label="How to use this path"
        className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          How to use this path
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            Open each route in the order shown. The path is a
            sequenced reading + practice plan, nothing more.
          </li>
          <li>
            Keep the artifacts you produce — the shortlist URL,
            comparison URL, Markdown brief, freshness checklist, or
            test plan.
          </li>
          <li>
            There is no login surface, no progress state, and no
            completion certificate.
          </li>
          <li>
            External workload-specific testing remains your team's
            responsibility — the catalogue surfaces evidence, not
            verdicts.
          </li>
        </ul>
      </section>

      <NoProgressPolicy />

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
            — the curriculum landing.
          </li>
          <li>
            <Link
              href="/learn/paths"
              className="text-primary hover:underline"
            >
              /learn/paths
            </Link>{" "}
            — all four role-based paths in one place.
          </li>
          <li>
            <Link
              href="/learn/exercises"
              className="text-primary hover:underline"
            >
              /learn/exercises
            </Link>{" "}
            — the full exercises catalogue.
          </li>
          <li>
            <Link href="/select" className="text-primary hover:underline">
              /select
            </Link>{" "}
            — the selection workspace.
          </li>
          <li>
            <Link
              href="/compare/build"
              className="text-primary hover:underline"
            >
              /compare/build
            </Link>{" "}
            — the comparison builder.
          </li>
          <li>
            <Link
              href="/briefs/build"
              className="text-primary hover:underline"
            >
              /briefs/build
            </Link>{" "}
            — the decision brief builder.
          </li>
          <li>
            <Link href="/sources" className="text-primary hover:underline">
              /sources
            </Link>{" "}
            — the citation registry.
          </li>
          <li>
            <Link
              href="/reverification"
              className="text-primary hover:underline"
            >
              /reverification
            </Link>{" "}
            — the reverification queue.
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
