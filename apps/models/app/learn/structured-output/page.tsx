import type { Metadata } from "next";
import Link from "next/link";
import { LessonLayout } from "@/components/learn/LessonLayout";
import { ConceptChecklist } from "@/components/learn/ConceptChecklist";
import { CommonMistakes } from "@/components/learn/CommonMistakes";
import { LessonApplyPanel } from "@/components/learn/LessonApplyPanel";
import { LessonExercisesPanel } from "@/components/learn/LessonExercisesPanel";
import { buildMetadata } from "@/lib/seo";
import { getLesson, getRelatedLessons } from "@/lib/lessons";

const lesson = getLesson("structured-output")!;
const description =
  "The difference between structured output, JSON mode, and tool/function calling — and what is currently verified in the catalogue.";

export const metadata: Metadata = buildMetadata({
  title: lesson.title,
  description,
  path: "/learn/structured-output",
  keywords: [
    "structured output ai",
    "ai json mode",
    "ai tool use",
    "ai function calling",
    "structured generation",
  ],
});

export default function StructuredOutputLesson() {
  return (
    <LessonLayout
      lesson={lesson}
      description={description}
      notForBullets={[
        "Asserting which model produces the most reliable structured output — that depends on schema, prompt, and workload.",
        "Asserting that JSON mode and structured output and tool use mean the same thing — they do not.",
        "Replacing your own schema-driven evaluation work.",
      ]}
      relatedLessons={getRelatedLessons("structured-output")}
    >
      <h2>Three different concepts often used interchangeably</h2>
      <p>
        Providers describe similar but distinct capabilities under
        overlapping names. Inspecting verified fields means knowing
        what each one actually does:
      </p>
      <ul>
        <li>
          <strong>JSON mode</strong> — the model is constrained to
          produce syntactically valid JSON. The shape is up to the
          prompt; the API only enforces "this is JSON".
        </li>
        <li>
          <strong>Structured output</strong> — the model is
          constrained to produce JSON that conforms to a schema you
          pass with the request. The provider enforces the schema, not
          just the syntax.
        </li>
        <li>
          <strong>Tool / function calling</strong> — the model can
          emit calls to predefined tools or functions with structured
          arguments, often used to delegate work back to your code.
        </li>
      </ul>
      <p>
        These three capabilities have different API surfaces,
        different latency profiles, and different failure modes.
        Treating them as one is a recurring source of integration
        bugs.
      </p>

      <h2>What is currently verified in the catalogue</h2>
      <p>
        The catalogue records the <code>features</code> field on each
        model as a verified set of capability tags. Capability
        verification is gated on the provider explicitly naming the
        feature in their documentation — not on third-party tutorials
        or blog posts. A model that supports a capability without it
        being verified renders the canonical unverified-data label.
      </p>

      <h2>Why not infer capability from marketing text</h2>
      <p>
        "Supports structured output" in a marketing blurb can mean any
        of the three things above. The catalogue therefore requires
        the provider's official docs to name the API surface (e.g.{" "}
        <code>response_format</code>, <code>tool_choice</code>) before
        the feature lands as a verified field. Until then, the gap is
        explicit.
      </p>

      <ConceptChecklist
        title="What to verify before integrating structured generation"
        items={[
          "The provider documents the API surface (response_format, tool_choice, JSON schema, function-call schema) explicitly.",
          "Your schema is supported (some providers restrict OpenAPI / JSON Schema features).",
          "Latency overhead of structured generation is acceptable in your environment.",
          "Failure modes are predictable — malformed schema, refusal, truncated output — and your code handles each one.",
          "If you use tool calling, the catalogue's features field names tool calling explicitly for the model.",
        ]}
      />

      <CommonMistakes
        items={[
          {
            mistake: "Treating JSON mode as structured output.",
            why: "JSON mode guarantees syntax, not shape. A model can return valid JSON that fails your schema validation.",
          },
          {
            mistake: "Building tool calls before confirming the model lists the feature.",
            why: "Tool calling is a separate API surface. A model with structured output may not support tool calling.",
          },
          {
            mistake: "Using one provider's schema vocabulary across providers.",
            why: "JSON Schema subsets and OpenAPI extensions vary. Always confirm against the target provider's docs.",
          },
        ]}
      />

      <h2>Apply this workflow</h2>
      <LessonApplyPanel routes={lesson.applyRoutes} />

      <LessonExercisesPanel lessonSlug="structured-output" />

      <h2>Data gaps to watch</h2>
      <p>
        Structured-generation capabilities are the most rapidly
        evolving fields in the catalogue. Treat the unverified-data
        label as "the catalogue has not yet retrieved a primary-source
        citation that names this capability for this model" rather
        than "this capability does not exist."
      </p>

      <h2>Related pages</h2>
      <ul>
        <li>
          <Link href="/compare/build">/compare/build</Link> — compare
          verified features across candidate models.
        </li>
        <li>
          <Link href="/coverage">/coverage</Link> — per-provider
          verified-field coverage including features.
        </li>
        <li>
          <Link href="/learn/multimodal-input">
            /learn/multimodal-input
          </Link>{" "}
          — the partner lesson on input channels.
        </li>
        <li>
          <Link href="/learn/testing-ai-models">
            /learn/testing-ai-models
          </Link>{" "}
          — how to validate structured generation against your own
          schemas.
        </li>
      </ul>

      <h2>Sources and freshness</h2>
      <p>
        Feature citations age the fastest of any field in the
        catalogue. The reverification queue prioritises capability
        fields for re-check whenever a provider publishes a new
        snapshot.
      </p>
    </LessonLayout>
  );
}
