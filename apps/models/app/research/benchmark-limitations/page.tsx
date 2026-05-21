import type { Metadata } from "next";
import Link from "next/link";
import { ContentPageShell } from "@/components/ContentPageShell";
import { buildMetadata } from "@/lib/seo";
import { getContentPage } from "@/lib/content";

const SLUG = "/research/benchmark-limitations";

export const metadata: Metadata = (() => {
  const page = getContentPage(SLUG)!;
  return buildMetadata({
    title: page.title,
    description: page.description,
    path: page.slug,
    keywords: page.keywords,
  });
})();

export default function Page() {
  const page = getContentPage(SLUG)!;
  return (
    <ContentPageShell
      page={page}
      breadcrumbParent={{ name: "Research", href: "/research" }}
      toc={[
        { id: "benchmark-vs-score", label: "Benchmark vs benchmark score" },
        { id: "provenance", label: "Provider-reported vs independent" },
        { id: "contamination", label: "Dataset contamination" },
        { id: "drift", label: "Prompt and version drift" },
        { id: "lifecycle", label: "Lifecycle changes between scores and publication" },
        { id: "what-we-publish", label: "What the catalogue publishes today" },
      ]}
      verifiedToday={[
        {
          label: "Benchmark categories tracked",
          detail:
            "Reasoning, coding, math, knowledge, multimodal, agentic — declared in the BenchmarkEntity schema with stable slugs. See /benchmarks for the live list.",
        },
        {
          label: "Zero model benchmark scores published",
          detail:
            "No ModelEntity in the catalogue carries a verified benchmark score field today. Provider-reported scores are not republished without independent verification; independent leaderboard scores require a primary-source citation that is not yet on record.",
        },
      ]}
      dataGaps={[
        {
          label: "Independent benchmark harness",
          detail:
            "The platform does not run its own benchmark suite. Scores would require either a verified independent leaderboard citation or a documented in-house evaluation protocol — neither is in scope today.",
        },
        {
          label: "Benchmark dataset metadata",
          detail:
            "When a score is eventually published, it will need to carry the dataset version, prompt protocol, and evaluation date alongside the number. None of these fields exist yet on the data layer.",
        },
      ]}
      relatedLinks={[
        {
          href: "/benchmarks",
          label: "Benchmarks",
          description: "The structural benchmark catalogue (categories only today).",
        },
        {
          href: "/research/source-verification-methodology",
          label: "Source verification methodology",
          description: "Why provider-reported numbers cannot be republished without a primary-source pass.",
        },
        {
          href: "/coverage",
          label: "Coverage",
          description: "What is verified versus what is pending across the entity graph.",
        },
      ]}
    >
      <section id="benchmark-vs-score">
        <h2>Benchmark vs benchmark score</h2>
        <p>
          A <em>benchmark</em> is an evaluation specification — a
          dataset, a prompt protocol, a scoring rule. A <em>benchmark
          score</em> is a single model&apos;s result against that
          specification. The two are different objects in the data
          model. The catalogue records the structural benchmark — its
          name, category, description, and stable slug — but does not
          republish per-model scores without source-level verification.
        </p>
        <p>
          The category enum is fixed:{" "}
          <code className="rounded bg-muted px-1">reasoning</code>,{" "}
          <code className="rounded bg-muted px-1">coding</code>,{" "}
          <code className="rounded bg-muted px-1">math</code>,{" "}
          <code className="rounded bg-muted px-1">knowledge</code>,{" "}
          <code className="rounded bg-muted px-1">multimodal</code>,{" "}
          <code className="rounded bg-muted px-1">agentic</code>. New
          benchmark types are added by extending the enum and the
          BenchmarkEntity record, not by stuffing data into a free-text
          notes field.
        </p>
      </section>

      <section id="provenance">
        <h2>Provider-reported vs independent</h2>
        <p>
          A provider quoting their own model&apos;s benchmark score is
          a vendor-reported claim, on the same epistemic footing as a
          vendor-reported status indicator. It can be useful as a
          colour signal but it is not an independent measurement. The
          catalogue treats provider-reported scores the same way it
          treats vendor-reported status: surface only with explicit
          attribution, never as a property of the model itself.
        </p>
        <p>
          Independent leaderboard scores (Chatbot Arena, MMLU-Pro,
          SWE-bench Verified runs hosted by third parties, etc.) are
          legitimate primary sources when they document the evaluation
          protocol, the model snapshot evaluated, and the date. Where
          such a citation exists, a score can be encoded on the
          ModelEntity as a verified field. Until it exists, no score
          appears.
        </p>
      </section>

      <section id="contamination">
        <h2>Dataset contamination</h2>
        <p>
          Public benchmark datasets are reachable from public training
          data. Once a model is trained on enough of the open web, its
          score on that benchmark is no longer a clean measurement of
          generalisation — it&apos;s a measurement of memorisation
          plus generalisation, in some unknown mix. Published numbers
          on widely-known benchmarks tend to drift upward over time
          across all vendors for this reason. Without an explicit
          decontamination protocol, a single high score is hard to
          interpret.
        </p>
        <p>
          We do not have a clean way to encode this as a per-score
          field today, which is one of the reasons the published-score
          surface stays narrow.
        </p>
      </section>

      <section id="drift">
        <h2>Prompt and version drift</h2>
        <p>
          A benchmark score depends on the prompt protocol used at
          evaluation time. Two runs of the same benchmark with
          different system prompts, different temperature settings, or
          different chain-of-thought conventions can produce
          materially different scores on the same model. Provider
          reports rarely document the exact protocol used; community
          leaderboards usually do. The catalogue treats both as
          sources but applies the same provenance rules.
        </p>
        <p>
          Model versions also drift. A rolling alias like{" "}
          <code className="rounded bg-muted px-1">claude-opus-4-7</code>{" "}
          can resolve to different snapshots over time; a benchmark
          score against a rolling alias is only meaningful when paired
          with the evaluation date. Pinned snapshot IDs (e.g.{" "}
          <code className="rounded bg-muted px-1">
            claude-opus-4-20250514
          </code>
          ) are stable; aliases are not.
        </p>
      </section>

      <section id="lifecycle">
        <h2>Lifecycle changes between scores and publication</h2>
        <p>
          A score published the week a model went GA can become stale
          quickly. Quantisation changes, runtime upgrades, and
          retirement announcements all shift what a leaderboard number
          means in production. The catalogue records lifecycle status
          and retirement dates as verified fields — see{" "}
          <Link
            href="/research/model-selection"
            className="text-primary hover:underline"
          >
            /research/model-selection
          </Link>{" "}
          — so a published score can be read against its model&apos;s
          current state instead of in isolation.
        </p>
      </section>

      <section id="what-we-publish">
        <h2>What the catalogue publishes today</h2>
        <p>
          The structural benchmark list at{" "}
          <Link href="/benchmarks" className="text-primary hover:underline">
            /benchmarks
          </Link>{" "}
          records benchmark names, categories, and descriptions. No
          per-model scores are published. When scores eventually
          appear, each will carry: a primary-source citation, the
          evaluation date, the model snapshot evaluated, the dataset
          version, and a free-text protocol note. The integrity guard
          suite already refuses to ship JSON-LD with unverified
          benchmark fields; that constraint extends to the page body
          when scores are added.
        </p>
      </section>
    </ContentPageShell>
  );
}
