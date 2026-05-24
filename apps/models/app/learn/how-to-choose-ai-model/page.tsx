import type { Metadata } from "next";
import Link from "next/link";
import { LessonLayout } from "@/components/learn/LessonLayout";
import { ConceptChecklist } from "@/components/learn/ConceptChecklist";
import { CommonMistakes } from "@/components/learn/CommonMistakes";
import { VerifiedExamplesTable } from "@/components/learn/VerifiedExamplesTable";
import { LessonApplyPanel } from "@/components/learn/LessonApplyPanel";
import { LessonExercisesPanel } from "@/components/learn/LessonExercisesPanel";
import { buildMetadata } from "@/lib/seo";
import { getLesson, getRelatedLessons } from "@/lib/lessons";

const lesson = getLesson("how-to-choose-ai-model")!;
const description =
  "A workflow for picking which AI model to test next — start from your use case, inspect verified fields, then export an evidence brief. Never start from a leaderboard.";

export const metadata: Metadata = buildMetadata({
  title: lesson.title,
  description,
  path: "/learn/how-to-choose-ai-model",
  keywords: [
    "how to choose ai model",
    "ai model selection workflow",
    "evaluate ai model",
    "ai model decision evidence",
  ],
});

export default function HowToChooseAiModelLesson() {
  return (
    <LessonLayout
      lesson={lesson}
      description={description}
      notForBullets={[
        "Picking which AI model is 'best' — that depends on your workload, not the catalogue.",
        "Ranking models by price, latency, throughput, or uptime — the catalogue records observations, not rankings.",
        "Certifying compliance — verification means a citation backed the value on the date recorded, not that the model meets any specific regulation.",
      ]}
      relatedLessons={getRelatedLessons("how-to-choose-ai-model")}
    >
      <h2>Start from the use case, not the leaderboard</h2>
      <p>
        Most AI model selection failures come from starting at a
        leaderboard and working backwards. A model that tops a generic
        benchmark may still fail your workload because of context
        window limits, modality gaps, lifecycle status, regional
        availability, or pricing semantics that look fine in marketing
        copy but matter in production.
      </p>
      <p>
        The catalogue is structured to support the inverse workflow:
        define the use case first, then narrow the shortlist to models
        with verified fields that match, then compare them side by
        side, then export the evidence so the rest of the team can
        review.
      </p>

      <h2>Why this matters</h2>
      <p>
        Model decisions are infrastructure decisions. They shape your
        cost structure, your latency budget, your data-handling story,
        and your compliance posture. Treating that decision as
        "whichever model the blog post said is best" gives you no
        audit trail when the team asks why you chose it.
      </p>

      <ConceptChecklist
        title="What to verify before integrating any model"
        items={[
          "The model's lifecycle status — is it active, preview, deprecated, or retired? Retirement dates often appear months before they bite.",
          "The model's context window — does it cover your full prompt plus retrieved context plus expected output?",
          "The model's max output tokens — separate from context window. A 1M-token context with 8k output limits some workloads.",
          "The model's input modalities — text only, or images, audio, video too?",
          "The pricing reference — is it first-party or hosted? Different sources, different freshness, different terms.",
          "The verification status of every field above — does the catalogue have a primary-source citation on record?",
          "The data gaps the catalogue marks with the unverified-data label — those are the questions you still need to answer externally.",
        ]}
      />

      <h2>Example: verified context windows in the catalogue</h2>
      <p>
        Below is a small slice of the catalogue showing how verified
        fields render. The table is for <em>inspection</em> — the
        catalogue does not assert that any of these models is better
        for your workload than the others.
      </p>
      <VerifiedExamplesTable
        field="contextWindow"
        modelSlugs={[
          "claude-opus-4-7",
          "claude-sonnet-4-6",
          "gemini-2-5-pro",
          "deepseek-v4-pro",
          "mistral-large-3",
        ]}
        caption="Verified context windows pulled directly from the typed data layer. Click a row to read the full record and its citations."
      />

      <CommonMistakes
        items={[
          {
            mistake: "Treating context window as a hard fit indicator alone.",
            why: "A model with a huge context window can still degrade on long inputs. Context size is a necessary condition, not a sufficient one.",
          },
          {
            mistake: "Reading hosted pricing as the model creator's pricing.",
            why: "Hosted pricing is set by the hosting platform. The same model can have very different pricing semantics across creators and hosts.",
          },
          {
            mistake: "Ignoring lifecycle status.",
            why: "Integrating a deprecated snapshot weeks before its retirement date locks the team into a migration immediately after launch.",
          },
          {
            mistake: "Treating a missing value as zero.",
            why: "An unverified field is not 'no support' — it's 'no primary-source citation on record yet'. Confirm externally before assuming either way.",
          },
        ]}
      />

      <h2>Apply this workflow</h2>
      <p>
        The catalogue exposes the steps as workspaces. Each link below
        carries the use case forward so you only fill the form once.
      </p>
      <LessonApplyPanel routes={lesson.applyRoutes} />

      <LessonExercisesPanel lessonSlug="how-to-choose-ai-model" />

      <h2>Data gaps to watch</h2>
      <p>
        Some catalogue values intentionally remain unverified — most
        commonly latency, throughput, uptime, and any provider that
        does not publish machine-readable docs. These gaps are
        surfaced through a single canonical unverified-data label
        rather than substituted with estimates. Treat that label as a
        prompt to verify externally, not as a signal that the model
        lacks the capability.
      </p>

      <h2>Related pages</h2>
      <ul>
        <li>
          <Link href="/use-cases">/use-cases</Link> — start here if you
          do not yet have a use case framed.
        </li>
        <li>
          <Link href="/select">/select</Link> — the selection
          workspace.
        </li>
        <li>
          <Link href="/compare/build">/compare/build</Link> — render
          your shortlist side by side.
        </li>
        <li>
          <Link href="/briefs/build">/briefs/build</Link> — generate
          an evidence brief.
        </li>
        <li>
          <Link href="/research/model-selection">
            /research/model-selection
          </Link>{" "}
          — long-form methodology piece.
        </li>
      </ul>

      <h2>Sources and freshness</h2>
      <p>
        Every value in the example table above is wrapped with a
        primary-source citation and a retrieval date. Open any model
        page to read the underlying URLs, or visit{" "}
        <Link href="/sources">/sources</Link> for the citation
        registry. Citations age; the{" "}
        <Link href="/reverification">reverification queue</Link> lists
        what is due for re-check.
      </p>
    </LessonLayout>
  );
}
