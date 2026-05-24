import type { Metadata } from "next";
import Link from "next/link";
import { LessonLayout } from "@/components/learn/LessonLayout";
import { ConceptChecklist } from "@/components/learn/ConceptChecklist";
import { CommonMistakes } from "@/components/learn/CommonMistakes";
import { LessonApplyPanel } from "@/components/learn/LessonApplyPanel";
import { buildMetadata } from "@/lib/seo";
import { getLesson, getRelatedLessons } from "@/lib/lessons";

const lesson = getLesson("pricing-references")!;
const description =
  "Why catalogue pricing rows are references, not live quotes — and how to read them without ranking models by price.";

export const metadata: Metadata = buildMetadata({
  title: lesson.title,
  description,
  path: "/learn/pricing-references",
  keywords: [
    "ai model pricing",
    "ai api pricing reference",
    "first-party vs hosted pricing",
    "pricing freshness",
    "pricing methodology",
  ],
});

export default function PricingReferencesLesson() {
  return (
    <LessonLayout
      lesson={lesson}
      description={description}
      notForBullets={[
        "Ranking models by price — the catalogue records pricing references, not a leaderboard.",
        "Ranking which model costs the least for any workload — unit semantics differ, total cost depends on your traffic pattern.",
        "Quoting current invoiceable prices — citations age; always re-verify before committing.",
      ]}
      relatedLessons={getRelatedLessons("pricing-references")}
    >
      <h2>Pricing references are not live quotes</h2>
      <p>
        Every pricing row in the catalogue is a <em>reference</em> — a
        verified field whose value comes from a primary source (the
        provider's published pricing page) and whose retrieval date is
        recorded. None of these values are live quotes against the
        provider's billing system, and none should be treated as a
        guarantee of what your invoice will say next month.
      </p>
      <p>
        This matters because AI model pricing changes more often than
        most infrastructure pricing — sometimes weekly. A pricing row
        that was correct on its retrieval date can be stale by the
        time you read it. The catalogue records the date so the reader
        can judge how confident to be.
      </p>

      <h2>First-party vs hosted pricing</h2>
      <p>
        The catalogue records two separate kinds of pricing rows:
      </p>
      <ul>
        <li>
          <strong>First-party pricing</strong> — set by the model
          creator and published on their official pricing page. This
          is what you pay when you call the creator's API directly.
        </li>
        <li>
          <strong>Hosted pricing</strong> — set by a hosting platform
          for the model it serves. Same model, different provider,
          different price, different terms. See the lesson on{" "}
          <Link href="/learn/hosted-vs-first-party">
            hosted vs first-party
          </Link>
          .
        </li>
      </ul>
      <p>
        These rows live in different parts of the data layer. Mixing
        them in a single ranking is a category error — they come from
        different invoices.
      </p>

      <ConceptChecklist
        title="What to inspect on every pricing row"
        items={[
          "The pricing unit — per million input tokens, per million output tokens, per cached read, per cache write, per second of compute? Units do not compare across providers without alignment.",
          "The currency — most rows are USD; some hosting platforms publish in other currencies. Always check.",
          "The retrieval date — the catalogue records when the source page was last read. Older retrievals are more likely to be stale.",
          "The freshness state — the reverification queue flags rows past the staleness threshold.",
          "Whether the row applies to your prompt size — some providers tier pricing on prompt length.",
          "Whether the row is first-party or hosted — the catalogue tags this explicitly.",
        ]}
      />

      <h2>Volatility and freshness</h2>
      <p>
        AI model pricing volatility comes from several sources: model
        launches, snapshot rotations, hosted platform promotions, and
        currency adjustments. The catalogue records every row with a
        retrieval date and flags rows that exceed a freshness window
        in the reverification queue. The queue is the single source
        of truth for "what needs to be re-read against the
        provider's page before I trust it."
      </p>

      <h2>Why no price ranking</h2>
      <p>
        The catalogue deliberately does not publish a least-cost
        model leaderboard. Pricing semantics differ enough across
        providers (input vs output tokens, cache reads vs cache
        writes, per-second compute vs per-request, prompt-size
        tiers) that a single numeric ranking would mislead more often
        than it would help. The reader's own traffic pattern decides
        the total cost — the catalogue gives the per-unit references
        to model that traffic against, not the ranking it would
        produce.
      </p>

      <CommonMistakes
        items={[
          {
            mistake: "Comparing per-token rates without checking units.",
            why: "Input vs output, cached vs uncached, and provider-specific accounting can make a numerically smaller rate the more expensive choice for your traffic.",
          },
          {
            mistake: "Mixing first-party and hosted pricing in one chart.",
            why: "They come from different sources and different invoices. Compare within a category, not across.",
          },
          {
            mistake: "Treating an old retrieval date as 'current'.",
            why: "Pricing pages change without notice. The retrievedAt field tells you how old the row is — use it.",
          },
          {
            mistake: "Reading the absence of a pricing row as 'free'.",
            why: "Absence usually means 'no primary-source citation on record' — not that the model is free to use.",
          },
        ]}
      />

      <h2>Apply this workflow</h2>
      <LessonApplyPanel routes={lesson.applyRoutes} />

      <h2>Data gaps to watch</h2>
      <p>
        When a model has known pricing but no row in the catalogue, it
        usually means the provider does not publish pricing in a
        primary-source page yet, or the catalogue has not retrieved
        it. Either case is a verification question, not a missing
        feature. Open <Link href="/coverage">/coverage</Link> to see
        which providers have the thinnest pricing coverage right now.
      </p>

      <h2>Related pages</h2>
      <ul>
        <li>
          <Link href="/pricing">/pricing</Link> — every verified
          pricing row in the catalogue.
        </li>
        <li>
          <Link href="/docs/pricing-fields">/docs/pricing-fields</Link>{" "}
          — the data-model definition of every pricing field.
        </li>
        <li>
          <Link href="/research/api-pricing-methodology">
            /research/api-pricing-methodology
          </Link>{" "}
          — the long-form research piece on pricing methodology.
        </li>
        <li>
          <Link href="/reverification">/reverification</Link> — pricing
          rows due for re-check.
        </li>
      </ul>

      <h2>Sources and freshness</h2>
      <p>
        Pricing rows carry their own primary-source citations and
        retrieval dates. Inspect them via the per-model record or via{" "}
        <Link href="/sources">/sources</Link>.
      </p>
    </LessonLayout>
  );
}
