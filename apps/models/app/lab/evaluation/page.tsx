import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { LabPolicyNote } from "@/components/lab/LabPolicyNote";
import { PromptPolicyNote } from "@/components/lab/PromptPolicyNote";
import { buildMetadata, breadcrumbJsonLd, articleJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = buildMetadata({
  title: "Evaluation guide",
  description:
    "How playbooks, templates, and evaluation prompt sets fit together in the AI Usage Lab. The guide explains how to run candidate model trials, record observations honestly, avoid overclaiming, and feed results into a decision brief.",
  path: "/lab/evaluation",
  keywords: [
    "ai model evaluation guide",
    "how to evaluate ai models",
    "ai evaluation methodology",
    "ai evaluation observation discipline",
  ],
});

const PATH = "/lab/evaluation";

export default function LabEvaluationGuidePage() {
  return (
    <PageShell
      eyebrow="Lab · Evaluation guide"
      title="Evaluation guide"
      intro="How playbooks, templates, and evaluation prompt sets fit together. The guide walks you through what evaluation means here, why prompt sets are not benchmarks, how to run candidate trials, and how to keep observations honest."
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Lab", href: "/lab" },
          { name: "Evaluation guide", href: PATH },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Lab", href: "/lab" },
            { name: "Evaluation guide", href: PATH },
          ]),
          articleJsonLd({
            type: "TechArticle",
            headline: "AI Usage Lab — evaluation guide",
            description:
              "How playbooks, templates, and evaluation prompt sets fit together in the AI Usage Lab.",
            path: PATH,
            dateModified: siteConfig.buildDate,
          }),
        ]}
      />

      <aside
        role="note"
        aria-label="Guide policy"
        className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          A working guide, not a certification track.
        </p>
        <p>
          The guide explains how to run model trials carefully. It
          does not certify the model, replace benchmarks, or
          guarantee production readiness. Every output is an
          observation a reviewer can read — not a numeric score.
        </p>
      </aside>

      <article className="prose-content space-y-8 text-[15px] leading-relaxed text-muted-foreground">
        <section aria-label="What evaluation means here">
          <h2>What evaluation means here</h2>
          <p>
            Evaluation in this lab is a small, repeatable observation
            routine. You pick a behaviour you need to validate
            (faithful summarisation, schema-conformant extraction,
            long-context recall, instruction following, safe
            refusal, automation contract adherence). You run a fixed
            set of prompts across the candidate models. You record
            outputs and per-prompt acceptance against a rubric you
            decided in advance. You attach the record to a decision
            brief for the next reviewer.
          </p>
          <p>
            Evaluation is not a leaderboard, not a percentage score,
            and not a vendor pitch. It is the catalogue's
            contribution to a decision the reader's team owns.
          </p>
        </section>

        <section aria-label="Why prompt sets are not benchmarks">
          <h2>Why prompt sets are not benchmarks</h2>
          <p>
            Published benchmarks have specific methodologies,
            scoring rubrics, and reproducibility properties. The
            catalogue's evaluation prompt sets share none of those
            properties — they are small (5 prompts per set),
            workload-agnostic, and designed to surface a particular
            failure mode rather than to produce a comparable
            number.
          </p>
          <p>
            Treat a prompt set's pass count as evidence for one
            moment in time, with one set of sampling parameters,
            against one snapshot of one model. Do not extrapolate
            to "the candidate is X% better than the baseline."
          </p>
        </section>

        <section aria-label="How to run candidate model trials">
          <h2>How to run candidate model trials</h2>
          <ol>
            <li>
              Pick the candidates from a shortlist URL produced in{" "}
              <Link href="/select">/select</Link>.
            </li>
            <li>
              Pin sampling parameters (temperature, top_p, max
              tokens) and hold them constant across the suite.
            </li>
            <li>
              Pick one prompt set from{" "}
              <Link href="/lab/prompts">/lab/prompts</Link> and one
              playbook from <Link href="/lab">/lab</Link>.
            </li>
            <li>
              Run the prompts in your own model harness. The
              catalogue never calls a live model on your behalf.
            </li>
            <li>
              Record outputs verbatim. Capture raw responses before
              any validation step so failures can be replayed.
            </li>
            <li>
              Roll observations into the{" "}
              <Link href="/lab/templates/prompt-test-matrix">
                prompt-test matrix template
              </Link>
              .
            </li>
            <li>
              Attach the matrix + the brief to your reviewer pack.
            </li>
          </ol>
        </section>

        <section aria-label="How to record observations">
          <h2>How to record observations</h2>
          <p>
            Record what the model did, not what you think the model
            did. Each prompt has an{" "}
            <strong className="text-foreground">expected observation</strong>,
            a{" "}
            <strong className="text-foreground">failure-looks-like</strong>{" "}
            list, and a{" "}
            <strong className="text-foreground">what-to-record</strong>{" "}
            list. Stick to those fields. Avoid collapsing
            observations into "good" or "bad" — the reviewer needs
            the verbatim output, the acceptance flag, and a short
            rationale.
          </p>
          <p>
            If a candidate produces inconsistent answers across
            reruns, record the variance. Non-determinism is itself
            evidence.
          </p>
        </section>

        <section aria-label="How to avoid overclaiming">
          <h2>How to avoid overclaiming</h2>
          <ul>
            <li>
              Do not write "this model is better at structured
              output" from a 5-prompt run. Write "this model
              produced schema-valid JSON on 4 of 5 prompts at
              temperature 0.0 on snapshot X."
            </li>
            <li>
              Do not infer latency or cost from a handful of calls.
              Latency observations require a measurement plan; the
              catalogue does not publish either.
            </li>
            <li>
              Do not promote an evaluation prompt into a production
              prompt. Evaluation inputs and production inputs are
              shaped differently.
            </li>
            <li>
              Do not extend the suite mid-run. If you need a new
              prompt, add it to a new run and re-record everything.
            </li>
          </ul>
        </section>

        <section aria-label="How to feed results into a decision brief">
          <h2>How to feed results into a decision brief</h2>
          <p>
            Open{" "}
            <Link href="/briefs/build">/briefs/build</Link> and select
            the candidate models you ran the evaluation against. The
            brief renders verified catalogue fields side by side; you
            add the evaluation observations underneath. The brief is
            the artifact your reviewer reads — not the raw matrix.
          </p>
          <p>
            If the evaluation results contradict the catalogue's
            verified fields, do not silently reconcile. Record both,
            attach the source citation, and flag the contradiction
            in the brief so the reviewer can investigate.
          </p>
        </section>
      </article>

      <section
        aria-label="Suggested order through the lab"
        className="card-surface space-y-3 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Suggested order through the lab
        </p>
        <ol className="grid gap-3 text-sm md:grid-cols-2 lg:grid-cols-5">
          {[
            {
              label: "Read prompt testing basics",
              href: "/lab/prompt-testing-basics",
            },
            {
              label: "Pick a prompt set",
              href: "/lab/prompts",
            },
            {
              label: "Open the prompt test matrix",
              href: "/lab/templates/prompt-test-matrix",
            },
            {
              label: "Run trials in your harness",
              href: "/learn/testing-ai-models",
            },
            {
              label: "Generate a decision brief",
              href: "/briefs/build",
            },
          ].map((step, i) => (
            <li
              key={step.href}
              className="rounded-xl border border-border bg-card p-3"
            >
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Step {i + 1}
              </p>
              <Link
                href={step.href}
                className="mt-1 block text-sm font-semibold text-foreground hover:underline"
              >
                {step.label} →
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <PromptPolicyNote />
      <LabPolicyNote />

      <aside
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="Related routes"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Related routes
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <Link href="/lab" className="text-primary hover:underline">
              /lab
            </Link>{" "}
            — playbook hub.
          </li>
          <li>
            <Link
              href="/lab/prompts"
              className="text-primary hover:underline"
            >
              /lab/prompts
            </Link>{" "}
            — evaluation prompt library.
          </li>
          <li>
            <Link
              href="/lab/templates"
              className="text-primary hover:underline"
            >
              /lab/templates
            </Link>{" "}
            — paste-ready Markdown templates.
          </li>
          <li>
            <Link
              href="/briefs/build"
              className="text-primary hover:underline"
            >
              /briefs/build
            </Link>{" "}
            — decision brief builder.
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
