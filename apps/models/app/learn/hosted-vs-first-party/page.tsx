import type { Metadata } from "next";
import Link from "next/link";
import { LessonLayout } from "@/components/learn/LessonLayout";
import { ConceptChecklist } from "@/components/learn/ConceptChecklist";
import { CommonMistakes } from "@/components/learn/CommonMistakes";
import { LessonApplyPanel } from "@/components/learn/LessonApplyPanel";
import { buildMetadata } from "@/lib/seo";
import { getLesson, getRelatedLessons } from "@/lib/lessons";

const lesson = getLesson("hosted-vs-first-party")!;
const description =
  "Why the model creator and the billing provider are usually different, and how the catalogue keeps the two separate at every step of the workflow.";

export const metadata: Metadata = buildMetadata({
  title: lesson.title,
  description,
  path: "/learn/hosted-vs-first-party",
  keywords: [
    "hosted ai model",
    "first-party ai api",
    "hosted vs first-party",
    "model creator vs hosting platform",
    "hosted inference",
  ],
});

export default function HostedVsFirstPartyLesson() {
  return (
    <LessonLayout
      lesson={lesson}
      description={description}
      notForBullets={[
        "Ranking hosting platforms by price — the catalogue records pricing references, not rankings.",
        "Asserting which host is faster — the catalogue does not measure latency.",
        "Recommending a specific host for a specific workload.",
      ]}
      relatedLessons={getRelatedLessons("hosted-vs-first-party")}
    >
      <h2>Creator vs billing provider</h2>
      <p>
        For most AI models there are at least two parties involved:
      </p>
      <ul>
        <li>
          The <strong>model creator</strong> — the lab that trained
          the model and owns the model weights or the model identity
          (Anthropic, Google, DeepSeek, Mistral, Meta, and others).
        </li>
        <li>
          The <strong>billing provider</strong> — the platform that
          serves inference and sends you the invoice. This may be the
          creator's own first-party API, or a separate hosting
          platform such as a managed inference service or a cloud
          marketplace.
        </li>
      </ul>
      <p>
        These are different entities, with different docs, different
        rate limits, different pricing semantics, and different
        compliance postures. Conflating them is a recurring source of
        confusion when reading AI model pricing.
      </p>

      <h2>How the catalogue keeps them separate</h2>
      <p>
        Every model record in the catalogue has a single{" "}
        <code>providerSlug</code> for the creator. Hosted availability
        is recorded as a separate set of <em>hosted availability</em>{" "}
        records — one per host × model pair — so a single model can
        appear under multiple hosts without the creator changing. Each
        hosted record carries its own model identifier (the slug the
        hosting platform uses in API calls), its own pricing
        references, and its own freshness state.
      </p>

      <ConceptChecklist
        title="What to look at when a model is hosted"
        items={[
          "The model creator — listed on the model page as the provider.",
          "The hosted availability record — which platforms serve this model and which billing provider applies.",
          "The hosted model ID — the slug used in API calls on the host. This is rarely identical to the creator's canonical model ID.",
          "The hosted pricing references — set by the host, not the creator.",
          "The freshness state — hosted pricing tends to change more often than first-party pricing.",
        ]}
      />

      <h2>Why Groq and Together do not become model creators</h2>
      <p>
        Hosting platforms serve other people's models. They publish
        their own model IDs, their own pricing, their own SLAs, and
        their own region maps — but they did not train the models
        they serve. The catalogue treats them as hosting platforms
        with hosted availability rows, not as model creators with
        their own entity entries. This keeps the entity graph honest:
        when a hosting platform changes its hosted model lineup, the
        underlying model record (and its citations) is untouched.
      </p>

      <h2>Hosted availability vs pricing reference</h2>
      <p>
        Hosted availability is a yes/no signal: this host serves this
        model right now, with this hosted model ID. The pricing
        reference is a separate field — sourced from the host's own
        pricing page, with its own retrievedAt timestamp. Availability
        can be verified independently of pricing, which matters when a
        host adds a model before publishing pricing or when pricing
        changes mid-month.
      </p>

      <CommonMistakes
        items={[
          {
            mistake: "Reading hosted pricing as creator pricing.",
            why: "They come from different sources and have different terms. Always trace the citation back to the page it came from.",
          },
          {
            mistake: "Treating the hosted model ID as the creator's canonical ID.",
            why: "Hosts pick their own slugs. The same model can appear with different IDs across hosts, and the creator's ID may differ from all of them.",
          },
          {
            mistake: "Ranking hosts by price without checking unit semantics.",
            why: "Hosts publish pricing in different units (per request, per token, per second of compute). A direct numeric comparison without unit alignment is meaningless.",
          },
          {
            mistake: "Assuming the host inherits the creator's compliance posture.",
            why: "The hosting platform's data-handling, retention, and regional posture is its own. Verify against the host's terms, not the creator's.",
          },
        ]}
      />

      <h2>Apply this workflow</h2>
      <LessonApplyPanel routes={lesson.applyRoutes} />

      <h2>Data gaps to watch</h2>
      <p>
        When a model has hosted availability but no hosted pricing
        reference on file, the host has not published pricing in a
        machine-readable way yet — or the catalogue has not retrieved
        it. Either way, treat the absence as a question to confirm
        externally before integrating.
      </p>

      <h2>Related pages</h2>
      <ul>
        <li>
          <Link href="/use-cases/hosted-inference">
            /use-cases/hosted-inference
          </Link>{" "}
          — the use case that weights hosted availability and hosted
          pricing references.
        </li>
        <li>
          <Link href="/pricing">/pricing</Link> — verified pricing
          rows for both first-party and hosted.
        </li>
        <li>
          <Link href="/docs/pricing-fields">/docs/pricing-fields</Link>{" "}
          — the data-model definition for pricing fields.
        </li>
        <li>
          <Link href="/demos/hosted-inference">
            /demos/hosted-inference
          </Link>{" "}
          — the guided demo that walks this distinction end-to-end.
        </li>
      </ul>

      <h2>Sources and freshness</h2>
      <p>
        Hosted pricing tends to change more often than first-party
        pricing. The catalogue records a retrievedAt timestamp on
        every row and flags rows that exceed the freshness threshold
        via the{" "}
        <Link href="/reverification">reverification queue</Link>.
      </p>
    </LessonLayout>
  );
}
