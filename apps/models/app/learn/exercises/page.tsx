import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { ExerciseCard } from "@/components/learn/ExerciseCard";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import {
  getLearningExerciseGroups,
  learningExercises,
} from "@/lib/learning-exercises";

export const metadata: Metadata = buildMetadata({
  title: "Practical AI model selection exercises",
  description:
    "Use short, source-backed workflows to practise building shortlists, comparing verified fields, checking sources, and creating decision evidence. Exercises produce evidence, not model recommendations.",
  path: "/learn/exercises",
  keywords: [
    "ai model selection exercises",
    "ai model evaluation practice",
    "compare ai models practice",
    "decision brief exercise",
    "source verification exercise",
  ],
});

export default function ExercisesHubPage() {
  const groups = getLearningExerciseGroups();
  return (
    <PageShell
      eyebrow="Learn · Practice"
      title="Practical AI model selection exercises"
      intro="Use short, source-backed workflows to practise building shortlists, comparing verified fields, checking sources, and creating decision evidence. Each exercise ends with a concrete artifact you can share with the rest of the team."
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Learn", href: "/learn" },
          { name: "Exercises", href: "/learn/exercises" },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Learn", href: "/learn" },
            { name: "Exercises", href: "/learn/exercises" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Practical AI model selection exercises",
            url: `${siteConfig.url}/learn/exercises`,
            description:
              "Practical exercises that walk the reader from a lesson concept into the verified-data product surfaces.",
            dateModified: siteConfig.buildDate,
            isPartOf: { "@type": "WebSite", url: siteConfig.url },
            hasPart: learningExercises.map((e) => ({
              "@type": "HowTo",
              name: e.title,
              description: e.summary,
              totalTime: `PT${e.estimatedMinutes}M`,
              url: `${siteConfig.url}/learn/exercises/${e.slug}`,
            })),
          },
        ]}
      />

      <aside
        role="note"
        aria-label="Exercise policy"
        className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          Exercises produce evidence, not model recommendations.
        </p>
        <p>
          Each exercise routes you through the existing selection,
          comparison, brief, sources, and reverification workspaces and
          asks you to end with a concrete artifact (a shortlist URL, a
          comparison URL, a brief export, or a freshness note).
          Exercises never declare a winner, score the reader, or assert
          which model is best.
        </p>
      </aside>

      <section
        aria-label="Learning path flow"
        className="card-surface space-y-3 p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Learning path
        </p>
        <ol className="grid gap-2 text-sm md:grid-cols-5">
          {[
            { step: "1", label: "Read lesson", route: "/learn" },
            {
              step: "2",
              label: "Complete exercise",
              route: "/learn/exercises",
            },
            { step: "3", label: "Build shortlist", route: "/select" },
            { step: "4", label: "Compare fields", route: "/compare/build" },
            { step: "5", label: "Export brief", route: "/briefs/build" },
          ].map((tile) => (
            <li
              key={tile.step}
              className="rounded-xl border border-border bg-card p-3"
            >
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Step {tile.step}
              </p>
              <Link
                href={tile.route}
                className="mt-1 block text-sm font-semibold text-foreground hover:underline"
              >
                {tile.label}
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {groups.map((group) => (
        <section
          key={group.difficulty}
          aria-label={group.label}
          className="space-y-3"
        >
          <SectionHeader
            eyebrow={group.label}
            title={`${group.exercises.length} exercise${group.exercises.length === 1 ? "" : "s"}`}
            description={
              group.difficulty === "beginner"
                ? "Short workflows that produce a shortlist URL, a comparison URL, a pricing note, or a freshness note."
                : "Longer workflows that produce a hosted-provider trace, a decision brief, or a written test plan."
            }
            as="h2"
          />
          <ul className="grid gap-3 lg:grid-cols-2">
            {group.exercises.map((e) => (
              <li key={e.slug}>
                <ExerciseCard exercise={e} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <aside
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="Related references"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Related references
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <Link href="/learn" className="text-primary hover:underline">
              /learn
            </Link>{" "}
            — the concept lessons that frame each exercise.
          </li>
          <li>
            <Link
              href="/learn/path/beginner"
              className="text-primary hover:underline"
            >
              /learn/path/beginner
            </Link>{" "}
            — the curated beginner path that pairs the first lessons
            with the first exercises.
          </li>
          <li>
            <Link
              href="/how-it-works"
              className="text-primary hover:underline"
            >
              /how-it-works
            </Link>{" "}
            — the five-step decision workflow without the lesson
            framing.
          </li>
          <li>
            <Link href="/demos" className="text-primary hover:underline">
              /demos
            </Link>{" "}
            — pre-packaged route plans you can walk before doing the
            exercises.
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
