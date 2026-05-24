import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { LearningPathPicker } from "@/components/learn/LearningPathPicker";
import { NoProgressPolicy } from "@/components/learn/NoProgressPolicy";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { getLearningPaths } from "@/lib/learning-paths";

export const metadata: Metadata = buildMetadata({
  title: "Learning paths",
  description:
    "Role-based learning paths that sequence lessons, exercises, and workflows into an AI usage curriculum. Beginner, developer, product manager, governance, and automation-specialist paths.",
  path: "/learn/paths",
  keywords: [
    "learn ai model selection path",
    "ai model curriculum",
    "role based ai learning",
    "ai developer learning path",
    "ai governance learning path",
    "automation ai learning path",
  ],
});

export default function LearningPathsIndexPage() {
  const paths = getLearningPaths();
  return (
    <PageShell
      eyebrow="Learn · Paths"
      title="Role-based learning paths"
      intro="Each path sequences existing lessons, exercises, and workflow surfaces into an AI usage curriculum. Paths are guidance — not certifications — and every one ends with concrete evidence artifacts you can share with the rest of the team."
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Learn", href: "/learn" },
          { name: "Paths", href: "/learn/paths" },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Learn", href: "/learn" },
            { name: "Paths", href: "/learn/paths" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Role-based AI model selection learning paths",
            url: `${siteConfig.url}/learn/paths`,
            description:
              "Five role-based paths: beginner, developer, product manager, governance, automation specialist.",
            dateModified: siteConfig.buildDate,
            isPartOf: { "@type": "WebSite", url: siteConfig.url },
            hasPart: paths.map((p) => ({
              "@type": "Course",
              name: p.title,
              description: p.summary,
              url: `${siteConfig.url}/learn/path/${p.slug}`,
              timeRequired: `PT${p.estimatedMinutes}M`,
              educationalLevel: p.difficulty,
            })),
          },
        ]}
      />

      <aside
        role="note"
        aria-label="Paths policy"
        className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          Curriculum, not certification.
        </p>
        <p>
          Paths are recommended orderings of pages that already exist
          on the site. There is no login, no progress state, no
          completion certificate — completion is the artifacts (URL,
          Markdown, JSON, checklist) the path puts in your hands.
        </p>
      </aside>

      <section aria-label="Choose your path" id="paths" className="space-y-3">
        <SectionHeader
          eyebrow="Choose your path"
          title="Five role-based paths"
          description="Pick the audience that fits your work. Every path uses the same underlying lessons, exercises, and workflows — only the sequence and emphasis change."
          as="h2"
        />
        <LearningPathPicker />
      </section>

      <section
        aria-label="What paths produce"
        className="card-surface space-y-3 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          What paths produce
        </p>
        <p className="text-muted-foreground">
          Every path ends with concrete artifacts. Different paths
          emphasise different artifacts; nothing is invented and no
          path produces a recommendation.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "A /select URL that opens your shortlist",
            "A /compare/build URL that renders verified fields side by side",
            "A Markdown evidence brief",
            "A source freshness checklist",
            "A written external test plan",
            "A safe model-use checklist for automations",
          ].map((item) => (
            <li
              key={item}
              className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <NoProgressPolicy />

      <aside
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="Other learning surfaces"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Other learning surfaces
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
              href="/learn/exercises"
              className="text-primary hover:underline"
            >
              /learn/exercises
            </Link>{" "}
            — all eight exercises with difficulty + minutes.
          </li>
          <li>
            <Link
              href="/how-it-works"
              className="text-primary hover:underline"
            >
              /how-it-works
            </Link>{" "}
            — the five-step decision workflow without the curriculum
            framing.
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
            — the workspaces every path eventually opens.
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
