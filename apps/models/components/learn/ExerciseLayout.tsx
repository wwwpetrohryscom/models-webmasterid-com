import type { ReactNode } from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, articleJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import type { LearningExercise } from "@/lib/learning-exercises";
import { getLesson } from "@/lib/lessons";

/**
 * ExerciseLayout — shared shell for every /learn/exercises/<slug>
 * page. Renders breadcrumbs, hero, body, the related-lessons sidebar,
 * and the "what this exercise does not produce" footer in a consistent
 * order. Pure server component.
 */
export function ExerciseLayout({
  exercise,
  children,
  notForBullets,
}: {
  exercise: LearningExercise;
  children: ReactNode;
  notForBullets: string[];
}) {
  const path = `/learn/exercises/${exercise.slug}`;
  const relatedLessons = exercise.relatedLessonSlugs
    .map((slug) => getLesson(slug))
    .filter((l): l is NonNullable<ReturnType<typeof getLesson>> => Boolean(l));

  return (
    <div className="container-page py-10 md:py-14">
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Learn", href: "/learn" },
          { name: "Exercises", href: "/learn/exercises" },
          { name: exercise.title, href: path },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Learn", href: "/learn" },
            { name: "Exercises", href: "/learn/exercises" },
            { name: exercise.title, href: path },
          ]),
          articleJsonLd({
            type: "TechArticle",
            headline: exercise.title,
            description: exercise.summary,
            path,
            dateModified: siteConfig.buildDate,
          }),
        ]}
      />

      <header className="mt-6 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Exercise · {exercise.difficulty}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {exercise.title}
        </h1>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          {exercise.summary}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Estimated time: {exercise.estimatedMinutes} minute
          {exercise.estimatedMinutes === 1 ? "" : "s"}. Exercises produce
          evidence artifacts, never model recommendations.
        </p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="prose-content max-w-none space-y-8 text-[15px] leading-relaxed text-muted-foreground">
          {children}

          <section
            aria-label="What this exercise does not produce"
            className="card-surface space-y-2 p-5 text-sm not-prose"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              What this exercise does not produce
            </p>
            <ul className="ml-5 list-disc space-y-1">
              {notForBullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </section>
        </article>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          <section
            aria-label="Related lessons"
            className="card-surface space-y-2 p-5 text-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Related lessons
            </p>
            {relatedLessons.length ? (
              <ul className="space-y-1.5">
                {relatedLessons.map((l) => (
                  <li key={l.slug}>
                    <Link
                      href={`/learn/${l.slug}`}
                      className="text-primary hover:underline"
                    >
                      {l.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {l.oneLine}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                No related lesson registered yet.
              </p>
            )}
          </section>

          <section
            aria-label="Evidence artifact"
            className="card-surface space-y-2 p-5 text-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Evidence artifact
            </p>
            <p className="text-muted-foreground">
              {exercise.evidenceArtifact}
            </p>
          </section>

          <section
            aria-label="Exercise policy"
            className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Exercise policy
            </p>
            <p>{exercise.policyNote}</p>
            <p className="text-xs">
              Canonical: {siteConfig.url}
              {path}.
            </p>
          </section>

          <section
            aria-label="Related workflows"
            className="card-surface space-y-2 p-5 text-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Related workflows
            </p>
            <ul className="space-y-1 text-sm">
              <li>
                <Link
                  href="/select"
                  className="text-primary hover:underline"
                >
                  /select
                </Link>
              </li>
              <li>
                <Link
                  href="/compare/build"
                  className="text-primary hover:underline"
                >
                  /compare/build
                </Link>
              </li>
              <li>
                <Link
                  href="/briefs/build"
                  className="text-primary hover:underline"
                >
                  /briefs/build
                </Link>
              </li>
              <li>
                <Link
                  href="/sources"
                  className="text-primary hover:underline"
                >
                  /sources
                </Link>
              </li>
              <li>
                <Link
                  href="/coverage"
                  className="text-primary hover:underline"
                >
                  /coverage
                </Link>
              </li>
              <li>
                <Link
                  href="/reverification"
                  className="text-primary hover:underline"
                >
                  /reverification
                </Link>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
