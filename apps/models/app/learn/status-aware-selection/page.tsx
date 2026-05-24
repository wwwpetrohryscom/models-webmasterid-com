import type { Metadata } from "next";
import Link from "next/link";
import { LessonLayout } from "@/components/learn/LessonLayout";
import { ConceptChecklist } from "@/components/learn/ConceptChecklist";
import { CommonMistakes } from "@/components/learn/CommonMistakes";
import { LessonApplyPanel } from "@/components/learn/LessonApplyPanel";
import { LessonExercisesPanel } from "@/components/learn/LessonExercisesPanel";
import { buildMetadata } from "@/lib/seo";
import { getLesson, getRelatedLessons } from "@/lib/lessons";

const lesson = getLesson("status-aware-selection")!;
const description =
  "Why vendor-reported status pages and independent probes are kept separate — and when status should gate a model decision.";

export const metadata: Metadata = buildMetadata({
  title: lesson.title,
  description,
  path: "/learn/status-aware-selection",
  keywords: [
    "ai provider status",
    "ai model uptime",
    "ai provider reliability",
    "ai status monitoring",
    "status aware model selection",
  ],
});

export default function StatusAwareSelectionLesson() {
  return (
    <LessonLayout
      lesson={lesson}
      description={description}
      notForBullets={[
        "Publishing uptime percentages — the catalogue records observations, not aggregate SLAs.",
        "Ranking providers by reliability — the catalogue does not.",
        "Replacing your own status monitoring or on-call alerting.",
      ]}
      relatedLessons={getRelatedLessons("status-aware-selection")}
    >
      <h2>Two kinds of status signal</h2>
      <p>
        The catalogue records two different status signals for each
        provider, and keeps them strictly separate:
      </p>
      <ul>
        <li>
          <strong>Vendor-reported status</strong> — what the
          provider's official status page says about its services
          right now. Sourced from the provider's published status
          surface.
        </li>
        <li>
          <strong>Independent probe</strong> — an HTTP probe the
          catalogue runs against the provider's documented endpoint.
          Records observation timestamps and response shapes.
        </li>
      </ul>
      <p>
        These two signals can disagree. The catalogue does not
        reconcile them — it shows both so the reader can decide which
        one is load-bearing for their workflow.
      </p>

      <h2>Status observations are not uptime percentages</h2>
      <p>
        Aggregate uptime metrics ("99.9%") require a measurement
        regime: sampling cadence, geographic coverage, success
        criteria, and a published methodology. The catalogue does not
        publish any of those, so it does not publish aggregate uptime.
        What it does publish is a stream of observations — what the
        probe saw, when, from where — and a link to the vendor's own
        status surface for context.
      </p>

      <ConceptChecklist
        title="When status should gate a model decision"
        items={[
          "If the workload is latency-sensitive or revenue-critical: status observations are part of the evidence pack, not a footnote.",
          "If the model is hosted on a third-party platform: read the host's status signal, not just the creator's.",
          "If the provider had a recent incident: open both the vendor's status page and the independent probe history.",
          "If status is observed but the vendor status page is silent: treat the discrepancy as a question, not a verdict.",
        ]}
      />

      <h2>Where to look in the catalogue</h2>
      <p>
        The <Link href="/status">/status</Link> page lists every
        observed provider with both signals side by side. The model
        record pages link to their provider's status surface. The
        machine-readable counterpart at{" "}
        <Link href="/api/status/anthropic">/api/status/anthropic</Link>{" "}
        (and the other provider slugs) returns the same observations
        as JSON.
      </p>

      <CommonMistakes
        items={[
          {
            mistake: "Treating the vendor status page as ground truth.",
            why: "Vendor status pages can lag actual incidents. The independent probe is the second opinion.",
          },
          {
            mistake: "Reading an observation as an uptime claim.",
            why: "Observations are timestamps + response shapes. They do not extrapolate to an SLA.",
          },
          {
            mistake: "Skipping status because 'the model is verified'.",
            why: "Verification is about field-level citations. It does not say the endpoint is currently serving traffic.",
          },
          {
            mistake: "Treating creator status as host status.",
            why: "For hosted models, the host's status surface is the load-bearing one — the creator's surface may be irrelevant.",
          },
        ]}
      />

      <h2>Apply this workflow</h2>
      <LessonApplyPanel routes={lesson.applyRoutes} />

      <LessonExercisesPanel lessonSlug="status-aware-selection" />

      <h2>Data gaps to watch</h2>
      <p>
        Some providers do not publish a machine-readable status
        surface, in which case the catalogue records only the
        independent probe. Treat that as a gap to monitor externally —
        not as a missing feature.
      </p>

      <h2>Related pages</h2>
      <ul>
        <li>
          <Link href="/status">/status</Link> — observed status across
          tracked providers.
        </li>
        <li>
          <Link href="/research/ai-provider-status-monitoring">
            /research/ai-provider-status-monitoring
          </Link>{" "}
          — the long-form research piece on monitoring methodology.
        </li>
        <li>
          <Link href="/docs/status-observations">
            /docs/status-observations
          </Link>{" "}
          — the data-model definition for status observations.
        </li>
        <li>
          <Link href="/learn/model-lifecycle">/learn/model-lifecycle</Link>{" "}
          — the partner lesson on lifecycle gating.
        </li>
      </ul>

      <h2>Sources and freshness</h2>
      <p>
        Status observations are the most volatile signal in the
        catalogue — they update on every probe run. The vendor status
        URLs carry their own citations and retrievedAt dates.
      </p>
    </LessonLayout>
  );
}
