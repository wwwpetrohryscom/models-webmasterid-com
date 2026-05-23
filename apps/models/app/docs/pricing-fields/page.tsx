import type { Metadata } from "next";
import Link from "next/link";
import { ContentPageShell } from "@/components/ContentPageShell";
import { PricingUnitTable } from "@/components/content/PricingUnitTable";
import { buildMetadata } from "@/lib/seo";
import { getContentPage } from "@/lib/content";

const SLUG = "/docs/pricing-fields";

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
      breadcrumbParent={{ name: "Docs", href: "/docs" }}
      toc={[
        { id: "enum-table", label: "PricingUnit enum reference" },
        { id: "shape", label: "Pricing row shape" },
        { id: "pricing-context", label: "PricingContext: creator vs host" },
        { id: "freshness-volatility", label: "Pricing freshness + volatility" },
        { id: "base", label: "Input / output base units" },
        { id: "cache", label: "Cache pricing units" },
        { id: "prompt-size", label: "Prompt-size tier units" },
        { id: "batch", label: "Batch pricing units" },
        { id: "non-token", label: "Non-token units" },
        { id: "unknown", label: "The unknown placeholder" },
        { id: "rules", label: "Validation rules" },
      ]}
      relatedLinks={[
        {
          href: "/pricing",
          label: "Pricing",
          description: "Live filtered pricing hub.",
        },
        {
          href: "/research/api-pricing-methodology",
          label: "API pricing methodology",
          description: "Why each unit exists as a separate row.",
        },
        {
          href: "/docs/data-verification",
          label: "Data verification",
          description: "Verification rules every pricing amount must satisfy.",
        },
      ]}
    >
      <section id="enum-table">
        <h2>PricingUnit enum reference</h2>
        <PricingUnitTable />
        <p className="mt-2 text-xs text-muted-foreground">
          The &quot;Verified for&quot; column reflects providers with at
          least one verified pricing row at that unit today; absence
          does not mean a provider lacks the concept, only that it has
          not been verified into the catalogue.
        </p>
      </section>

      <section id="shape">
        <h2>Pricing row shape</h2>
        <pre className="overflow-x-auto rounded-lg border border-border bg-background/60 p-3 text-[12px] leading-relaxed">
          {`interface VerifiedPricingTier {
  unit: PricingUnit;
  amount: MaybeVerified<number>; // verified number in USD, or null
  notes?: string;
}`}
        </pre>
        <p>
          A row sets exactly one{" "}
          <code className="rounded bg-muted px-1">unit</code> from the
          closed{" "}
          <code className="rounded bg-muted px-1">PricingUnit</code>{" "}
          union and a single optional amount. The amount is either a
          verified number with citation or{" "}
          <code className="rounded bg-muted px-1">null</code>;
          interpolation is never allowed. Each pricing row attaches to
          one model record under its{" "}
          <code className="rounded bg-muted px-1">pricing</code> array.
        </p>
      </section>

      <section id="pricing-context">
        <h2>PricingContext: creator vs host</h2>
        <p>
          Sprint 19 added an explicit{" "}
          <code className="rounded bg-muted px-1">pricingContext</code>{" "}
          tag on every pricing record so first-party model-creator
          pricing is never confused with third-party hosted-provider
          pricing.
        </p>
        <pre className="overflow-x-auto rounded-lg border border-border bg-background/60 p-3 text-[12px] leading-relaxed">
          {`type PricingContext =
  | "model_creator_first_party_api"
  | "hosted_provider_api"
  | "cloud_marketplace"
  | "unknown";

interface PricingRecord {
  modelSlug: string;
  modelCreatorProviderSlug: string;   // who made the model
  billingProviderSlug: string;        // who invoices the developer
  hostedModelId?: string;             // platform-specific model ID
  pricingContext: PricingContext;
  tiers: VerifiedPricingTier[];
  citation?: SourceCitation;
  // ...
}`}
        </pre>
        <ul>
          <li>
            <code className="rounded bg-muted px-1">
              model_creator_first_party_api
            </code>{" "}
            — the billing provider IS the model&apos;s creator
            (Anthropic charging for Claude, DeepSeek charging for
            DeepSeek V4 Pro, Mistral charging for Mistral Large 3).
            Existing rows on each <code className="rounded bg-muted px-1">ModelEntity.pricing</code>{" "}
            array carry this context implicitly.
          </li>
          <li>
            <code className="rounded bg-muted px-1">hosted_provider_api</code>{" "}
            — a third-party platform (Groq, Together AI) hosts a model
            created by another organisation and bills the developer at
            the platform&apos;s own rate. The two providers are
            different.{" "}
            <code className="rounded bg-muted px-1">hostedModelId</code>{" "}
            records the platform-specific identifier (e.g. Groq&apos;s{" "}
            <code className="rounded bg-muted px-1">
              meta-llama/llama-4-scout-17b-16e-instruct
            </code>
            ).
          </li>
          <li>
            <code className="rounded bg-muted px-1">cloud_marketplace</code>{" "}
            — reserved for AWS Bedrock / Vertex / Azure pricing rows.
            Not used today; reserved so future rows have a stable place
            to land.
          </li>
          <li>
            <code className="rounded bg-muted px-1">unknown</code> — a
            row whose context has not been determined. Type-level
            placeholder only; no row currently uses it.
          </li>
        </ul>
        <p>
          Hosted pricing is intentionally NOT merged into the model
          creator&apos;s schema.org{" "}
          <code className="rounded bg-muted px-1">Offer</code> records.
          Schema.org consumers (search engines, LLMs) treat{" "}
          <code className="rounded bg-muted px-1">creator</code> +{" "}
          <code className="rounded bg-muted px-1">offers</code> as a
          single claim — emitting Groq&apos;s rate under Meta&apos;s{" "}
          <code className="rounded bg-muted px-1">creator</code> block
          would falsely imply Meta charges that rate.
        </p>
      </section>

      <section id="freshness-volatility">
        <h2>Pricing freshness + volatility</h2>
        <p>
          Sprint 20 added two fields that pair with every pricing record
          to make staleness visible. Pricing values are <em>references</em>,
          not live quotes — the freshness field tells you how recently a
          row was confirmed; the volatility field tells you how often
          the rate is expected to change.
        </p>
        <pre className="overflow-x-auto rounded-lg border border-border bg-background/60 p-3 text-[12px] leading-relaxed">
          {`type PricingVolatility = "high" | "medium" | "low" | "unknown";

interface PricingRecord {
  // ...
  volatility: PricingVolatility;
  reviewCadenceDays?: number;
  lastCheckedAt: string | null;
}

// Freshness is computed (lib/pricing-freshness.ts):
type PricingFreshnessState =
  | "fresh"         // checked within 14 days
  | "review_due"    // 15–30 days
  | "stale"         // 31+ days
  | "unknown";      // no timestamp
`}
        </pre>
        <ul>
          <li>
            <strong>Hosted-provider rows</strong> default to volatility{" "}
            <code className="rounded bg-muted px-1">&quot;high&quot;</code>{" "}
            and review cadence{" "}
            <code className="rounded bg-muted px-1">14</code> days —
            hosting platforms re-price frequently.
          </li>
          <li>
            <strong>First-party rows</strong> default to{" "}
            <code className="rounded bg-muted px-1">&quot;medium&quot;</code>{" "}
            and review cadence{" "}
            <code className="rounded bg-muted px-1">30</code> days —
            first-party rates move slower but still move (promotional
            windows, retirements, regional adjustments).
          </li>
          <li>
            No row ever defaults to{" "}
            <code className="rounded bg-muted px-1">&quot;low&quot;</code>{" "}
            volatility. A reader who treats any pricing record as stable
            should be corrected by every surface that renders it.
          </li>
        </ul>
        <p>
          Freshness is computed against{" "}
          <code className="rounded bg-muted px-1">siteConfig.buildDate</code>{" "}
          rather than wall-clock <em>now</em> so the same build renders
          the same state on every page. Transitions happen at deploy
          time, not mid-render. The thresholds (14 / 30 / 45 days) are
          encoded in{" "}
          <code className="rounded bg-muted px-1">
            PRICING_FRESHNESS_DAYS
          </code>{" "}
          in{" "}
          <code className="rounded bg-muted px-1">
            lib/pricing-freshness.ts
          </code>
          .
        </p>
        <p className="text-xs text-muted-foreground">
          <strong>Not a live-quote policy:</strong> Pricing is a
          source-backed reference, not a real-time API. Every surface
          that shows a price also shows the source URL and{" "}
          <code className="rounded bg-muted px-1">lastCheckedAt</code> so
          a reader can audit the row before projecting cost. WebmasterID
          Models does not rank models or billing providers by price.
        </p>
      </section>

      <section id="base">
        <h2>Input / output base units</h2>
        <ul>
          <li>
            <code className="rounded bg-muted px-1">
              &quot;1M input tokens&quot;
            </code>{" "}
            — per-million-tokens base input rate (USD).
          </li>
          <li>
            <code className="rounded bg-muted px-1">
              &quot;1M output tokens&quot;
            </code>{" "}
            — per-million-tokens base output rate (USD).
          </li>
        </ul>
        <p>
          Universal axes; every verified-pricing model has these two.
        </p>
      </section>

      <section id="cache">
        <h2>Cache pricing units</h2>
        <ul>
          <li>
            <code className="rounded bg-muted px-1">
              &quot;1M cache write tokens (5m)&quot;
            </code>{" "}
            — Anthropic-style 5-minute TTL cache write.
          </li>
          <li>
            <code className="rounded bg-muted px-1">
              &quot;1M cache write tokens (1h)&quot;
            </code>{" "}
            — Anthropic-style 1-hour TTL cache write.
          </li>
          <li>
            <code className="rounded bg-muted px-1">
              &quot;1M cache read tokens&quot;
            </code>{" "}
            — Anthropic-style cache read; also used for
            DeepSeek-style cache-hit input where the provider publishes
            a per-token rate.
          </li>
          <li>
            <code className="rounded bg-muted px-1">
              &quot;1M cache storage / hour&quot;
            </code>{" "}
            — Google-style per-hour cache storage rate. NOT
            interchangeable with the Anthropic TTL units; recorded
            distinctly so cost projections do not conflate them.
          </li>
        </ul>
      </section>

      <section id="prompt-size">
        <h2>Prompt-size tier units</h2>
        <ul>
          <li>
            <code className="rounded bg-muted px-1">
              &quot;1M input tokens (&gt;200k context)&quot;
            </code>
          </li>
          <li>
            <code className="rounded bg-muted px-1">
              &quot;1M output tokens (&gt;200k context)&quot;
            </code>
          </li>
          <li>
            <code className="rounded bg-muted px-1">
              &quot;1M cache write tokens (&gt;200k context)&quot;
            </code>
          </li>
        </ul>
        <p>
          Used by Google&apos;s Gemini API for the surcharge that
          applies to prompts &gt;200k tokens. Surfaced as first-class
          units so long-context cost projections can filter on the
          right number without parsing row notes.
        </p>
      </section>

      <section id="batch">
        <h2>Batch pricing units</h2>
        <ul>
          <li>
            <code className="rounded bg-muted px-1">
              &quot;1M batch input tokens&quot;
            </code>
          </li>
          <li>
            <code className="rounded bg-muted px-1">
              &quot;1M batch output tokens&quot;
            </code>
          </li>
          <li>
            <code className="rounded bg-muted px-1">
              &quot;1M batch input tokens (&gt;200k context)&quot;
            </code>
          </li>
          <li>
            <code className="rounded bg-muted px-1">
              &quot;1M batch output tokens (&gt;200k context)&quot;
            </code>
          </li>
        </ul>
        <p>
          Batch API tiers across providers. Typically 50% of the
          synchronous rate at every provider tracked, but the catalogue
          records the published amount, not the derived ratio.
        </p>
      </section>

      <section id="non-token">
        <h2>Non-token units</h2>
        <ul>
          <li>
            <code className="rounded bg-muted px-1">&quot;request&quot;</code>{" "}
            — per-request rate (rare).
          </li>
          <li>
            <code className="rounded bg-muted px-1">&quot;image&quot;</code>{" "}
            — per-image rate, for image generation or vision-pricing
            schedules that are not token-denominated.
          </li>
          <li>
            <code className="rounded bg-muted px-1">&quot;minute&quot;</code>{" "}
            — per-minute rate for audio/transcription products.
          </li>
        </ul>
      </section>

      <section id="unknown">
        <h2>The unknown placeholder</h2>
        <p>
          <code className="rounded bg-muted px-1">&quot;unknown&quot;</code>{" "}
          is a placeholder for rows whose unit semantics have not yet
          been verified. A row with this unit MUST NOT carry a verified
          amount — an integrity guard refuses to ship a build that
          violates this invariant. The placeholder lets a pricing
          intent be tracked structurally without distorting a
          provider&apos;s pricing model into another provider&apos;s
          shape.
        </p>
      </section>

      <section id="rules">
        <h2>Validation rules</h2>
        <ul>
          <li>
            Every pricing row with a verified amount carries a citation.
          </li>
          <li>
            A pricing row with{" "}
            <code className="rounded bg-muted px-1">unit:&quot;unknown&quot;</code>{" "}
            may not carry a verified amount.
          </li>
          <li>
            DeepSeek first-party pricing must be anchored to a DeepSeek
            citation. (Same per-provider citation discipline applies
            elsewhere.)
          </li>
          <li>
            Every hosted-provider pricing record has a different{" "}
            <code className="rounded bg-muted px-1">
              modelCreatorProviderSlug
            </code>{" "}
            and{" "}
            <code className="rounded bg-muted px-1">
              billingProviderSlug
            </code>
            ; first-party records keep them equal.
          </li>
          <li>
            Hosted-provider rows must cite the billing provider&apos;s
            own pricing page — Groq prices must be sourced from Groq,
            Together prices from Together. A Meta citation may never
            sit on a Groq row.
          </li>
          <li>
            Meta first-party Llama pricing remains empty unless an
            official Meta pricing citation appears in{" "}
            <code className="rounded bg-muted px-1">
              data/citations.ts
            </code>
            . Groq and Together pricing for Llama models lives in{" "}
            <code className="rounded bg-muted px-1">
              data/hosted-pricing.ts
            </code>{" "}
            and does not back-fill Meta&apos;s creator pricing.
          </li>
          <li>
            Promotional discount windows are recorded in row{" "}
            <code className="rounded bg-muted px-1">notes</code>; the
            durable canonical amount is the regular rate, not the
            discounted rate.
          </li>
        </ul>
        <p>
          See{" "}
          <Link
            href="/research/api-pricing-methodology"
            className="text-primary hover:underline"
          >
            /research/api-pricing-methodology
          </Link>{" "}
          for the reasoning behind these rules.
        </p>
      </section>
    </ContentPageShell>
  );
}
