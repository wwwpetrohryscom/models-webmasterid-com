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
        { id: "reference-not-quote", label: "References, not live quotes" },
        { id: "no-price-ranking", label: "No price-ranking policy" },
        { id: "creator-vs-host", label: "Model creator vs hosted provider" },
        { id: "availability-vs-pricing", label: "Hosted availability vs hosted pricing" },
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

      <section id="reference-not-quote">
        <h2>References, not live quotes</h2>
        <p>
          Pricing is volatile. Vendors run promotional discount windows
          (DeepSeek&apos;s 75% v4-pro window), hosting platforms re-price
          weekly, marketplace rates drift with capacity. Without a
          freshness signal a price catalogue degrades silently as rows
          age — readers see numbers and assume they are current. Sprint
          20 reframes every pricing surface as a <em>source-backed
          reference</em>: a value confirmed against a vendor page on a
          specific date, with an explicit volatility tag and an
          explicit freshness state.
        </p>
        <p>
          A row that shows $0.11/$0.34 today is not a guarantee the same
          rate is in effect tomorrow. Every row links back to the
          vendor&apos;s own page; cost projections should re-verify
          against the source before commitment. The schema definition
          lives at{" "}
          <Link
            href="/docs/pricing-fields"
            className="text-primary hover:underline"
          >
            /docs/pricing-fields
          </Link>
          ; the rendering layer pairs every row with{" "}
          <em>Freshness</em> and <em>Volatility</em> chips so the
          warning is unavoidable. Sprint 21 added the manual review
          loop: rows that age into <em>review_due</em> or{" "}
          <em>stale</em> show up on the{" "}
          <Link
            href="/reverification"
            className="text-primary hover:underline"
          >
            /reverification
          </Link>{" "}
          queue with the source URL and a suggested manual action.
          Nothing on the catalogue auto-fetches or auto-mutates a
          pricing value.
        </p>
      </section>

      <section id="no-price-ranking">
        <h2>No price-ranking policy</h2>
        <p>
          WebmasterID Models does not rank models or billing providers
          by price. Pricing is rendered side-by-side where the
          underlying data is verified, but the surfaces deliberately
          omit:
        </p>
        <ul>
          <li>&quot;Cheapest provider&quot; rankings.</li>
          <li>
            &quot;Lower / lowest&quot; comparators or
            &quot;savings&quot; calculations.
          </li>
          <li>&quot;Better value&quot; or &quot;best price&quot; copy.</li>
          <li>Price-derived winner declarations on comparison pages.</li>
          <li>Delta columns that compute one row minus another.</li>
        </ul>
        <p>
          The reasons are practical. (1) Tokenizers differ between
          providers; the same string costs different numbers of tokens
          on each vendor — a $/1M comparison is meaningful only at the
          level of a real workload distribution. (2) Cache pricing
          semantics are not commensurable across vendors (see the cache
          section below). (3) Promotional windows expire silently — a
          &quot;cheapest&quot; ranking pinned today is wrong tomorrow.
          (4) Hosted pricing depends on platform, region, tier, and
          contract; a public-listing $/1M number is one slice of a
          multi-variable surface. The data is honest about its
          limitations rather than papering over them with a derived
          number that invites bad decisions.
        </p>
        <p>
          An integrity guard enforces this at build time — any new copy
          containing &quot;cheapest&quot;, &quot;lower cost&quot;,
          &quot;lowest price&quot;, &quot;best value&quot;, &quot;price
          winner&quot;, &quot;save money&quot;, or &quot;cheaper
          than&quot; fails CI on data + content surfaces.
        </p>
      </section>

      <section id="creator-vs-host">
        <h2>Model creator vs hosted provider</h2>
        <p>
          A pricing row is two-sided: an organisation creates a model,
          and an organisation bills for inference. The two are usually
          the same — Anthropic, Google, DeepSeek, and Mistral all run
          first-party APIs for the models they create — but they are
          not always the same. Meta releases Llama 4 as open weights
          and runs no paid API for it; the cost of Llama 4 inference
          comes from third-party hosting platforms (Groq, Together AI,
          Bedrock, Vertex, …) at rates each platform sets independently.
        </p>
        <p>
          Sprint 19 (2026-05-23) made this split explicit. Every pricing
          record now carries a{" "}
          <code className="rounded bg-muted px-1">pricingContext</code>{" "}
          tag:
        </p>
        <ul>
          <li>
            <code className="rounded bg-muted px-1">
              model_creator_first_party_api
            </code>{" "}
            — the billing provider IS the model&apos;s creator. Every
            existing Anthropic, Google, DeepSeek, and Mistral row is
            classified here.
          </li>
          <li>
            <code className="rounded bg-muted px-1">
              hosted_provider_api
            </code>{" "}
            — a hosting platform bills for a model created by someone
            else. Groq&apos;s Llama 4 Scout row and Together AI&apos;s
            DeepSeek V4 Pro row are the two such rows recorded today.
          </li>
        </ul>
        <p>
          The /pricing hub renders these two contexts in separate
          tables. Hosted rows include both the{" "}
          <em>Model creator</em> and <em>Billing provider</em> columns
          so a reader can never mistake a Groq rate for a Meta rate.
          Hosted pricing also has its own <em>hosted model ID</em>{" "}
          column — the platform-specific identifier the developer
          actually passes in the API request.
        </p>
        <p>
          Why this distinction matters for cost projection:
        </p>
        <ul>
          <li>
            Hosted-provider rates do <em>not</em> reflect a model
            creator&apos;s pricing decision; they reflect the hosting
            platform&apos;s. A comparison that uses Groq&apos;s Llama
            4 Scout rate as &quot;Meta&apos;s price&quot; is wrong.
          </li>
          <li>
            Different hosting platforms price the same model
            differently. Llama 4 Scout on Groq is not Llama 4 Scout on
            Together; DeepSeek V4 Pro on Together is not DeepSeek V4
            Pro on DeepSeek&apos;s own API. The two-table layout makes
            the comparison side-by-side, not collapsed.
          </li>
          <li>
            Promotional discounts and platform-specific features
            (Groq&apos;s prompt-cache discount, Together&apos;s
            cache-hit input rate) are attached to the hosting
            platform&apos;s row, not back-fitted onto the
            creator&apos;s row.
          </li>
        </ul>
        <p>
          The full schema lives in{" "}
          <Link
            href="/docs/pricing-fields"
            className="text-primary hover:underline"
          >
            /docs/pricing-fields
          </Link>
          .
        </p>
      </section>

      <section id="availability-vs-pricing">
        <h2>Hosted availability vs hosted pricing</h2>
        <p>
          Sprint 20 separated <em>availability</em> from <em>pricing</em>.
          Availability is a stable fact — the platform either exposes
          the model or it does not. Pricing is the volatile reference
          value — it may change after retrieval and is paired with a
          freshness signal. The two surface independently in the
          catalogue so the stable identity claim (&quot;Llama 4 Scout
          is hosted on Groq under model ID{" "}
          <code className="rounded bg-muted px-1">
            meta-llama/llama-4-scout-17b-16e-instruct
          </code>
          &quot;) does not degrade in lockstep with the volatile rate.
        </p>
        <p>
          The availability layer lives in{" "}
          <code className="rounded bg-muted px-1">
            lib/hosted-availability.ts
          </code>
          . It exposes one record per (host × model) carrying the
          hosted model ID, model creator slug, billing provider slug,
          the underlying citation, the last-checked timestamp, and a
          computed pricing-freshness state. Provider pages render the
          availability list above the pricing table; model pages render
          it alongside hosted pricing references. The catalogue
          intentionally does not promote availability into a dedicated
          indexable route unless and until the data is wide enough to
          warrant one — see the route-decision note in this
          sprint&apos;s commit.
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
