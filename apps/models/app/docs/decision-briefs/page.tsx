import type { Metadata } from "next";
import Link from "next/link";
import { ContentPageShell } from "@/components/ContentPageShell";
import { DecisionWorkflow } from "@/components/DecisionWorkflow";
import { buildMetadata } from "@/lib/seo";
import { getContentPage } from "@/lib/content";

const SLUG = "/docs/decision-briefs";

export const metadata: Metadata = (() => {
  const page = getContentPage(SLUG)!;
  return buildMetadata({
    title: page.title,
    description: page.description,
    path: page.slug,
    keywords: page.keywords,
  });
})();

export default function DecisionBriefsDocsPage() {
  const page = getContentPage(SLUG)!;
  return (
    <ContentPageShell
      page={page}
      breadcrumbParent={{ name: "Docs", href: "/docs" }}
      toc={[
        { id: "what-it-is", label: "What a decision brief is" },
        { id: "evidence-vs-recommendation", label: "Evidence vs recommendation" },
        { id: "verified-fields", label: "Verified fields" },
        { id: "data-gaps", label: "Data gaps" },
        { id: "source-trail", label: "Source trail" },
        { id: "freshness-notes", label: "Freshness notes" },
        { id: "hosted-availability", label: "Hosted availability" },
        { id: "next-external-tests", label: "Next external tests" },
        { id: "export-formats", label: "Markdown / JSON export" },
        { id: "limitations", label: "Limitations" },
      ]}
      relatedLinks={[
        {
          href: "/briefs/build",
          label: "Decision Brief Builder",
          description: "Generate a brief from selected models.",
        },
        {
          href: "/select",
          label: "Selection workspace",
          description: "Source-backed shortlist with documented order.",
        },
        {
          href: "/compare/build",
          label: "Comparison builder",
          description: "2–4 models side by side from verified fields.",
        },
        {
          href: "/docs/decision-workflow",
          label: "Decision workflow",
          description: "How the catalogue supports decisions without ranking.",
        },
        {
          href: "/research/source-verification-methodology",
          label: "Source verification methodology",
          description: "Primary-source rules, freshness lifecycle.",
        },
      ]}
    >
      <section id="what-it-is">
        <h2>What a decision brief is</h2>
        <p>
          A decision brief is a structured export of verified
          evidence for 2–4 selected AI models. It collects the
          verified field values, the explicit data gaps, the source
          trail (every primary-source citation referenced), freshness
          notes, hosted availability, and a checklist of external
          tests the reader still needs to run before committing.
        </p>
        <p>
          Briefs are built at{" "}
          <Link href="/briefs/build" className="text-primary hover:underline">
            /briefs/build
          </Link>{" "}
          from the same typed local data layer that powers every
          other surface. The same payload is available as a
          machine-readable export at{" "}
          <code className="rounded bg-muted px-1">
            /api/briefs/decision
          </code>{" "}
          (Markdown by default; JSON via{" "}
          <code className="rounded bg-muted px-1">?format=json</code>).
        </p>
        <DecisionWorkflow variant="card" highlightStep={6} />
      </section>

      <section id="evidence-vs-recommendation">
        <h2>Evidence vs recommendation</h2>
        <p>
          A brief is evidence. It is not a recommendation, a winner
          declaration, a price ranking, or an endorsement. The brief
          lists what is verified, what is explicitly unverified, and
          which sources support each claim — the reader weighs those
          inputs against their own workload.
        </p>
        <p>
          WebmasterID Models does not generate conclusions of the
          form "use model X" or "model Y is best for this use case".
          The reader runs the workload, opens the vendor pages, and
          decides what to test externally. See{" "}
          <Link
            href="/docs/decision-workflow"
            className="text-primary hover:underline"
          >
            /docs/decision-workflow
          </Link>{" "}
          for the no-ranking policy in long form.
        </p>
      </section>

      <section id="verified-fields">
        <h2>Verified fields</h2>
        <p>
          Each brief includes a configurable set of per-model fields:
          identity (provider + canonical API ID), lifecycle, context
          window, max output, modality channels, first-party pricing
          references, hosted availability, source count, freshness
          state, and per-model coverage notes. The field set is
          driven by{" "}
          <code className="rounded bg-muted px-1">
            DECISION_BRIEF_DEFAULT_FIELDS
          </code>{" "}
          but can be overridden per request via the{" "}
          <code className="rounded bg-muted px-1">?fields=</code>{" "}
          query parameter.
        </p>
        <p>
          Every value is rendered straight from the data layer. The
          helper never derives a value the catalogue does not already
          carry; it never re-formats pricing into a synthetic
          "$/1M-equivalent" number; it never ranks.
        </p>
      </section>

      <section id="data-gaps">
        <h2>Data gaps</h2>
        <p>
          A data gap is a canonical field the catalogue records as
          unverified. Briefs surface every gap explicitly so the
          reader can see what is missing before they read past the
          evidence rows. Gaps are not invented; the catalogue refuses
          to guess.
        </p>
        <p>
          Common gaps include max-output limits (Meta Llama 4 cards),
          modality channel enumeration (Mistral spec cards that
          describe a model as "multimodal" without listing channels),
          and first-party pricing on open-weights models (Meta).
          Hosted pricing references may compensate where they exist;
          the brief surfaces both sides.
        </p>
      </section>

      <section id="source-trail">
        <h2>Source trail</h2>
        <p>
          Every brief lists the primary-source citations referenced
          by any verified field: the citation name, the source type
          (official vendor docs, official vendor pricing, etc.), the
          retrievedAt date, and the URL. Source IDs are stable
          opaque-ish slugs derived from the URL — they let evidence
          rows reference sources without repeating the URL in every
          row.
        </p>
      </section>

      <section id="freshness-notes">
        <h2>Freshness notes</h2>
        <p>
          Each model record carries a deterministic freshness state
          computed against{" "}
          <code className="rounded bg-muted px-1">
            siteConfig.buildDate
          </code>
          . Briefs flag any record or citation that has aged past the
          fresh window — with a short note explaining when it was
          last checked and why it should be re-verified before reuse.
        </p>
        <p>
          <strong>Stale ≠ false.</strong> A stale record is one whose
          source has not been confirmed for longer than the policy
          window; the value may still be correct. The note nudges
          the reader to re-open the source page before depending on
          the value for a decision.
        </p>
      </section>

      <section id="hosted-availability">
        <h2>Hosted availability</h2>
        <p>
          For models hosted on third-party platforms (Groq, Together
          AI), the brief includes the hosted model ID, the billing
          provider, whether a pricing reference has been verified,
          and the last-checked date. Hosted pricing is set by the
          hosting platform, not by the model creator — the brief
          preserves that separation and never collapses the two
          rates into a single "price" number.
        </p>
      </section>

      <section id="next-external-tests">
        <h2>Next external tests</h2>
        <p>
          The catalogue stops at verified fields. The brief includes a
          checklist of external checks a reader still needs to run
          before committing to a model — task-specific prompt tests,
          latency in the target deployment region, rate-limit
          confirmation against the provider account, cost validation
          against the current vendor pricing page, and internal
          compliance / security review. These are checkboxes, not
          claims.
        </p>
      </section>

      <section id="export-formats">
        <h2>Markdown / JSON export</h2>
        <p>
          Briefs export via{" "}
          <code className="rounded bg-muted px-1">
            /api/briefs/decision
          </code>{" "}
          with the same query parameters as the page. Default
          format is{" "}
          <code className="rounded bg-muted px-1">text/markdown</code>{" "}
          — paste it straight into a PR description, a notebook, or
          a procurement document. JSON mode (
          <code className="rounded bg-muted px-1">?format=json</code>)
          returns the same structured payload for partner dashboards
          and internal tooling.
        </p>
        <p>
          Both responses set{" "}
          <code className="rounded bg-muted px-1">
            X-Robots-Tag: noindex
          </code>
          . Generated briefs are personal/team artifacts, not
          indexable content — only the base{" "}
          <code className="rounded bg-muted px-1">/briefs/build</code>{" "}
          page is indexable.
        </p>
      </section>

      <section id="limitations">
        <h2>Limitations</h2>
        <ul>
          <li>Maximum 4 models per brief.</li>
          <li>
            <code className="rounded bg-muted px-1">generatedAt</code>{" "}
            uses the build date, not wall-clock now — the same build
            produces the same brief.
          </li>
          <li>
            The brief never asserts latency, throughput, or uptime.
            Status surface presence is recorded; values are not.
          </li>
          <li>
            Pricing references are not live quotes. Re-verify against
            the vendor pricing page before any procurement decision.
          </li>
          <li>
            The brief never declares a winner, never ranks by price,
            and never recommends a model.
          </li>
          <li>
            Verification status describes citations on a date; it
            does not assert regulatory compliance, certification, or
            fitness for purpose.
          </li>
        </ul>
      </section>
    </ContentPageShell>
  );
}
