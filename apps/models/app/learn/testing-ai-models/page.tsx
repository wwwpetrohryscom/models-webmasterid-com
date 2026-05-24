import type { Metadata } from "next";
import Link from "next/link";
import { LessonLayout } from "@/components/learn/LessonLayout";
import { ConceptChecklist } from "@/components/learn/ConceptChecklist";
import { CommonMistakes } from "@/components/learn/CommonMistakes";
import { LessonApplyPanel } from "@/components/learn/LessonApplyPanel";
import { buildMetadata } from "@/lib/seo";
import { getLesson, getRelatedLessons } from "@/lib/lessons";

const lesson = getLesson("testing-ai-models")!;
const description =
  "After the shortlist: how to run your own prompt, latency, rate-limit, cost, and compliance tests — using the evidence brief as the pack you ship to reviewers.";

export const metadata: Metadata = buildMetadata({
  title: lesson.title,
  description,
  path: "/learn/testing-ai-models",
  keywords: [
    "how to test ai model",
    "ai model evaluation",
    "ai model latency testing",
    "ai model cost validation",
    "ai model compliance review",
  ],
});

export default function TestingAiModelsLesson() {
  return (
    <LessonLayout
      lesson={lesson}
      description={description}
      notForBullets={[
        "Doing the testing for you — the catalogue surfaces fields; your workload-specific tests are yours.",
        "Asserting which model wins your evaluation — that depends on your data, traffic, and constraints.",
        "Certifying the model for your compliance regime — verification ≠ certification.",
      ]}
      relatedLessons={getRelatedLessons("testing-ai-models")}
    >
      <h2>After the shortlist, you still need to test</h2>
      <p>
        The catalogue can take you from "I have a use case" to "I have
        a shortlist of three or four candidate models with verified
        fields and a paste-ready evidence brief". What it cannot do is
        run your workload against those models. Every selection
        workflow ends at a testing phase the team owns.
      </p>
      <p>
        The good news is that the evidence brief from{" "}
        <Link href="/briefs/build">/briefs/build</Link> is exactly the
        kind of artifact a reviewer wants to see alongside your test
        results: a clear record of which fields the catalogue knew,
        which it did not, and where every claim came from.
      </p>

      <h2>What to test, in order</h2>
      <ConceptChecklist
        title="Workload-specific tests the catalogue cannot run"
        items={[
          "Prompt tests — your real prompts (or representative ones), with your real retrieved context. Measure output quality against your own rubric.",
          "Output structure — does the model reliably produce the structured output (JSON, tool calls, structured fields) your application needs?",
          "Latency in your environment — measured from your region against the chosen endpoint, with realistic prompt sizes.",
          "Rate limits — does the provider's published rate limit cover your expected peak? Run a deliberate burst to confirm.",
          "Cost validation — multiply your real traffic pattern by the per-unit pricing reference. Watch for prompt-size tiers, cache write/read accounting, and output-token differences.",
          "Compliance + security review — what data leaves your environment, where is it processed, what is logged on the provider's side, what retention applies?",
          "Failure modes — what does the model do when the prompt is malformed, hostile, or far outside the training distribution?",
        ]}
      />

      <h2>Use the decision brief as your evidence pack</h2>
      <p>
        The decision brief is built to be a reviewer's reading pack:
        every field is captured with its citation, every data gap is
        listed explicitly, and the comparison column count is bounded.
        Attach the brief to whatever testing artifacts your team
        produces — a test plan, latency measurements, a cost
        projection — and ship them together. The brief gives the
        reviewer the catalogue's contribution; the tests give them
        the workload-specific contribution. Together they answer
        "why this model" with evidence rather than opinion.
      </p>

      <h2>Common testing failure modes</h2>
      <CommonMistakes
        items={[
          {
            mistake: "Testing one prompt and generalising.",
            why: "Model quality varies wildly across prompt shapes. A single example is anecdote, not evidence.",
          },
          {
            mistake: "Measuring latency from your laptop on a home network.",
            why: "Production latency is a function of your serving region, the model's serving region, and the network path. Test from where your app actually runs.",
          },
          {
            mistake: "Estimating cost from a single per-token rate.",
            why: "Real cost depends on input vs output ratio, cache hit rate, prompt-size tiers, and any retry overhead. Project from your actual traffic mix.",
          },
          {
            mistake: "Skipping compliance review because the catalogue 'said the model is verified'.",
            why: "Verification means the catalogue confirmed a value against a primary source. It does not assert that the model meets any specific regulatory regime — that review is yours.",
          },
          {
            mistake: "Not retesting after a snapshot rotation.",
            why: "Providers update their underlying weights even when the model name stays the same. A passing evaluation last quarter is not a passing evaluation today.",
          },
        ]}
      />

      <h2>Apply this workflow</h2>
      <LessonApplyPanel routes={lesson.applyRoutes} />

      <h2>Data gaps the catalogue intentionally does not fill</h2>
      <p>
        Latency, throughput, uptime, and workload-specific quality
        measurements are intentionally absent from the catalogue.
        These are environment-dependent and would mislead more often
        than help. Your own tests are the only honest source for
        them. The catalogue's job is to give you the verified
        catalogue fields and a paste-ready evidence brief — the
        testing is yours.
      </p>

      <h2>Related pages</h2>
      <ul>
        <li>
          <Link href="/briefs/build">/briefs/build</Link> — generate
          the evidence brief that pairs with your test results.
        </li>
        <li>
          <Link href="/demos">/demos</Link> — guided demos that walk
          the full pre-test workflow.
        </li>
        <li>
          <Link href="/docs/decision-briefs">
            /docs/decision-briefs
          </Link>{" "}
          — the data-model definition of the decision brief.
        </li>
        <li>
          <Link href="/docs/decision-workflow">
            /docs/decision-workflow
          </Link>{" "}
          — the no-ranking policy in long form.
        </li>
        <li>
          <Link href="/research/benchmark-limitations">
            /research/benchmark-limitations
          </Link>{" "}
          — why published benchmark scores are not a substitute for
          your own tests.
        </li>
      </ul>

      <h2>Sources and freshness</h2>
      <p>
        The values in the evidence brief carry their citations
        forward, so the reviewer reading your test results can trace
        every catalogue claim back to its source page. Re-export the
        brief before the review meeting if the catalogue has updated
        any of the underlying fields — the{" "}
        <Link href="/reverification">reverification queue</Link>{" "}
        shows what has moved recently.
      </p>
    </LessonLayout>
  );
}
