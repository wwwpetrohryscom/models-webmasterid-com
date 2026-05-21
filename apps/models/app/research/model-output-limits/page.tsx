import type { Metadata } from "next";
import Link from "next/link";
import { ContentPageShell } from "@/components/ContentPageShell";
import { MethodologyMatrix } from "@/components/content/MethodologyMatrix";
import { buildMetadata } from "@/lib/seo";
import { getContentPage } from "@/lib/content";

const SLUG = "/research/model-output-limits";

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
        { id: "definition", label: "What max output tokens means" },
        { id: "long-form", label: "Long-form generation" },
        { id: "agentic", label: "Agentic loops" },
        { id: "structured", label: "Structured output" },
        { id: "cost", label: "Cost implications" },
        { id: "use-case-matrix", label: "Output-budget pressure by use case" },
        { id: "verified-examples", label: "Verified examples" },
      ]}
      verifiedToday={[
        {
          label: "Claude Opus 4.7: 128k tokens synchronous; 300k via batch beta",
          detail:
            "Verified from the Anthropic Models overview synchronous-Messages-API row, and the Message Batches beta header note.",
        },
        {
          label: "Claude Sonnet 4.6: 64k tokens",
          detail: "Verified from the Anthropic Models overview.",
        },
        {
          label: "Claude Haiku 4.5: 64k tokens",
          detail: "Verified from the Anthropic Models overview.",
        },
        {
          label: "Gemini 2.5 Pro: 65,536 tokens",
          detail:
            "Verified from ai.google.dev/gemini-api/docs/models/gemini-2.5-pro — listed precisely rather than rounded to 64k.",
        },
      ]}
      dataGaps={[
        {
          label: "DeepSeek V4 Pro max output",
          detail:
            "The DeepSeek Models & Pricing page documents context window but does not separately publish max output tokens. The field renders as the canonical unverified-data label on the model page.",
        },
        {
          label: "Mistral max output",
          detail:
            "Per-model spec card pages 404 to automated retrieval. Mistral Large 3 max output is unverified.",
        },
        {
          label: "Effective throughput at max output",
          detail:
            "Time-to-completion for a 128k-token generation depends on the provider's runtime and the prompt; the catalogue records the headline limit, not throughput.",
        },
      ]}
      relatedLinks={[
        {
          href: "/research/model-context-windows",
          label: "Context windows in practice",
          description: "The other end of the request budget.",
        },
        {
          href: "/models",
          label: "Models",
          description: "Filter by lifecycle / modality / provider.",
        },
        {
          href: "/docs/model-page-schema",
          label: "Model page schema",
          description: "Where maxOutputTokens lives in the data model.",
        },
      ]}
    >
      <section id="definition">
        <h2>What max output tokens means</h2>
        <p>
          Max output tokens is the maximum number of tokens a single
          model response can contain. It is independent of the input
          context window: a 1M-token context model with a 128k-token
          output limit can read a long document but cannot produce a
          longer one in a single shot.
        </p>
        <p>
          The field is recorded separately on each model record with
          its own verified citation. Where the vendor publishes a
          synchronous limit and a batch/streaming-beta limit, the
          catalogue records the synchronous number as the primary value
          and captures the batch/beta number in the row notes —
          following the same &quot;durable canonical value&quot;
          discipline as pricing rows.
        </p>
      </section>

      <section id="long-form">
        <h2>Long-form generation</h2>
        <p>
          Workloads that produce long documents — full reports, code
          repositories, structured datasets — are bounded by the output
          limit, not the context window. A 64k-token output budget is
          roughly 48,000 words; a 128k-token budget is roughly 96,000
          words; the exact text-to-token ratio depends on the
          tokenizer and the language being generated.
        </p>
        <p>
          For workloads that exceed the single-call output budget, the
          two structural options are (a) chunking the generation
          across multiple calls with a continuation prompt, or (b)
          switching to the provider&apos;s batch API for the higher
          beta limit. Both have implications for cost (see{" "}
          <Link
            href="/research/api-pricing-methodology"
            className="text-primary hover:underline"
          >
            pricing methodology
          </Link>
          ) and for downstream coherence; neither is captured in the
          headline number alone.
        </p>
      </section>

      <section id="agentic">
        <h2>Agentic loops</h2>
        <p>
          Agentic workloads spend the output budget across many tool
          calls and intermediate reasoning steps. Extended-thinking
          features available on some models (recorded as
          <code className="rounded bg-muted px-1">extendedThinking</code>{" "}
          /{" "}
          <code className="rounded bg-muted px-1">adaptiveThinking</code>{" "}
          on the model record) consume the same output budget as the
          final answer. A workflow that performs ten tool calls and a
          long reasoning trace can hit the limit even when the final
          user-visible response is short.
        </p>
      </section>

      <section id="structured">
        <h2>Structured output</h2>
        <p>
          When a model is producing structured output (JSON schema
          conformance, function-call payloads), token efficiency
          changes — JSON keys and brackets are individually tokenised
          and accrue against the output limit. A long array of objects
          can easily double the apparent length once each property
          name, string quote, and comma is counted as one or more
          tokens. The output limit is enforced before
          schema-conformance retries, so a long structured payload that
          fails validation can be terminated mid-output and leave the
          response in a partial-JSON state.
        </p>
      </section>

      <section id="cost">
        <h2>Cost implications</h2>
        <p>
          Output tokens are uniformly more expensive than input tokens
          across the providers in the catalogue. Anthropic Opus 4.7
          charges $5 / 1M input vs $25 / 1M output. Gemini 2.5 Pro
          charges $1.25 / 1M input vs $10 / 1M output (standard tier,
          ≤200k context). DeepSeek V4 Pro charges $1.74 / 1M
          cache-miss input vs $3.48 / 1M output. A workload that
          maximises its output budget per call pays substantially more
          per request than one that produces short responses.
        </p>
        <p>
          Batch APIs cut both input and output rates by 50% across the
          providers tracked. Output-heavy workloads benefit
          proportionally more from the batch tier than input-heavy
          ones.
        </p>
      </section>

      <section id="use-case-matrix">
        <h2>Output-budget pressure by use case</h2>
        <MethodologyMatrix
          caption="How the output token budget interacts with common workloads"
          columns={["Output pressure", "Failure mode", "Recommended budget"]}
          rows={[
            {
              label: "Long-form generation",
              note: "Full reports, code repositories, structured datasets",
              cells: [
                "High — budget consumed proportionally to deliverable length.",
                "Truncation mid-response. Continuation prompts needed; coherence may drift.",
                "Match to deliverable; consider batch API for longer-than-64k outputs.",
              ],
            },
            {
              label: "Structured output",
              note: "JSON schema conformance, function-call payloads",
              cells: [
                "High per token of effective payload — keys, brackets, commas all count.",
                "Mid-output truncation can leave the JSON unparseable.",
                "Reserve 2–3× the visible payload size to cover serialization overhead.",
              ],
            },
            {
              label: "Agentic loops",
              note: "Tool calls + reasoning across many turns",
              cells: [
                "Moderate; spread across many short calls rather than one long one.",
                "Mid-turn truncation forces re-planning; extended-thinking traces eat the same budget.",
                "Keep individual call outputs short; checkpoint state between calls.",
              ],
            },
            {
              label: "Code generation",
              note: "Whole-file or whole-module generation",
              cells: [
                "High; source code tokenises densely.",
                "File truncation produces partial/invalid syntax.",
                "Generate in functional units; verify each before continuing.",
              ],
            },
          ]}
        />
      </section>

      <section id="verified-examples">
        <h2>Verified examples</h2>
        <p>
          The four million-token-context models in the catalogue have
          output limits in a 64k–128k range, with one specific value
          published per provider. The full list lives under{" "}
          <em>Verified today</em> above, and each entry is linked back
          to its model page where the citation is visible inline.
        </p>
      </section>
    </ContentPageShell>
  );
}
