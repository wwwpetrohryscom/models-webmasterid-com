import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { getLesson } from "@/lib/lessons";
import { getLearningExercise } from "@/lib/learning-exercises";

export const metadata: Metadata = buildMetadata({
  title: "Beginner learning path",
  description:
    "A curated beginner path that pairs the foundational lessons with the foundational exercises — read, practise, build evidence.",
  path: "/learn/path/beginner",
  keywords: [
    "learn ai model selection beginner",
    "ai model fundamentals path",
    "beginner ai catalogue tutorial",
  ],
});

interface Step {
  kind: "read" | "exercise" | "review";
  title: string;
  href: string;
  summary: string;
  meta?: string;
}

export default function BeginnerPathPage() {
  const howToChoose = getLesson("how-to-choose-ai-model")!;
  const contextWindow = getLesson("context-window")!;
  const buildShortlist = getLearningExercise("build-first-shortlist")!;
  const compareCtx = getLearningExercise("compare-context-windows")!;
  const createBrief = getLearningExercise("create-decision-brief")!;
  const checkFreshness = getLearningExercise("check-source-freshness")!;

  const steps: Step[] = [
    {
      kind: "read",
      title: `Read: ${howToChoose.title}`,
      href: `/learn/${howToChoose.slug}`,
      summary: howToChoose.oneLine,
    },
    {
      kind: "read",
      title: `Read: ${contextWindow.title}`,
      href: `/learn/${contextWindow.slug}`,
      summary: contextWindow.oneLine,
    },
    {
      kind: "exercise",
      title: `Exercise: ${buildShortlist.title}`,
      href: `/learn/exercises/${buildShortlist.slug}`,
      summary: buildShortlist.summary,
      meta: `${buildShortlist.estimatedMinutes} min · ${buildShortlist.difficulty}`,
    },
    {
      kind: "exercise",
      title: `Exercise: ${compareCtx.title}`,
      href: `/learn/exercises/${compareCtx.slug}`,
      summary: compareCtx.summary,
      meta: `${compareCtx.estimatedMinutes} min · ${compareCtx.difficulty}`,
    },
    {
      kind: "exercise",
      title: `Exercise: ${createBrief.title}`,
      href: `/learn/exercises/${createBrief.slug}`,
      summary: createBrief.summary,
      meta: `${createBrief.estimatedMinutes} min · ${createBrief.difficulty}`,
    },
    {
      kind: "review",
      title: `Review: ${checkFreshness.title}`,
      href: `/learn/exercises/${checkFreshness.slug}`,
      summary: checkFreshness.summary,
      meta: `${checkFreshness.estimatedMinutes} min · ${checkFreshness.difficulty}`,
    },
  ];

  return (
    <PageShell
      eyebrow="Learn · Path"
      title="Beginner learning path"
      intro="A curated path through the foundational concept lessons and the foundational exercises. Read the concept, do the exercise, and end with a paste-ready evidence brief and a freshness review."
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Learn", href: "/learn" },
          { name: "Beginner path", href: "/learn/path/beginner" },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Learn", href: "/learn" },
            { name: "Beginner path", href: "/learn/path/beginner" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Course",
            name: "Beginner AI model selection path",
            description:
              "A six-step curated path pairing the foundational lessons with the foundational exercises.",
            url: `${siteConfig.url}/learn/path/beginner`,
            provider: {
              "@type": "Organization",
              name: siteConfig.ecosystem,
              url: "https://webmasterid.com",
            },
            isAccessibleForFree: true,
            inLanguage: siteConfig.locale,
            dateModified: siteConfig.buildDate,
          },
        ]}
      />

      <aside
        role="note"
        aria-label="Beginner path policy"
        className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          A path, not a curriculum with grades.
        </p>
        <p>
          There are no quizzes, no scoring, no progress tracking, and
          no account. The path is a recommended order through pages
          that already exist on the site. You finish when you have
          the evidence artifacts in your hands — a shortlist URL, a
          comparison URL, a brief export, and a freshness checklist.
        </p>
      </aside>

      <section
        aria-label="Six-step beginner path"
        className="space-y-3"
      >
        <SectionHeader
          eyebrow="Path"
          title="Six steps to your first evidence pack"
          description="Two readings, three exercises, one freshness review. Roughly 35–40 minutes if you walk it straight through."
          as="h2"
        />
        <ol className="space-y-3">
          {steps.map((step, i) => (
            <li key={step.href} className="card-surface p-4">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                    step.kind === "exercise"
                      ? "border border-primary/30 bg-primary/10 text-primary"
                      : "border border-border bg-muted text-foreground"
                  }`}
                >
                  {step.kind}
                </span>
                {step.meta ? (
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {step.meta}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-base font-semibold text-foreground">
                <Link
                  href={step.href}
                  className="hover:underline"
                >
                  {step.title} →
                </Link>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {step.summary}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-label="What you should have when you finish"
        className="card-surface space-y-3 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          What you should have at the end
        </p>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          <li>A <code>/select</code> URL that opens your shortlist.</li>
          <li>
            A <code>/compare/build</code> URL that opens the comparison
            you built.
          </li>
          <li>
            A Markdown brief from{" "}
            <code>/api/briefs/decision</code> or{" "}
            <code>/briefs/build</code>.
          </li>
          <li>
            A checklist from{" "}
            <code>/api/reverification/checklist</code> for any source
            you flagged.
          </li>
          <li>
            Notes on at least one data gap you still need to confirm
            externally.
          </li>
        </ul>
      </section>

      <aside
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="Next steps"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Next
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <Link
              href="/learn"
              className="text-primary hover:underline"
            >
              /learn
            </Link>{" "}
            — the rest of the concept lessons.
          </li>
          <li>
            <Link
              href="/learn/exercises"
              className="text-primary hover:underline"
            >
              /learn/exercises
            </Link>{" "}
            — all eight exercises, including the intermediate ones
            (hosted-provider trace, decision brief, external test
            plan).
          </li>
          <li>
            <Link
              href="/how-it-works"
              className="text-primary hover:underline"
            >
              /how-it-works
            </Link>{" "}
            — the same workflow without the lesson framing.
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
