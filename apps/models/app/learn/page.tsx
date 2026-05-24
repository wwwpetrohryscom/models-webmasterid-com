import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { PageShell } from "@/components/PageShell";
import { SectionHeader } from "@/components/SectionHeader";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import {
  learningPaths,
  lessons,
  getLesson,
} from "@/lib/lessons";

export const metadata: Metadata = buildMetadata({
  title: "Learn AI model selection",
  description:
    "Understand how context windows, output limits, pricing references, hosted availability, lifecycle, sources, and data gaps affect real AI model decisions. Then apply the lesson in the verified-data workflows.",
  path: "/learn",
  keywords: [
    "learn ai model selection",
    "ai model fundamentals",
    "context window explained",
    "ai model pricing references",
    "hosted vs first-party ai models",
    "ai model lifecycle",
  ],
});

export default function LearnHubPage() {
  return (
    <PageShell
      eyebrow="Learn"
      title="Learn AI model selection"
      intro="Understand how context windows, output limits, pricing references, hosted availability, lifecycle, sources, and data gaps affect real AI model decisions. Then apply the lesson in the verified-data workflows."
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
              "Lessons on AI model selection, context windows, pricing references, hosted inference, lifecycle, and verification methodology — each linked to the catalogue workflows that apply the lesson.",
            dateModified: siteConfig.buildDate,
            isPartOf: { "@type": "WebSite", url: siteConfig.url },
            hasPart: lessons.map((l) => ({
              "@type": "TechArticle",
              name: l.title,
              url: `${siteConfig.url}/learn/${l.slug}`,
              description: l.oneLine,
            })),
          },
        ]}
      />

      <section
        aria-label="Hero call to action"
        className="card-surface space-y-4 p-5 sm:p-6"
      >
        <p className="text-sm text-muted-foreground">
          The catalogue is a verified-data backbone. The lessons here
          explain how to <em>read</em> that data and how to apply each
          lesson in the existing selection, comparison, and decision
          brief workflows. Lessons never tell you which AI model to
          pick.
        </p>
        <ul className="flex flex-wrap gap-2 text-sm">
          <li>
            <Link
              href="#lessons-grid"
              className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 font-medium text-primary hover:bg-primary/15"
            >
              Start learning
            </Link>
          </li>
          <li>
            <Link
              href="/select"
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-foreground hover:border-primary/30"
            >
              Build a shortlist
            </Link>
          </li>
          <li>
            <Link
              href="/compare/build"
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-foreground hover:border-primary/30"
            >
              Compare verified fields
            </Link>
          </li>
          <li>
            <Link
              href="/briefs/build"
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-foreground hover:border-primary/30"
            >
              Export decision evidence
            </Link>
          </li>
          <li>
            <Link
              href="/demos"
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-foreground hover:border-primary/30"
            >
              View guided demos
            </Link>
          </li>
        </ul>
      </section>

      <aside
        role="note"
        aria-label="Learning policy"
        className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          What these lessons are — and what they are not.
        </p>
        <p>
          Lessons explain how AI model fields behave (context, output,
          pricing references, hosted vs first-party, lifecycle) so the
          reader can inspect verified catalogue rows with the right
          questions in mind. Lessons do not declare a winner, rank
          models by price, assert latency / throughput / uptime,
          certify compliance, or recommend a specific model for any
          workload.
        </p>
      </aside>

      <section aria-label="Learning paths" className="space-y-3">
        <SectionHeader
          eyebrow="Learning paths"
          title="Five paths through the catalogue"
          description="Each path groups the lessons that fit one mental model — fundamentals, pricing, methodology, governance, testing."
          as="h2"
        />
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {learningPaths.map((path) => (
            <li
              key={path.slug}
              className="card-surface flex h-full flex-col p-4"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                {path.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {path.description}
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                {path.lessonSlugs.map((slug) => {
                  const lesson = getLesson(slug);
                  if (!lesson) return null;
                  return (
                    <li key={slug}>
                      <Link
                        href={`/learn/${lesson.slug}`}
                        className="text-primary hover:underline"
                      >
                        {lesson.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section
        id="lessons-grid"
        aria-label="All lessons"
        className="space-y-3"
      >
        <SectionHeader
          eyebrow="Lessons"
          title="All lessons"
          description="Each lesson is a short, plain-language read with a verified examples table and an apply-this-workflow panel."
          as="h2"
        />
        <ul className="grid gap-3 lg:grid-cols-2">
          {lessons.map((lesson) => (
            <li key={lesson.slug}>
              <Link
                href={`/learn/${lesson.slug}`}
                className="card-surface block h-full p-5 transition hover:border-primary/30 hover:shadow-elevated"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {lesson.path.replace(/-/g, " ")}
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
      </section>

      <section
        aria-label="Apply the lessons"
        className="card-surface space-y-3 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Learn → apply
        </p>
        <p className="text-muted-foreground">
          Every lesson page surfaces the catalogue workflows the lesson
          asks you to walk next:
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

      <aside
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="Related references"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Related references
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <Link href="/how-it-works" className="text-primary hover:underline">
              /how-it-works
            </Link>{" "}
            — the five-step decision workflow without the lesson framing.
          </li>
          <li>
            <Link
              href="/research/model-selection"
              className="text-primary hover:underline"
            >
              /research/model-selection
            </Link>{" "}
            — the long-form research piece on the selection methodology.
          </li>
          <li>
            <Link href="/docs" className="text-primary hover:underline">
              /docs
            </Link>{" "}
            — reference docs for field semantics, pricing, comparison
            methodology, decision workflow.
          </li>
          <li>
            <Link href="/intelligence" className="text-primary hover:underline">
              /intelligence
            </Link>{" "}
            — the operator workspace overview.
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
