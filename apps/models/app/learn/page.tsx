import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { ExerciseCard } from "@/components/learn/ExerciseCard";
import { LearningPathPicker } from "@/components/learn/LearningPathPicker";
import { NoProgressPolicy } from "@/components/learn/NoProgressPolicy";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { lessons, getLesson } from "@/lib/lessons";
import { learningExercises } from "@/lib/learning-exercises";
import { getLearningPaths } from "@/lib/learning-paths";

export const metadata: Metadata = buildMetadata({
  title: "Learn how to use AI models correctly",
  description:
    "AI usage learning platform powered by verified model intelligence. Role-based paths sequence concept lessons, practical exercises, and verified-data workflows into a curriculum — beginner, developer, product manager, governance, automation specialist.",
  path: "/learn",
  keywords: [
    "learn ai model selection",
    "ai usage curriculum",
    "ai model fundamentals",
    "role based ai learning path",
    "ai model selection exercises",
    "context window explained",
    "ai model pricing references",
    "hosted vs first-party ai models",
    "ai model lifecycle",
  ],
});

export default function LearnHubPage() {
  // The concept lesson groupings — by learning path — drive the body
  // of the hub. We keep the hub structured (start here · concept
  // lessons · practical exercises · apply with workflows · advanced
  // reading) so the hub reads like a learning product, not a list.
  const beginnerLessons = [
    "how-to-choose-ai-model",
    "context-window",
    "hosted-vs-first-party",
    "pricing-references",
  ]
    .map((slug) => getLesson(slug))
    .filter((l): l is NonNullable<ReturnType<typeof getLesson>> => Boolean(l));
  const intermediateLessons = [
    "model-lifecycle",
    "testing-ai-models",
    "multimodal-input",
    "structured-output",
    "status-aware-selection",
    "benchmark-limitations",
  ]
    .map((slug) => getLesson(slug))
    .filter((l): l is NonNullable<ReturnType<typeof getLesson>> => Boolean(l));

  const paths = getLearningPaths();
  return (
    <PageShell
      eyebrow="Learn"
      title="Learn how to use AI models correctly"
      intro="Follow role-based learning paths that teach AI model concepts, then apply them through source-backed shortlists, comparisons, evidence briefs, and freshness checks. AI usage curriculum powered by verified model intelligence."
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Learn", href: "/learn" },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Learn", href: "/learn" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Learn AI model selection",
            url: `${siteConfig.url}/learn`,
            description:
              "AI usage learning platform powered by verified model intelligence. Role-based paths, concept lessons, practical exercises — each linked to the catalogue workflows that apply the lesson.",
            dateModified: siteConfig.buildDate,
            isPartOf: { "@type": "WebSite", url: siteConfig.url },
            hasPart: [
              ...paths.map((p) => ({
                "@type": "Course",
                name: p.title,
                url: `${siteConfig.url}/learn/path/${p.slug}`,
                description: p.summary,
                timeRequired: `PT${p.estimatedMinutes}M`,
                educationalLevel: p.difficulty,
              })),
              ...lessons.map((l) => ({
                "@type": "TechArticle",
                name: l.title,
                url: `${siteConfig.url}/learn/${l.slug}`,
                description: l.oneLine,
              })),
              ...learningExercises.map((e) => ({
                "@type": "HowTo",
                name: e.title,
                url: `${siteConfig.url}/learn/exercises/${e.slug}`,
                description: e.summary,
              })),
            ],
          },
        ]}
      />

      <section
        aria-label="Hero call to action"
        className="card-surface space-y-4 p-5 sm:p-6"
      >
        <p className="text-sm text-muted-foreground">
          The catalogue is a verified-data backbone. The lessons here
          explain how to <em>read</em> that data; the exercises walk
          you through producing concrete evidence artifacts using the
          existing selection, comparison, brief, and sources
          workspaces. Lessons never tell you which AI model to pick.
        </p>
        <ul className="flex flex-wrap gap-2 text-sm">
          <li>
            <Link
              href="/learn/path/beginner"
              className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 font-medium text-primary hover:bg-primary/15"
            >
              Start beginner path
            </Link>
          </li>
          <li>
            <Link
              href="#paths"
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-foreground hover:border-primary/30"
            >
              Choose your role
            </Link>
          </li>
          <li>
            <Link
              href="/learn/exercises"
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-foreground hover:border-primary/30"
            >
              Practise with exercises
            </Link>
          </li>
          <li>
            <Link
              href="/learn/paths"
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-foreground hover:border-primary/30"
            >
              All paths
            </Link>
          </li>
        </ul>
      </section>

      <section
        aria-label="Learn, apply, verify"
        className="space-y-3"
      >
        <SectionHeader
          eyebrow="Curriculum"
          title="Learn → Apply → Verify"
          description="Concept lessons explain the verified fields. Exercises route those concepts through the workspaces. Sources anchor every claim — every step of the curriculum stays auditable."
          as="h2"
        />
        <div className="grid gap-3 md:grid-cols-3">
        {[
          {
            eyebrow: "Learn",
            title: "Learn concepts",
            body: "Plain-language lessons on context windows, pricing references, hosted vs first-party, lifecycle, status, structured output, and benchmark limits.",
            cta: { label: "Open lessons", href: "#concept-lessons" },
          },
          {
            eyebrow: "Apply",
            title: "Apply with workflows",
            body: "Practical exercises that route through the selection, comparison, and brief workspaces — ending with shortlist URLs, comparison URLs, Markdown briefs, freshness checklists, and test plans.",
            cta: { label: "All exercises", href: "/learn/exercises" },
          },
          {
            eyebrow: "Verify",
            title: "Verify with sources",
            body: "Every claim in the catalogue is anchored to a primary-source citation with a retrievedAt date. The reverification queue surfaces what is due for re-check.",
            cta: { label: "Open citation registry", href: "/sources" },
          },
        ].map((card) => (
          <article
            key={card.title}
            className="card-surface space-y-2 p-5 text-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {card.eyebrow}
            </p>
            <p className="text-base font-semibold text-foreground">
              {card.title}
            </p>
            <p className="text-muted-foreground">{card.body}</p>
            <p>
              <Link
                href={card.cta.href}
                className="text-xs font-medium text-primary hover:underline"
              >
                {card.cta.label} →
              </Link>
            </p>
          </article>
        ))}
        </div>
      </section>

      <section
        aria-label="Choose your learning path"
        id="paths"
        className="space-y-3"
      >
        <SectionHeader
          eyebrow="Choose your path"
          title="Role-based learning paths"
          description="Five sequenced curriculums (beginner, developer, product manager, governance, automation specialist). Same lessons and exercises — different sequence and emphasis."
          cta={{ label: "All paths", href: "/learn/paths" }}
          as="h2"
        />
        <LearningPathPicker />
      </section>

      <aside
        role="note"
        aria-label="Learning policy"
        className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          What these lessons and exercises are — and what they are
          not.
        </p>
        <p>
          Lessons explain how AI model fields behave (context, output,
          pricing references, hosted vs first-party, lifecycle, status,
          benchmark limits) so the reader can inspect verified
          catalogue rows with the right questions in mind. Exercises
          route you through the workflows and produce concrete
          artifacts (shortlist URL, comparison URL, brief Markdown,
          freshness checklist). Neither lessons nor exercises declare a
          winner, rank models by price, score the reader, certify
          compliance, or recommend a specific model for any workload.
        </p>
      </aside>

      <section
        id="concept-lessons"
        aria-label="Concept lessons"
        className="space-y-3"
      >
        <SectionHeader
          eyebrow="Concept lessons"
          title="Concept lessons"
          description="Plain-language reads that explain one verified catalogue field at a time. Every lesson ends with a workflow apply panel + related exercises."
          as="h2"
        />
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Foundations
            </p>
            <ul className="mt-2 grid gap-3 lg:grid-cols-2">
              {beginnerLessons.map((lesson) => (
                <li key={lesson.slug}>
                  <Link
                    href={`/learn/${lesson.slug}`}
                    className="card-surface block h-full p-5 transition hover:border-primary/30 hover:shadow-elevated"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {lesson.group.replace(/-/g, " ")}
                    </p>
                    <p className="mt-1 text-base font-semibold text-foreground">
                      {lesson.title}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {lesson.oneLine}
                    </p>
                    <p className="mt-3 text-xs font-medium text-primary">
                      Read lesson →
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Going deeper
            </p>
            <ul className="mt-2 grid gap-3 lg:grid-cols-2">
              {intermediateLessons.map((lesson) => (
                <li key={lesson.slug}>
                  <Link
                    href={`/learn/${lesson.slug}`}
                    className="card-surface block h-full p-5 transition hover:border-primary/30 hover:shadow-elevated"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {lesson.group.replace(/-/g, " ")}
                    </p>
                    <p className="mt-1 text-base font-semibold text-foreground">
                      {lesson.title}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {lesson.oneLine}
                    </p>
                    <p className="mt-3 text-xs font-medium text-primary">
                      Read lesson →
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section
        id="practical-exercises"
        aria-label="Practical exercises"
        className="space-y-3"
      >
        <SectionHeader
          eyebrow="Practical exercises"
          title="Practise with exercises"
          description="Short, source-backed workflows that route through the catalogue and end with a concrete artifact. No quizzes, no scoring, no model picks."
          cta={{
            label: "All exercises",
            href: "/learn/exercises",
          }}
          as="h2"
        />
        <ul className="grid gap-3 lg:grid-cols-2">
          {learningExercises.slice(0, 4).map((e) => (
            <li key={e.slug}>
              <ExerciseCard exercise={e} />
            </li>
          ))}
        </ul>
      </section>

      <section
        id="apply-with-workflows"
        aria-label="Apply with workflows"
        className="card-surface space-y-3 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Apply with workflows
        </p>
        <p className="text-muted-foreground">
          Every lesson and every exercise routes the reader through
          the existing workspaces. Open any of these directly when you
          know the surface you want.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              href: "/select",
              label: "Selection workspace",
              detail:
                "Filter the catalogue by use case, verification state, lifecycle.",
            },
            {
              href: "/compare/build",
              label: "Comparison builder",
              detail:
                "Render up to four models against each other — verified fields only.",
            },
            {
              href: "/briefs/build",
              label: "Decision brief builder",
              detail:
                "Export a paste-ready Markdown or JSON evidence pack.",
            },
            {
              href: "/sources",
              label: "Citation registry",
              detail:
                "Every primary-source URL the catalogue references, by provider.",
            },
            {
              href: "/reverification",
              label: "Reverification queue",
              detail:
                "Sources due for manual re-check, with last-verified dates.",
            },
            {
              href: "/coverage",
              label: "Coverage audit",
              detail:
                "Per-provider verified-field counts and source density.",
            },
          ].map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-lg border border-border bg-card p-3 transition hover:border-primary/30"
              >
                <p className="text-sm font-semibold text-foreground">
                  {item.label} →
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.detail}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <NoProgressPolicy />

      <aside
        id="advanced-reading"
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="Advanced reading"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Advanced reading
        </p>
        <p className="mt-1">
          When you want the long-form methodology behind the lessons,
          the research and docs hubs are where the catalogue keeps its
          schema definitions and verification methodology.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <Link
              href="/research/model-selection"
              className="text-primary hover:underline"
            >
              /research/model-selection
            </Link>{" "}
            — long-form selection methodology.
          </li>
          <li>
            <Link
              href="/research/source-verification-methodology"
              className="text-primary hover:underline"
            >
              /research/source-verification-methodology
            </Link>{" "}
            — how every field becomes verified.
          </li>
          <li>
            <Link
              href="/research/benchmark-limitations"
              className="text-primary hover:underline"
            >
              /research/benchmark-limitations
            </Link>{" "}
            — long-form on benchmark methodology.
          </li>
          <li>
            <Link href="/docs" className="text-primary hover:underline">
              /docs
            </Link>{" "}
            — schema reference for every verified field.
          </li>
          <li>
            <Link href="/intelligence" className="text-primary hover:underline">
              /intelligence
            </Link>{" "}
            — the operator workspace.
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
