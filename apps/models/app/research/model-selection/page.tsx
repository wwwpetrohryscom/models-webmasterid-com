import type { Metadata } from "next";
import Link from "next/link";
import { ContentPageShell } from "@/components/ContentPageShell";
import { MethodologyMatrix } from "@/components/content/MethodologyMatrix";
import { buildMetadata } from "@/lib/seo";
import { getContentPage } from "@/lib/content";

const SLUG = "/research/model-selection";

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
        { id: "beyond-benchmarks", label: "Selection is not only benchmark score" },
        { id: "criteria", label: "The verifiable criteria" },
        { id: "lifecycle", label: "Lifecycle and deprecation" },
        { id: "reliability", label: "Reliability signals" },
        { id: "unknown-data", label: "How unknown data is treated" },
        { id: "selection-checklist", label: "Selection checklist" },
        { id: "not-to-optimise", label: "What not to optimise for" },
        { id: "next-steps", label: "Next steps" },
      ]}
      verifiedToday={[
        {
          label: "Three providers have end-to-end model verification",
          detail:
            "Anthropic (Claude Opus 4.7, Sonnet 4.6, Haiku 4.5), Google (Gemini 2.5 Pro), and DeepSeek (V4 Pro). See /coverage for the per-provider matrix and /sources for the underlying citations.",
        },
        {
          label: "Mistral is partially verified",
          detail:
            "Mistral Large 3 has API string and lifecycle verified; per-model spec card pages 404 to automated retrieval, so context window / output limit / modality / pricing remain unverified.",
        },
        {
          label: "OpenAI is blocked on automated retrieval",
          detail:
            "platform.openai.com returns HTTP 403 to non-interactive clients. The GPT-5 catalogue row is a structural entry only; no metric has been published.",
        },
      ]}
      dataGaps={[
        {
          label: "No quality ranking",
          detail:
            "WebmasterID Models does not publish 'best model' claims or composite quality scores. Quality is task-dependent and not captured by any single number we are willing to source.",
        },
        {
          label: "No independent benchmark scores",
          detail:
            "Provider-reported scores live with the provider; independent leaderboard scores are not republished unless a primary source is recorded. See /research/benchmark-limitations.",
        },
        {
          label: "No latency or uptime ranking",
          detail:
            "Vendor-reported status is monitored for two providers (see /status) but no uptime percentage is published. Request-latency comparisons require a measurement harness we have not yet wired.",
        },
      ]}
      relatedLinks={[
        {
          href: "/research/api-pricing-methodology",
          label: "API pricing methodology",
          description:
            "How to read the rows on /pricing and why provider pricing cannot always be normalised.",
        },
        {
          href: "/research/model-context-windows",
          label: "Context windows in practice",
          description:
            "Why a million-token context window on one provider is not the same as a million on another.",
        },
        {
          href: "/docs/model-page-schema",
          label: "Model page schema",
          description: "Reference for every field on a ModelEntity record.",
        },
        {
          href: "/coverage",
          label: "Coverage",
          description: "Per-provider verification matrix and retrieval audit log.",
        },
      ]}
    >
      <section id="beyond-benchmarks">
        <h2>Selection is not only benchmark score</h2>
        <p>
          Choosing an AI model for a production workload is a decision
          across at least eight independent axes. A leaderboard score —
          even one with strong provenance — can capture only a slice of
          the surface a real system depends on. WebmasterID Models is
          deliberately structured around the verifiable axes a builder
          can actually act on: provider attribution, pricing, context
          window, output limit, modality, lifecycle status, API surface,
          and observable reliability signals.
        </p>
        <p>
          The page you are reading is not a buying recommendation. It is
          a checklist of the criteria that have stable, sourceable
          values across providers, together with pointers to the live
          data — so the same decision becomes auditable instead of
          opinion-driven.
        </p>
      </section>

      <section id="criteria">
        <h2>The verifiable criteria</h2>
        <p>
          The following dimensions are first-class fields in the model
          catalogue. Every value is either verified against a primary
          source (with the citation visible on the model page) or
          rendered as the canonical unverified-data label. Nothing is
          interpolated.
        </p>
        <ul>
          <li>
            <strong>Provider.</strong> Who trains and serves the model.
            See{" "}
            <Link href="/providers" className="text-primary hover:underline">
              /providers
            </Link>{" "}
            for the catalogue and{" "}
            <Link
              href="/docs/provider-coverage"
              className="text-primary hover:underline"
            >
              /docs/provider-coverage
            </Link>{" "}
            for the dimensions we track per provider.
          </li>
          <li>
            <strong>Canonical API identifier.</strong> The model string
            you pass on the wire, plus any aliases or platform-specific
            identifiers (e.g. Bedrock / Vertex). Pinned snapshot IDs are
            recorded separately from rolling aliases.
          </li>
          <li>
            <strong>Pricing.</strong> Per-token input, output, cache
            write, cache read, batch-tier rates as the vendor publishes
            them. Each row carries its own unit semantics — see{" "}
            <Link
              href="/research/api-pricing-methodology"
              className="text-primary hover:underline"
            >
              /research/api-pricing-methodology
            </Link>
            .
          </li>
          <li>
            <strong>Context window.</strong> Input token limit per
            request as published. Million-token claims warrant care —
            see{" "}
            <Link
              href="/research/model-context-windows"
              className="text-primary hover:underline"
            >
              /research/model-context-windows
            </Link>
            .
          </li>
          <li>
            <strong>Max output tokens.</strong> A separate dimension
            from context window; structured-output workloads and
            agentic loops are constrained here.
          </li>
          <li>
            <strong>Modality.</strong> Which input/output channels are
            documented (text, image, audio, video — separately for
            input and output).
          </li>
          <li>
            <strong>Lifecycle.</strong> Active, preview, deprecated, or
            retired. Deprecation announcements carry retirement dates
            and migration targets where the vendor publishes them.
          </li>
          <li>
            <strong>API surface.</strong> Endpoint shape, model
            parameter position, authentication conventions. Vendor docs
            change shape over time; WebmasterID Models records the
            snapshot used and links back to the source.
          </li>
        </ul>
      </section>

      <section id="lifecycle">
        <h2>Lifecycle and deprecation</h2>
        <p>
          A model with a strong leaderboard score that is scheduled for
          retirement next quarter is, for production purposes, a
          different decision than one with the same characteristics on
          an active lifecycle. The catalogue surfaces lifecycle status
          and retirement dates as verified fields directly on each
          model page. The Claude Opus 4 (2025-05-14) record is the
          gold-standard example: it carries an explicit
          <code className="rounded bg-muted px-1">deprecated</code>{" "}
          status, retirement date, and migration target sourced from
          Anthropic&apos;s own deprecation table.
        </p>
        <p>
          Historical entries (DeepSeek R1, Mistral Large 2) are kept as
          structural records with{" "}
          <code className="rounded bg-muted px-1">retired</code>{" "}
          lifecycle so search engines and AI crawlers cannot
          accidentally treat them as live recommendations.
        </p>
      </section>

      <section id="reliability">
        <h2>Reliability signals</h2>
        <p>
          The platform separates three kinds of reliability data:
        </p>
        <ul>
          <li>
            <strong>Vendor-reported status.</strong> The provider&apos;s
            own status feed, observed at a fixed cadence and clearly
            labelled as vendor-reported. See{" "}
            <Link href="/status" className="text-primary hover:underline">
              /status
            </Link>{" "}
            for the per-provider observer matrix and{" "}
            <Link
              href="/research/ai-provider-status-monitoring"
              className="text-primary hover:underline"
            >
              /research/ai-provider-status-monitoring
            </Link>{" "}
            for the policy.
          </li>
          <li>
            <strong>Independent HTTP probes.</strong> A request issued
            by WebmasterID against a public, non-inference endpoint
            (host root). A successful probe is a reachability signal,
            not an availability measurement.
          </li>
          <li>
            <strong>Computed uptime window.</strong> Not published yet.
            Requires durable observations over a meaningful window
            (currently a minimum of 24 stored samples). When it
            appears, it will be labelled precisely — &quot;vendor-reported
            operational-sample rate&quot; — never &quot;uptime&quot;
            without qualification.
          </li>
        </ul>
        <p>
          A model selection that depends on availability should weight
          a long-running observation history against a fresh leaderboard
          score, but neither signal is sufficient alone.
        </p>
      </section>

      <section id="unknown-data">
        <h2>How unknown data is treated</h2>
        <p>
          The platform never interpolates, estimates, or averages
          missing values. When a field is not yet verified against a
          primary source, it renders the canonical unverified-data
          label and the model row reports a partial verification status.
          This is deliberately conservative: a fabricated number is
          worse than a clearly missing one for selection workflows that
          want to be auditable.
        </p>
        <p>
          For example, Mistral Large 3 has a verified API string and
          lifecycle, but its per-model spec card returns 404 to
          automated retrieval, so its context window and pricing remain
          null. A reader considering Mistral can see exactly which
          fields are open and can either (a) confirm the missing values
          in a manual browser pass or (b) deprioritise the model until
          the gap closes.
        </p>
      </section>

      <section id="selection-checklist">
        <h2>Selection checklist</h2>
        <MethodologyMatrix
          caption="Selection-criteria checklist tied to verified fields"
          columns={[
            "Field on /models",
            "Where to confirm",
          ]}
          rows={[
            {
              label: "Provider attribution",
              cells: [
                "providerSlug",
                <Link
                  key="prov"
                  href="/providers"
                  className="text-primary hover:underline"
                >
                  /providers
                </Link>,
              ],
            },
            {
              label: "Canonical API ID + aliases",
              cells: [
                "apiIdentifiers.canonical / alias",
                "Model detail page → API identifiers section",
              ],
            },
            {
              label: "Lifecycle (active / deprecated / retired)",
              cells: [
                "lifecycle.status",
                <Link
                  key="lc"
                  href="/models?lifecycle=active"
                  className="text-primary hover:underline"
                >
                  /models?lifecycle=active
                </Link>,
              ],
            },
            {
              label: "Context window",
              cells: [
                "contextWindow",
                <Link
                  key="ctx"
                  href="/research/model-context-windows"
                  className="text-primary hover:underline"
                >
                  /research/model-context-windows
                </Link>,
              ],
            },
            {
              label: "Max output tokens",
              cells: [
                "maxOutputTokens",
                <Link
                  key="out"
                  href="/research/model-output-limits"
                  className="text-primary hover:underline"
                >
                  /research/model-output-limits
                </Link>,
              ],
            },
            {
              label: "Modality",
              cells: [
                "modality (text-in, image-in, audio-in, video-in, text-out, …)",
                "Model detail page → Modality field",
              ],
            },
            {
              label: "Pricing units (input/output/cache/batch)",
              cells: [
                "pricing tiers + units",
                <Link
                  key="pr"
                  href="/research/api-pricing-methodology"
                  className="text-primary hover:underline"
                >
                  /research/api-pricing-methodology
                </Link>,
              ],
            },
            {
              label: "Status observations",
              cells: [
                "Provider observers + sample threshold",
                <Link
                  key="st"
                  href="/research/ai-provider-status-monitoring"
                  className="text-primary hover:underline"
                >
                  /research/ai-provider-status-monitoring
                </Link>,
              ],
            },
            {
              label: "Source coverage",
              cells: [
                "Per-model citations + per-provider coverage",
                <Link
                  key="cv"
                  href="/coverage"
                  className="text-primary hover:underline"
                >
                  /coverage
                </Link>,
              ],
            },
          ]}
        />
      </section>

      <section id="not-to-optimise">
        <h2>What not to optimise for</h2>
        <ul>
          <li>
            <strong>Headline benchmark score on its own.</strong>{" "}
            Without protocol / dataset / snapshot date, a score does
            not predict your workload — see{" "}
            <Link
              href="/research/benchmark-limitations"
              className="text-primary hover:underline"
            >
              benchmark limitations
            </Link>
            .
          </li>
          <li>
            <strong>Unverified latency claims.</strong> The catalogue
            does not publish a request-latency number for any model;
            the only latency-shaped value recorded is the status
            probe&apos;s fetch wall-clock, which is{" "}
            <em>not</em> API latency.
          </li>
          <li>
            <strong>Unsourced cost estimates.</strong> Cost depends on
            tokenizer + cache-hit rate + workload mix; published
            per-token rates are inputs, not totals.
          </li>
        </ul>
      </section>

      <section id="next-steps">
        <h2>Next steps</h2>
        <p>
          A shortlist workflow that uses this catalogue typically
          starts at{" "}
          <Link href="/models" className="text-primary hover:underline">
            /models
          </Link>{" "}
          (use the provider and lifecycle filters), narrows by
          modality and context window, and confirms pricing on{" "}
          <Link href="/pricing" className="text-primary hover:underline">
            /pricing
          </Link>
          . Two-sided verified comparisons live under{" "}
          <Link href="/compare" className="text-primary hover:underline">
            /compare
          </Link>
          , each linked back to the source trail. Coverage state for
          every provider is on{" "}
          <Link href="/coverage" className="text-primary hover:underline">
            /coverage
          </Link>
          , and the underlying citations are indexed at{" "}
          <Link href="/sources" className="text-primary hover:underline">
            /sources
          </Link>
          .
        </p>
      </section>
    </ContentPageShell>
  );
}
