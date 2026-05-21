import type { Metadata } from "next";
import Link from "next/link";
import { ContentPageShell } from "@/components/ContentPageShell";
import { PricingUnitTable } from "@/components/content/PricingUnitTable";
import { MethodologyMatrix } from "@/components/content/MethodologyMatrix";
import { buildMetadata } from "@/lib/seo";
import { getContentPage } from "@/lib/content";

const SLUG = "/research/api-pricing-methodology";

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
        { id: "what-rows-mean", label: "What a row on /pricing means" },
        { id: "base-tokens", label: "Input and output tokens" },
        { id: "pricing-unit-matrix", label: "Pricing unit matrix" },
        { id: "provider-cache-comparison", label: "Provider cache semantics side-by-side" },
        { id: "cache-pricing", label: "Cache pricing is provider-specific" },
        { id: "batch-pricing", label: "Batch API pricing" },
        { id: "prompt-size", label: "Prompt-size tiers" },
        { id: "why-not-normalised", label: "Why we do not normalise" },
        { id: "citation-rules", label: "Citation rules" },
        { id: "unverified", label: "Why some pricing is hidden" },
      ]}
      verifiedToday={[
        {
          label: "Anthropic pricing rows",
          detail:
            "Base input/output, 5-minute and 1-hour cache write, cache read, and batch input/output for every active Claude model are verified from the Anthropic Pricing reference.",
        },
        {
          label: "Google Gemini pricing rows",
          detail:
            "Standard tier (≤200k context), prompt-size surcharge (>200k context), batch tier, per-hour cache storage, and one-shot cache write are verified from ai.google.dev/pricing for Gemini 2.5 Pro.",
        },
        {
          label: "DeepSeek V4 Pro pricing rows",
          detail:
            "Cache-miss input, cache-hit input, and output rates verified from the DeepSeek Models & Pricing page. The 75% promotional discount window is recorded per row's notes rather than as the durable canonical value.",
        },
      ]}
      dataGaps={[
        {
          label: "Mistral pricing",
          detail:
            "mistral.ai/pricing renders Le Chat subscription plans by default; the per-model API pricing tab is JS-driven. Mistral pricing rows are deferred to a manual browser pass.",
        },
        {
          label: "OpenAI pricing",
          detail:
            "platform.openai.com returns 403 to automated retrieval. No OpenAI pricing has been verified.",
        },
        {
          label: "Provider promotional rates beyond the documented discount window",
          detail:
            "When a provider runs a time-limited discount, the catalogue records the regular rate as the durable canonical value and captures the effective discounted rate in the row's notes. We do not pin a soon-to-expire price as the headline number.",
        },
      ]}
      relatedLinks={[
        {
          href: "/pricing",
          label: "Pricing",
          description:
            "Live filtered pricing hub with verified-row and pending-row sections.",
        },
        {
          href: "/docs/pricing-fields",
          label: "Pricing fields reference",
          description: "Every PricingUnit value and what each one means.",
        },
        {
          href: "/sources",
          label: "Sources",
          description: "Every primary-source pricing citation.",
        },
        {
          href: "/research/model-selection",
          label: "Model selection",
          description: "How pricing fits into the broader selection framework.",
        },
      ]}
    >
      <section id="what-rows-mean">
        <h2>What a row on /pricing means</h2>
        <p>
          A row on the pricing hub is a single tuple — model, unit,
          amount, citation, last-checked — recorded straight from the
          vendor&apos;s pricing page. Every row is one of the values in
          the typed{" "}
          <code className="rounded bg-muted px-1">PricingUnit</code>{" "}
          union (see{" "}
          <Link
            href="/docs/pricing-fields"
            className="text-primary hover:underline"
          >
            /docs/pricing-fields
          </Link>{" "}
          for the full enum). If the row carries a value, it carries a
          citation; if it carries the canonical unverified-data label,
          it carries no citation by design.
        </p>
      </section>

      <section id="base-tokens">
        <h2>Input and output tokens</h2>
        <p>
          The two universal axes. <code className="rounded bg-muted px-1">
            1M input tokens
          </code>{" "}
          is the per-million-token price the provider charges for the
          prompt; <code className="rounded bg-muted px-1">
            1M output tokens
          </code>{" "}
          is the same for generated content. These two units are stable
          across providers and are usually the first comparison axis for
          cost projection.
        </p>
        <p>
          Token-to-token equivalence across providers is not exact — a
          provider&apos;s tokenizer determines how many tokens a given
          string costs. Anthropic Opus 4.7 in particular ships a new
          tokenizer that can use up to ~35% more tokens for the same
          fixed text than earlier Claude generations; the verified
          field on that model&apos;s record captures this explicitly. The
          pricing hub does not adjust for tokenizer differences; cost
          projections that need precision should sample real prompts on
          each vendor&apos;s tokenizer.
        </p>
      </section>

      <section id="pricing-unit-matrix">
        <h2>Pricing unit matrix</h2>
        <p>
          Every row on{" "}
          <Link href="/pricing" className="text-primary hover:underline">
            /pricing
          </Link>{" "}
          is one of the units below. The matrix documents the
          vocabulary; per-provider verified amounts live on each model
          record and render through the existing pricing helpers.
        </p>
        <PricingUnitTable />
      </section>

      <section id="provider-cache-comparison">
        <h2>Provider cache semantics side-by-side</h2>
        <MethodologyMatrix
          caption="Cache pricing semantics across providers"
          columns={["Anthropic", "Google Gemini", "DeepSeek"]}
          rows={[
            {
              label: "Cache write fee",
              note: "Cost when a payload first enters the cache",
              cells: [
                "Two TTL tiers: 5-minute and 1-hour cache write rates, both per-million-tokens.",
                "Single one-shot cache write fee, per-million-tokens. Independent of storage rate.",
                "No explicit write fee published — input rate is split into cache-miss vs cache-hit instead.",
              ],
            },
            {
              label: "Cache read / hit",
              note: "Cost when a request reuses cached content",
              cells: [
                "Single per-million-tokens cache read rate. Same number across all TTLs.",
                "No per-read fee — cached tokens are billed via the per-hour storage rate.",
                "Cache-hit input rate is dramatically lower than cache-miss input (sometimes ~100× lower).",
              ],
            },
            {
              label: "Storage / retention",
              note: "Recurring cost while cache exists",
              cells: [
                "TTL-bound: cache disappears after 5 minutes or 1 hour depending on which write rate was used.",
                "Per-hour storage rate, per-million-tokens, continuing as long as the cache exists.",
                "Not disclosed — DeepSeek treats cache state as an implementation detail.",
              ],
            },
          ]}
        />
        <p className="text-xs text-muted-foreground">
          These semantics are deliberately kept as separate units in
          the catalogue. A cost projection that maps Google&apos;s
          per-hour storage onto Anthropic&apos;s TTL writes will be
          wrong by a multiplier; the only safe way to compare is
          per-workload arithmetic.
        </p>
      </section>

      <section id="cache-pricing">
        <h2>Cache pricing is provider-specific</h2>
        <p>
          Cache pricing is where providers diverge most. We deliberately
          do not collapse the divergent semantics into a single column.
        </p>
        <ul>
          <li>
            <strong>Anthropic.</strong> Two cache write rates per model
            (5-minute and 1-hour TTL) plus a cache read rate, all
            per-million-tokens. The 5-minute write is cheaper; the
            1-hour write is more expensive but persists across long
            sessions.
          </li>
          <li>
            <strong>Google.</strong> A one-shot cache write fee per
            million tokens plus a separate per-hour cache storage rate.
            Storage is a recurring cost while the cache exists; write
            is a one-time fee per cached payload.
          </li>
          <li>
            <strong>DeepSeek.</strong> Two input rates — cache-miss and
            cache-hit — published as separate amounts. The cache-hit
            rate is dramatically lower than cache-miss; the catalogue
            records both.
          </li>
        </ul>
        <p>
          The PricingUnit enum captures these distinctions as separate
          rows:{" "}
          <code className="rounded bg-muted px-1">
            1M cache write tokens (5m)
          </code>
          ,{" "}
          <code className="rounded bg-muted px-1">
            1M cache write tokens (1h)
          </code>
          ,{" "}
          <code className="rounded bg-muted px-1">
            1M cache read tokens
          </code>
          ,{" "}
          <code className="rounded bg-muted px-1">
            1M cache storage / hour
          </code>
          . A cost model that ignores the semantic difference will
          mis-estimate by a wide margin on cache-heavy workloads.
        </p>
      </section>

      <section id="batch-pricing">
        <h2>Batch API pricing</h2>
        <p>
          Batch API tiers are the cheapest token rate at every provider
          we track — typically 50% of the synchronous rate. Recorded as{" "}
          <code className="rounded bg-muted px-1">1M batch input tokens</code>{" "}
          and{" "}
          <code className="rounded bg-muted px-1">
            1M batch output tokens
          </code>
          . Latency is much higher and the queue semantics are
          provider-specific; the pricing hub records the rate, not the
          SLA.
        </p>
      </section>

      <section id="prompt-size">
        <h2>Prompt-size tiers</h2>
        <p>
          Google publishes a two-tier prompt-size price for Gemini: a
          standard rate for prompts ≤200k tokens and a surcharge for
          prompts &gt;200k tokens. Both the standard and surcharge are
          recorded as separate first-class rows (
          <code className="rounded bg-muted px-1">
            1M input tokens (&gt;200k context)
          </code>
          ,{" "}
          <code className="rounded bg-muted px-1">
            1M output tokens (&gt;200k context)
          </code>
          , etc.) so a long-context cost projection can use the right
          number directly. We did not hide the surcharge in a row note;
          surfacing it as a unit makes it filterable and citable.
        </p>
      </section>

      <section id="why-not-normalised">
        <h2>Why we do not normalise to a single &quot;total cost&quot; column</h2>
        <p>
          A single &quot;effective $/1M tokens&quot; metric requires
          assumptions about cache-hit rate, batch share, prompt size
          distribution, and tokenizer differences — none of which are
          intrinsic to the model. Publishing a normalised number invites
          spurious precision and is the exact pattern we are trying to
          avoid. Readers who need a normalised projection should compute
          it against their own workload distribution; the pricing hub
          provides each input to that computation as a separate, sourced
          row.
        </p>
      </section>

      <section id="citation-rules">
        <h2>Citation rules</h2>
        <p>
          Every pricing row with a verified amount carries a
          primary-source citation, surfaced both inline on the model
          page and in the source index at{" "}
          <Link href="/sources" className="text-primary hover:underline">
            /sources
          </Link>
          . An integrity guard refuses to ship a build where a verified
          pricing row references no citation. A second guard refuses to
          ship a row that carries unit{" "}
          <code className="rounded bg-muted px-1">unknown</code>{" "}
          alongside a verified amount — the placeholder is for rows
          whose unit semantics have not yet been confirmed, and such a
          row may never carry a value.
        </p>
      </section>

      <section id="unverified">
        <h2>Why some pricing is hidden</h2>
        <p>
          Where a pricing page renders only with JavaScript (as is the
          case with mistral.ai/pricing&apos;s API tab) or returns HTTP
          403 to automated retrieval (as platform.openai.com does), no
          rate is recorded. The relevant model pages render the canonical
          unverified-data label and the pricing hub lists those models
          under <em>Pending verification</em>. A manual browser pass is
          how a value moves out of that bucket; the workflow is
          documented at{" "}
          <Link
            href="/docs/data-verification"
            className="text-primary hover:underline"
          >
            /docs/data-verification
          </Link>
          .
        </p>
      </section>
    </ContentPageShell>
  );
}
