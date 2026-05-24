import type { Metadata } from "next";
import Link from "next/link";
import { LessonLayout } from "@/components/learn/LessonLayout";
import { ConceptChecklist } from "@/components/learn/ConceptChecklist";
import { CommonMistakes } from "@/components/learn/CommonMistakes";
import { VerifiedExamplesTable } from "@/components/learn/VerifiedExamplesTable";
import { LessonApplyPanel } from "@/components/learn/LessonApplyPanel";
import { buildMetadata } from "@/lib/seo";
import { getLesson, getRelatedLessons } from "@/lib/lessons";

const lesson = getLesson("model-lifecycle")!;
const description =
  "What active, preview, deprecated, and retired mean for a model — and why lifecycle should gate integration decisions, not just inform them.";

export const metadata: Metadata = buildMetadata({
  title: lesson.title,
  description,
  path: "/learn/model-lifecycle",
  keywords: [
    "ai model lifecycle",
    "model deprecation",
    "model retirement",
    "ai model migration",
    "ai model active vs deprecated",
  ],
});

export default function ModelLifecycleLesson() {
  return (
    <LessonLayout
      lesson={lesson}
      description={description}
      notForBullets={[
        "Telling you when a provider will deprecate a model — that is the provider's announcement to make.",
        "Asserting a migration path from one snapshot to the next — providers publish their own migration notes.",
        "Recommending which active model to migrate to — that depends on your workload.",
      ]}
      relatedLessons={getRelatedLessons("model-lifecycle")}
    >
      <h2>The lifecycle states</h2>
      <p>
        The catalogue records every model with one of four lifecycle
        states, drawn from the provider's own published documentation:
      </p>
      <ul>
        <li>
          <strong>active</strong> — the model is generally available
          and the provider has not announced deprecation.
        </li>
        <li>
          <strong>preview</strong> — the model is publicly available
          but the provider explicitly labels it as preview, beta, or
          pre-release. Terms may change without notice.
        </li>
        <li>
          <strong>deprecated</strong> — the provider has announced
          that the model will be retired. Typically a retirement date
          is published.
        </li>
        <li>
          <strong>retired</strong> — the provider no longer serves
          this model. Retired models stay in the catalogue for
          historical reference but should not be integrated.
        </li>
      </ul>
      <p>
        Each state is a verified field with a citation pointing at the
        provider's documentation. When a state is unknown, the field
        renders the canonical unverified-data label rather than an
        assumption.
      </p>

      <h2>Why lifecycle matters before integration</h2>
      <p>
        Model lifecycle is one of the few fields that has a hard
        deadline attached. Integrating a deprecated snapshot weeks
        before its retirement date locks the team into a migration
        the moment the new system ships. Integrating a preview model
        means accepting that the API surface, pricing, and capability
        envelope can change. Integrating an active model with no
        announced successor is the lowest-friction path, but does not
        guarantee that state will hold.
      </p>

      <ConceptChecklist
        title="What to verify on every lifecycle field"
        items={[
          "The current lifecycle state — active, preview, deprecated, retired.",
          "The retirement date if any — deprecated models usually have one; retired models have one in the past.",
          "Whether the provider has announced a successor snapshot you should target instead.",
          "The retrieval date on the lifecycle citation — providers update lifecycle pages without notice.",
          "Whether your integration timeline fits comfortably before the retirement date, including the time needed to migrate after rollout.",
        ]}
      />

      <h2>Verified examples from the catalogue</h2>
      <p>
        The table below shows the lifecycle field for a slice of the
        catalogue. The point is not to recommend an active model — it
        is to show how the field renders and how deprecation appears.
      </p>
      <VerifiedExamplesTable
        field="lifecycle"
        modelSlugs={[
          "claude-opus-4",
          "claude-opus-4-7",
          "claude-sonnet-4-6",
          "gemini-2-5-pro",
          "deepseek-v4-pro",
          "mistral-large-3",
        ]}
        caption="Verified lifecycle states. Note that the catalogue keeps deprecated and retired models for historical reference — they are not removed when a successor ships."
      />

      <h2>Retirement and migration references</h2>
      <p>
        When the provider publishes a deprecation notice with a
        retirement date, the lifecycle field carries that date.
        Migration references — the provider's recommended successor —
        are surfaced through the model's record when the catalogue
        has retrieved them from a primary source. The catalogue does
        not assert a migration path on its own.
      </p>

      <CommonMistakes
        items={[
          {
            mistake: "Treating a preview model as a stable foundation.",
            why: "Preview models can have their API, pricing, or behaviour change without a migration window. Plan for that or pick an active model.",
          },
          {
            mistake: "Integrating a deprecated snapshot without checking the retirement date.",
            why: "Deprecation announcements typically run months ahead, but not always long enough to absorb integration + migration time.",
          },
          {
            mistake: "Assuming a retired model has a 1:1 successor.",
            why: "Providers often replace snapshots with a new generation that has different context, output, and pricing semantics. Treat migration as a fresh selection workflow.",
          },
          {
            mistake: "Skipping lifecycle on hosted models.",
            why: "Hosting platforms inherit the creator's lifecycle. A model deprecated by its creator stops being safe to host even if the platform still serves it.",
          },
        ]}
      />

      <h2>Apply this workflow</h2>
      <LessonApplyPanel routes={lesson.applyRoutes} />

      <h2>Data gaps to watch</h2>
      <p>
        Some providers publish lifecycle on a separate page from
        their main model docs, and some publish only when a model
        nears retirement. When the lifecycle field is unverified for
        a model you care about, open the model record and check
        whether the provider has a separate lifecycle / deprecation
        page worth requesting via the{" "}
        <Link href="/reverification">reverification queue</Link>.
      </p>

      <h2>Related pages</h2>
      <ul>
        <li>
          <Link href="/coverage">/coverage</Link> — per-provider
          verified-field counts including lifecycle.
        </li>
        <li>
          <Link href="/use-cases/governance-review">
            /use-cases/governance-review
          </Link>{" "}
          — the use case that explicitly weights lifecycle state.
        </li>
        <li>
          <Link href="/docs/model-page-schema">
            /docs/model-page-schema
          </Link>{" "}
          — the data-model definition for the lifecycle field.
        </li>
      </ul>

      <h2>Sources and freshness</h2>
      <p>
        Lifecycle states carry their own citations and retrieval
        dates. The{" "}
        <Link href="/reverification">reverification queue</Link>{" "}
        prioritises lifecycle fields when they are near or past
        published retirement dates.
      </p>
    </LessonLayout>
  );
}
