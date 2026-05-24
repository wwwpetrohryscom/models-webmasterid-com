import type { ReactNode } from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, articleJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import type { LessonSummary } from "@/lib/lessons";
import { getLearningPathsForLesson } from "@/lib/learning-paths";
import { TeachingExample } from "@/components/learn/TeachingExample";
import { BadBetterExample } from "@/components/learn/BadBetterExample";
import { ArtifactExample } from "@/components/learn/ArtifactExample";
import { WorkflowBridge } from "@/components/learn/WorkflowBridge";
import { ReviewChecklist } from "@/components/learn/ReviewChecklist";

/**
 * LessonLayout — shared shell for every /learn/<slug> lesson page.
 *
 * Renders breadcrumbs, hero, body, the apply panel, the related-lesson
 * strip, and a "what this lesson is not" footer block in a consistent
 * order. Pure server component. No client JS.
 *
 * Lesson pages stay focused on prose + verified examples; everything
 * else (citations, breadcrumbs, related lessons, apply links, JSON-LD)
 * is delegated to this shell.
 */
export function LessonLayout({
  lesson,
  description,
  children,
  notForBullets,
  relatedLessons,
}: {
  lesson: LessonSummary;
  description: string;
  children: ReactNode;
  notForBullets: string[];
  relatedLessons: LessonSummary[];
}) {
  const path = `/learn/${lesson.slug}`;
  return (
    <div className="container-page py-10 md:py-14">
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Learn", href: "/learn" },
          { name: lesson.title, href: path },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Learn", href: "/learn" },
            { name: lesson.title, href: path },
          ]),
          articleJsonLd({
            type: "TechArticle",
            headline: lesson.title,
            description,
            path,
            dateModified: `${lesson.updatedDate}T00:00:00.000Z`,
          }),
        ]}
      />

      <header className="mt-6 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Learn · {lesson.group.replace(/-/g, " ")}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {lesson.title}
        </h1>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          {description}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Last reviewed {lesson.updatedDate}. Lesson copy is reviewed
          when the underlying catalogue policy changes — not on a
          fixed cadence.
        </p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="prose-content max-w-none space-y-8 text-[15px] leading-relaxed text-muted-foreground">
          {children}

          {lesson.teachingExample ? (
            <TeachingExample example={lesson.teachingExample} />
          ) : null}

          {lesson.badBetterExample ? (
            <BadBetterExample example={lesson.badBetterExample} />
          ) : null}

          {lesson.artifactExample ? (
            <ArtifactExample
              artifact={lesson.artifactExample}
              caption="Substitute your real values when you walk the workflow. The catalogue never generates this artifact for you."
            />
          ) : null}

          {lesson.workflowBridge ? (
            <WorkflowBridge steps={lesson.workflowBridge} />
          ) : null}

          {lesson.reviewChecklist ? (
            <ReviewChecklist
              items={lesson.reviewChecklist}
              caution="No persistence — the checklist resets on every visit. Capture progress in your own notes."
            />
          ) : null}

          <section aria-label="What this lesson does not teach" className="card-surface space-y-2 p-5 text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              What this lesson does not teach
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
            aria-label="Apply this workflow"
            className="card-surface space-y-3 p-5 text-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Apply this workflow
            </p>
            <ul className="space-y-2">
              {lesson.applyRoutes.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded-lg border border-border bg-card p-3 transition hover:border-primary/30"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {link.label} →
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {link.purpose}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {(() => {
            const paths = getLearningPathsForLesson(lesson.slug);
            if (!paths.length) return null;
            return (
              <section
                aria-label="This lesson appears in these paths"
                className="card-surface space-y-2 p-5 text-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  This lesson appears in
                </p>
                <ul className="space-y-1.5">
                  {paths.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/learn/path/${p.slug}`}
                        className="text-primary hover:underline"
                      >
                        {p.title} →
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {p.audienceLabel} · {p.estimatedMinutes} min
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })()}

          {relatedLessons.length ? (
            <section
              aria-label="Related lessons"
              className="card-surface space-y-2 p-5 text-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Related lessons
              </p>
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
            </section>
          ) : null}

          <section
            aria-label="Lesson policy"
            className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Lesson policy
            </p>
            <p>
              Lessons explain how to inspect verified catalogue fields.
              They do not pick which model to use, declare a winner,
              rank by price, or assert latency, throughput, uptime, or
              compliance certifications.
            </p>
            <p className="text-xs">
              Source for the catalogue values referenced here:{" "}
              <Link
                href="/sources"
                className="text-primary hover:underline"
              >
                /sources
              </Link>
              . Canonical: {siteConfig.url}
              {path}.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
