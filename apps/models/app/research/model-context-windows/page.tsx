import type { Metadata } from "next";
import Link from "next/link";
import { ContentPageShell } from "@/components/ContentPageShell";
import { buildMetadata } from "@/lib/seo";
import { getContentPage } from "@/lib/content";

const SLUG = "/research/model-context-windows";

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
        { id: "what-it-is", label: "What a context window actually is" },
        { id: "input-vs-output", label: "Input limit vs output limit" },
        { id: "tokenizer-differences", label: "Tokenizer differences across providers" },
        { id: "verified-examples", label: "Verified examples in the catalogue" },
        { id: "long-context-cost", label: "Long-context cost considerations" },
        { id: "what-we-do-not-claim", label: "What we do not claim" },
      ]}
      verifiedToday={[
        {
          label: "Anthropic Claude Opus 4.7 and Sonnet 4.6: 1,000,000 token context",
          detail:
            "Verified from Anthropic's Models overview. Per the same page, Opus 4.7 ships a new tokenizer that can use up to 35% more tokens for the same text — verified field directly on the model record.",
        },
        {
          label: "Google Gemini 2.5 Pro: 1,048,576 token context",
          detail:
            "Verified from ai.google.dev/gemini-api/docs/models/gemini-2.5-pro. Listed precisely as 1,048,576 rather than rounded.",
        },
        {
          label: "DeepSeek V4 Pro: 1,000,000 token context",
          detail:
            "Verified from the DeepSeek Models & Pricing page. Same nominal headline figure as the Claude family and Gemini Pro, but different tokenizer and different pricing structure for long prompts.",
        },
        {
          label: "Claude Opus 4 (deprecated): 200,000 token context",
          detail:
            "Verified historical record. Demonstrates that within a single provider, generation-to-generation context window changes can be 5×.",
        },
      ]}
      dataGaps={[
        {
          label: "Mistral Large 3 context window",
          detail:
            "The per-model spec card on docs.mistral.ai returns 404 to automated retrieval. Mistral context-window claims are out of scope until a manual browser pass lands.",
        },
        {
          label: "Per-prompt effective context",
          detail:
            "Providers publish a maximum context length, not an effective one. Effective in-context recall is workload-dependent and is not republished as a metric on this site.",
        },
      ]}
      relatedLinks={[
        {
          href: "/models",
          label: "Models",
          description: "Filter by modality, lifecycle, and provider.",
        },
        {
          href: "/research/model-output-limits",
          label: "Output token limits",
          description: "The other side of the context budget.",
        },
        {
          href: "/research/api-pricing-methodology",
          label: "API pricing methodology",
          description: "How long-context prompts can change the rate that applies.",
        },
        {
          href: "/docs/model-page-schema",
          label: "Model page schema",
          description: "Where the context-window field lives in the data model.",
        },
      ]}
    >
      <section id="what-it-is">
        <h2>What a context window actually is</h2>
        <p>
          A context window is the maximum number of tokens a single
          request can carry as input. It is the union of the system
          prompt, the conversation history, any retrieved documents,
          tool definitions, and the new user message. A model with a
          1,000,000-token context window can accept up to that many
          tokens in one inference call — not across a session, not
          across an agent loop, but in one shot.
        </p>
        <p>
          The catalogue records context window as a verified field on
          the model entity. Where it is not directly published in the
          vendor&apos;s docs, the record renders the canonical
          unverified-data label rather than guessing.
        </p>
      </section>

      <section id="input-vs-output">
        <h2>Input limit vs output limit</h2>
        <p>
          Context window is an input limit. The number of tokens a model
          can generate in a single response is a separate field —{" "}
          <em>max output tokens</em> — and is usually a much smaller
          number than the context window. Claude Opus 4.7 advertises a
          1M-token context window and a 128k-token max output (300k via
          the Message Batches beta header). Gemini 2.5 Pro advertises a
          ~1M-token context and a 65,536-token max output. Mixing these
          up is a common source of cost and design errors: a workload
          that needs to <em>read</em> a long document is different from
          one that needs to <em>write</em> one.
        </p>
        <p>
          See{" "}
          <Link
            href="/research/model-output-limits"
            className="text-primary hover:underline"
          >
            /research/model-output-limits
          </Link>{" "}
          for the output side.
        </p>
      </section>

      <section id="tokenizer-differences">
        <h2>Tokenizer differences across providers</h2>
        <p>
          One million tokens at provider A is not the same payload as
          one million tokens at provider B. Each provider ships its own
          tokenizer, and a given fixed text fragments differently
          depending on which tokenizer encodes it. Anthropic explicitly
          documents that Opus 4.7 can use up to 35% more tokens than
          earlier Claude generations for the same input — a fact
          captured as a verified note on that model&apos;s record.
        </p>
        <p>
          The catalogue does not publish a tokenizer-normalised
          context window. The headline figures on the model pages are
          the vendor&apos;s own published numbers; a cost projection that
          needs precision should sample real prompts on each
          vendor&apos;s tokenizer.
        </p>
      </section>

      <section id="verified-examples">
        <h2>Verified examples in the catalogue</h2>
        <p>
          The four million-token-class records currently in the
          catalogue are listed under <em>Verified today</em> above. The
          contrast between Claude Opus 4 (200k, deprecated) and Claude
          Opus 4.7 (1M, current) is a useful illustration of how
          quickly the context-window axis moves within a single provider
          generation.
        </p>
        <p>
          The two-sided verified comparison{" "}
          <Link
            href="/compare/gemini-2-5-pro-vs-claude-opus-4-7"
            className="text-primary hover:underline"
          >
            Gemini 2.5 Pro vs Claude Opus 4.7
          </Link>{" "}
          lays the context-window field side by side along with
          pricing and modality.
        </p>
      </section>

      <section id="long-context-cost">
        <h2>Long-context cost considerations</h2>
        <p>
          Long-context requests are sometimes cheaper per token than
          short ones (with batch APIs), sometimes more expensive (with
          prompt-size tiers), and sometimes the same. Google&apos;s
          Gemini API charges a surcharge for prompts &gt;200k tokens —
          captured as the{" "}
          <code className="rounded bg-muted px-1">
            1M input tokens (&gt;200k context)
          </code>{" "}
          unit on the pricing hub. Anthropic and DeepSeek currently
          have a flat per-token rate independent of prompt size.
        </p>
        <p>
          Provider-specific cache pricing also interacts with long
          context — see{" "}
          <Link
            href="/research/api-pricing-methodology#cache-pricing"
            className="text-primary hover:underline"
          >
            /research/api-pricing-methodology
          </Link>
          .
        </p>
      </section>

      <section id="what-we-do-not-claim">
        <h2>What we do not claim</h2>
        <p>
          We do not publish a quality-of-recall metric across long
          contexts (the &quot;needle in a haystack&quot; style of
          evaluation lives elsewhere and warrants independent
          replication, not republication). We do not claim a
          million-token context is equivalent to a million-token
          context on another provider. We do not publish a latency
          number for long-context inference — request latency is
          workload-dependent and we have not yet wired an independent
          measurement harness.
        </p>
      </section>
    </ContentPageShell>
  );
}
