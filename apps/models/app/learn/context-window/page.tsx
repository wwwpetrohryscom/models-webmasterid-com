import type { Metadata } from "next";
import Link from "next/link";
import { LessonLayout } from "@/components/learn/LessonLayout";
import { ConceptChecklist } from "@/components/learn/ConceptChecklist";
import { CommonMistakes } from "@/components/learn/CommonMistakes";
import { VerifiedExamplesTable } from "@/components/learn/VerifiedExamplesTable";
import { LessonApplyPanel } from "@/components/learn/LessonApplyPanel";
import { buildMetadata } from "@/lib/seo";
import { getLesson, getRelatedLessons } from "@/lib/lessons";

const lesson = getLesson("context-window")!;
const description =
  "What a context window means, what it does not guarantee, and which verified fields to inspect before assuming a model fits your prompt.";

export const metadata: Metadata = buildMetadata({
  title: lesson.title,
  description,
  path: "/learn/context-window",
  keywords: [
    "ai model context window",
    "context window explained",
    "long context ai",
    "max output tokens",
  ],
});

export default function ContextWindowLesson() {
  return (
    <LessonLayout
      lesson={lesson}
      description={description}
      notForBullets={[
        "Predicting how a specific model will behave on a specific prompt — context size is a necessary but not sufficient condition.",
        "Asserting cost or latency for a long-context prompt — the catalogue does not measure either.",
        "Picking the model with the largest context window — bigger context does not equal better fit.",
      ]}
      relatedLessons={getRelatedLessons("context-window")}
    >
      <h2>What a context window actually is</h2>
      <p>
        A context window is the maximum number of tokens the model can
        process in a single request — counting the system prompt, the
        user message, any retrieved context the application includes,
        and (depending on the provider's accounting) the generated
        output. Tokens are not characters and not words; they are
        sub-word units the model's tokenizer produces.
      </p>
      <p>
        The catalogue records context windows as verified fields where
        the value comes directly from the provider's primary
        documentation. Models with no primary-source citation render
        the canonical unverified-data label instead of an estimate.
      </p>

      <h2>What context window does not guarantee</h2>
      <p>
        Context capacity is not capability. A model that accepts a
        million tokens in a single prompt can still:
      </p>
      <ul>
        <li>Lose recall on facts buried deep in the input.</li>
        <li>
          Degrade in instruction-following when the prompt grows past
          the size used during training.
        </li>
        <li>
          Cost dramatically more per request at high context sizes,
          even when the per-token rate looks flat.
        </li>
        <li>
          Hit a separate <code>max output tokens</code> limit that is
          much smaller than the input limit.
        </li>
      </ul>
      <p>
        These behaviours show up only in workload-specific testing.
        The catalogue surfaces the verified context window and max
        output limits; the rest is your evaluation work.
      </p>

      <ConceptChecklist
        title="What to inspect before assuming a model fits"
        items={[
          "The verified context window — large enough for your prompt + retrieved context + expected output?",
          "The verified max output tokens — separate field. Always check both.",
          "Pricing references that specifically apply at large prompt sizes (some providers tier pricing on prompt length).",
          "The model's lifecycle status — context-window improvements often arrive in newer snapshots; older snapshots may be deprecated.",
          "Whether the model accepts your input modality (text, image, audio, video) — modality is its own verified field.",
        ]}
      />

      <h2>Verified examples from the catalogue</h2>
      <p>
        Context windows vary widely across the models in the
        catalogue. The table renders the verified field for several
        models — inspection only, no ranking.
      </p>
      <VerifiedExamplesTable
        field="contextWindow"
        modelSlugs={[
          "claude-opus-4-7",
          "claude-sonnet-4-6",
          "claude-haiku-4-5",
          "gemini-2-5-pro",
          "deepseek-v4-pro",
          "mistral-large-3",
        ]}
        caption="Each cell is a verified field with a primary-source citation. Click a model name to read the underlying URL."
      />

      <h2>Relation to cost and latency (without numeric claims)</h2>
      <p>
        Large prompts cost more — both in money and in wall-clock
        latency. Exactly how much more depends on the provider's
        accounting (input vs output tokens, cache writes vs reads,
        prompt-size tiers) and on the host (first-party APIs and
        hosted platforms charge differently). The catalogue does not
        assert either cost or latency. It surfaces the pricing rows
        with their citations so you can read the terms yourself, and
        leaves the latency observation to your own tests.
      </p>

      <CommonMistakes
        items={[
          {
            mistake: "Treating max output tokens as the same as context window.",
            why: "They are separate verified fields. A model can have a 1M-token context window and an 8k-token output cap simultaneously.",
          },
          {
            mistake: "Assuming context window growth is monotonic across snapshots.",
            why: "Newer snapshots usually expand context, but deprecated snapshots may keep older limits. Always check the lifecycle field too.",
          },
          {
            mistake: "Counting characters or words instead of tokens.",
            why: "A token is a sub-word unit. The token count for the same text varies between models because each provider's tokenizer is different.",
          },
        ]}
      />

      <h2>Apply this workflow</h2>
      <LessonApplyPanel routes={lesson.applyRoutes} />

      <h2>Data gaps to watch</h2>
      <p>
        When a model's context window renders as the unverified-data
        label, the catalogue has not yet recorded a primary-source
        citation for that value. Confirm externally against the
        provider's documentation — and consider opening a
        reverification request from{" "}
        <Link href="/reverification">/reverification</Link>.
      </p>

      <h2>Related pages</h2>
      <ul>
        <li>
          <Link href="/use-cases/long-context-analysis">
            /use-cases/long-context-analysis
          </Link>{" "}
          — the use case that explicitly weights context window.
        </li>
        <li>
          <Link href="/compare/build">/compare/build</Link> — render
          context window alongside max output, pricing, lifecycle.
        </li>
        <li>
          <Link href="/docs/model-page-schema">
            /docs/model-page-schema
          </Link>{" "}
          — the data-model definition for context fields.
        </li>
      </ul>

      <h2>Sources and freshness</h2>
      <p>
        Every context window in the table above is wrapped with a
        verified field that points at the provider's official model
        documentation. Citations age over time; the{" "}
        <Link href="/reverification">reverification queue</Link>{" "}
        shows what is due for re-check.
      </p>
    </LessonLayout>
  );
}
