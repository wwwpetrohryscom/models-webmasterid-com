import type { Metadata } from "next";
import Link from "next/link";
import { ContentPageShell } from "@/components/ContentPageShell";
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
        { id: "shape", label: "Pricing row shape" },
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
            DeepSeek pricing must be anchored to a DeepSeek citation.
            (Same per-provider citation discipline applies elsewhere.)
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
