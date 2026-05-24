import type { Metadata } from "next";
import Link from "next/link";
import { LessonLayout } from "@/components/learn/LessonLayout";
import { ConceptChecklist } from "@/components/learn/ConceptChecklist";
import { CommonMistakes } from "@/components/learn/CommonMistakes";
import { LessonApplyPanel } from "@/components/learn/LessonApplyPanel";
import { LessonExercisesPanel } from "@/components/learn/LessonExercisesPanel";
import { buildMetadata } from "@/lib/seo";
import { getLesson, getRelatedLessons } from "@/lib/lessons";

const lesson = getLesson("multimodal-input")!;
const description =
  "How the catalogue records which models accept image, audio, video, or PDF input — and why marketing copy is not enough to assume support.";

export const metadata: Metadata = buildMetadata({
  title: lesson.title,
  description,
  path: "/learn/multimodal-input",
  keywords: [
    "multimodal ai model",
    "ai image input",
    "ai audio input",
    "ai video input",
    "pdf input ai model",
  ],
});

export default function MultimodalInputLesson() {
  return (
    <LessonLayout
      lesson={lesson}
      description={description}
      notForBullets={[
        "Asserting which model is best for multimodal workloads — the catalogue records modality channels, not quality rankings.",
        "Claiming a model supports a modality the catalogue has not verified — unverified channels render the unverified-data label.",
        "Replacing your own workload-specific testing of multimodal inputs.",
      ]}
      relatedLessons={getRelatedLessons("multimodal-input")}
    >
      <h2>What counts as a modality channel</h2>
      <p>
        Modality is the kind of content a model can accept as input or
        produce as output. The catalogue records modality as a
        verified field on each model, enumerating channels such as{" "}
        <code>text-in</code>, <code>image-in</code>,{" "}
        <code>audio-in</code>, <code>video-in</code>, and{" "}
        <code>text-out</code>. A channel only appears when the
        provider's documentation explicitly names it as supported.
      </p>

      <h2>Why modality must be source-backed</h2>
      <p>
        Provider marketing copy often describes models as "multimodal"
        without enumerating the channels. A reader who treats that
        claim as verified ends up shipping an integration that calls
        an image endpoint the model does not support, or a PDF parser
        that silently drops to text-only mode. The catalogue therefore
        records modality only when the provider's official docs name
        each channel — and renders the canonical unverified-data label
        for the rest.
      </p>

      <ConceptChecklist
        title="What to verify on modality"
        items={[
          "The model's modality field is verified, not just described as 'multimodal' in marketing.",
          "Each input channel you need (image, audio, video, PDF) is enumerated explicitly.",
          "Each output channel (text, structured output, function calls) is enumerated separately.",
          "The citation for the modality field points at official provider docs, not a blog post.",
          "Any unverified channel renders the unverified-data label — that is a question for your tests, not a missing feature.",
        ]}
      />

      <h2>How to inspect modality in the catalogue</h2>
      <p>
        The selection workspace can filter the shortlist by modality.
        Pass <code>?modality=image-in</code> in the URL to narrow to
        models with a verified image-input channel. The model record
        page renders the full channel list under the modality field,
        with the citation alongside.
      </p>

      <CommonMistakes
        items={[
          {
            mistake: "Assuming 'multimodal' means all modalities are supported.",
            why: "Different providers use the word for very different channel sets. Always read the enumerated list.",
          },
          {
            mistake: "Treating PDF support as the same as image support.",
            why: "Some models parse PDFs as text, some render pages as images, some support both. The channel name matters.",
          },
          {
            mistake: "Ignoring output channels.",
            why: "A model that accepts images may still only output text. Confirm both directions before integrating.",
          },
          {
            mistake: "Inferring modality from a single demo video.",
            why: "Demos use curated inputs. Real workloads expose channel limits the demo did not.",
          },
        ]}
      />

      <h2>Apply this workflow</h2>
      <LessonApplyPanel routes={lesson.applyRoutes} />

      <LessonExercisesPanel lessonSlug="multimodal-input" />

      <h2>Data gaps to watch</h2>
      <p>
        When a model's modality field renders the unverified-data
        label, the catalogue has not yet recorded a primary-source
        citation that enumerates the channels. Confirm externally
        before integrating, or queue the source via{" "}
        <Link href="/reverification">/reverification</Link>.
      </p>

      <h2>Related pages</h2>
      <ul>
        <li>
          <Link href="/select?modality=image-in" className="text-primary hover:underline">
            /select?modality=image-in
          </Link>{" "}
          — narrow the shortlist to models with verified image input.
        </li>
        <li>
          <Link href="/use-cases/multimodal-input">
            /use-cases/multimodal-input
          </Link>{" "}
          — the use case that weights modality channels.
        </li>
        <li>
          <Link href="/learn/structured-output">
            /learn/structured-output
          </Link>{" "}
          — the lesson on output channels.
        </li>
      </ul>

      <h2>Sources and freshness</h2>
      <p>
        Modality citations age slowly compared to pricing, but they do
        change when providers add new input channels. Check{" "}
        <Link href="/sources">/sources</Link> for the underlying URLs
        and{" "}
        <Link href="/reverification">/reverification</Link> for
        anything due for re-check.
      </p>
    </LessonLayout>
  );
}
