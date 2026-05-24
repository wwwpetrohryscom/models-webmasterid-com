import type { Metadata } from "next";
import Link from "next/link";
import { ContentPageShell } from "@/components/ContentPageShell";
import { DecisionWorkflow } from "@/components/DecisionWorkflow";
import { buildMetadata } from "@/lib/seo";
import { getContentPage } from "@/lib/content";

const SLUG = "/docs/decision-workflow";

export const metadata: Metadata = (() => {
  const page = getContentPage(SLUG)!;
  return buildMetadata({
    title: page.title,
    description: page.description,
    path: page.slug,
    keywords: page.keywords,
  });
})();

export default function DecisionWorkflowDocsPage() {
  const page = getContentPage(SLUG)!;
  return (
    <ContentPageShell
      page={page}
      breadcrumbParent={{ name: "Docs", href: "/docs" }}
      toc={[
        { id: "workflow", label: "The six steps" },
        { id: "why-no-ranking", label: "Why no ranking" },
        { id: "use-cases-first", label: "Why use cases come first" },
        { id: "shortlist-order", label: "How shortlist order works" },
        { id: "comparison-builder", label: "How the comparison builder works" },
        { id: "data-gaps", label: "How data gaps affect decisions" },
        { id: "sources-freshness", label: "How to use sources and freshness" },
        { id: "what-we-do-not-decide", label: "What the platform does not decide" },
      ]}
      relatedLinks={[
        {
          href: "/select",
          label: "Selection workspace",
          description: "Source-backed shortlist with documented order.",
        },
        {
          href: "/use-cases",
          label: "Use cases",
          description: "Selection workflows that name the verified fields.",
        },
        {
          href: "/compare/build",
          label: "Comparison builder",
          description: "2–4 models side by side from verified fields.",
        },
        {
          href: "/docs/comparison-methodology",
          label: "Comparison methodology",
          description: "How curated comparison pages render verified fields.",
        },
        {
          href: "/research/model-selection",
          label: "Model selection methodology",
          description: "What to weigh when picking a model.",
        },
      ]}
    >
      <section id="workflow">
        <h2>The six steps</h2>
        <DecisionWorkflow variant="card" />
        <p>
          The strip above lives on every selection surface
          (
          <Link href="/select" className="text-primary hover:underline">
            /select
          </Link>
          ,{" "}
          <Link
            href="/compare/build"
            className="text-primary hover:underline"
          >
            /compare/build
          </Link>
          , every use-case detail page) so the workflow is consistent
          wherever a reader lands.
        </p>
      </section>

      <section id="why-no-ranking">
        <h2>Why no ranking</h2>
        <p>
          Rankings invite bad decisions. Different workloads weight
          context window, output limits, modality, pricing, hosted
          availability, and freshness completely differently. A score
          that mixes these into one number imports an opinion the
          catalogue does not have — and could not justify with
          primary sources.
        </p>
        <p>
          WebmasterID Models therefore exposes verified fields per
          model and lets the reader weight them. The shortlist order
          on{" "}
          <Link href="/select" className="text-primary hover:underline">
            /select
          </Link>{" "}
          is deterministic and documented (verified field count →
          active lifecycle → source count → name) — it is
          intentionally not described as a ranking.
        </p>
      </section>

      <section id="use-cases-first">
        <h2>Why use cases come first</h2>
        <p>
          Filters only mean something inside a use case. A 1M-token
          context window does not matter if the workload is a chat
          assistant. A hosted-pricing reference does not matter if
          the buyer needs a first-party support contract.{" "}
          <Link href="/use-cases" className="text-primary hover:underline">
            /use-cases
          </Link>{" "}
          names the verified fields that matter per workflow and links
          straight into the selection workspace.
        </p>
      </section>

      <section id="shortlist-order">
        <h2>How shortlist order works</h2>
        <ol>
          <li>Verified field count desc — well-sourced records first.</li>
          <li>Active lifecycle first — deprecated/retired records last.</li>
          <li>Source count desc — more citations beats fewer.</li>
          <li>Model name asc — stable tiebreak.</li>
        </ol>
        <p>
          The ordering is deterministic at build time. There is no
          score, no rank function, and no weight on opinion. A reader
          who wants a different ordering should apply use-case
          filters; the ordering does not change in response to
          unrelated signals.
        </p>
      </section>

      <section id="comparison-builder">
        <h2>How the comparison builder works</h2>
        <p>
          The builder at{" "}
          <Link
            href="/compare/build"
            className="text-primary hover:underline"
          >
            /compare/build
          </Link>{" "}
          renders 2–4 selected models side by side using verified
          fields straight from the typed local data layer. It is a
          workspace, not a separate indexable page — generated query
          URLs carry{" "}
          <code className="rounded bg-muted px-1">noindex, follow</code>{" "}
          so each comparison is reproducible by URL without spamming
          the index. Static, curated comparison pages still live
          under{" "}
          <Link href="/compare" className="text-primary hover:underline">
            /compare
          </Link>{" "}
          and follow a higher editorial bar (two-sided verified
          before indexing).
        </p>
        <p>
          Selected models render in the order provided by the query
          string. Unknown values render the canonical unverified-data
          label; nothing is inferred or derived. The data-gaps matrix
          makes missing fields explicit per model.
        </p>
      </section>

      <section id="data-gaps">
        <h2>How data gaps affect decisions</h2>
        <p>
          A data gap is a field the catalogue records as unverified —
          either the vendor does not publish it, or automated
          retrieval is blocked (the OpenAI 403 case). Gaps are not
          guesses; the catalogue refuses to invent them.
        </p>
        <p>
          A reader should treat gaps as part of the decision. If a
          model is otherwise attractive but has an unverified output
          limit, the safe move is to open the vendor docs and confirm
          the limit before running a workload that depends on it.
          The{" "}
          <Link
            href="/reverification"
            className="text-primary hover:underline"
          >
            reverification queue
          </Link>{" "}
          surfaces every record currently due for manual re-check.
        </p>
      </section>

      <section id="sources-freshness">
        <h2>How to use sources and freshness</h2>
        <p>
          Every verified field is paired with a primary-source URL
          and a retrievedAt date. Freshness states (fresh / review
          due / stale / blocked / unknown) are computed
          deterministically against{" "}
          <code className="rounded bg-muted px-1">
            siteConfig.buildDate
          </code>
          . A row marked stale is a row whose source has not been
          confirmed for longer than the policy window — not a claim
          the value is wrong.
        </p>
        <p>
          The conservative read: re-open the source URL before any
          decision that depends on the value. Pricing references in
          particular are intentionally not framed as live quotes;
          re-verify against the vendor pricing page before
          procurement. Cost projections need workload-specific
          arithmetic that the catalogue does not perform.
        </p>
      </section>

      <section id="what-we-do-not-decide">
        <h2>What the platform does not decide for you</h2>
        <ul>
          <li>Which model is &quot;best&quot; for your workload.</li>
          <li>
            Which provider is &quot;cheapest&quot; — pricing is a
            reference, not a ranking.
          </li>
          <li>
            Which model is &quot;fastest&quot; — latency / throughput
            claims are not asserted.
          </li>
          <li>
            Which comparison declares a winner — comparisons render
            verified fields, never deltas or rank.
          </li>
          <li>
            Whether a model meets a specific compliance regime —
            verification status describes citations, not regulatory
            posture.
          </li>
        </ul>
        <p>
          The reader runs the workload, weighs the data gaps, opens
          the vendor pages, and decides what to test externally. The
          catalogue is the evidence base, not the verdict.
        </p>
      </section>
    </ContentPageShell>
  );
}
