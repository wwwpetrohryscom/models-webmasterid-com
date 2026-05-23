import type { Metadata } from "next";
import Link from "next/link";
import { ContentPageShell } from "@/components/ContentPageShell";
import { MethodologyMatrix } from "@/components/content/MethodologyMatrix";
import { buildMetadata } from "@/lib/seo";
import { getContentPage } from "@/lib/content";

const SLUG = "/research/inference-infrastructure";

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
        { id: "what-counts", label: "What counts as infrastructure" },
        { id: "regions", label: "Regions and cloud availability" },
        { id: "api-surface", label: "API surface and protocols" },
        { id: "hosted-platforms", label: "Hosted inference platforms" },
        { id: "status-feeds", label: "Status feeds" },
        { id: "batching-caching", label: "Batching and caching" },
        { id: "rate-limits", label: "Rate limits and throughput" },
        { id: "public-vs-private", label: "Public vs private fields" },
        { id: "what-we-do-not-know", label: "What we do not know" },
        { id: "roadmap", label: "Data roadmap" },
      ]}
      verifiedToday={[
        {
          label: "API endpoints for verified providers",
          detail:
            "Anthropic Messages API (api.anthropic.com/v1/messages), Google Gemini API (generativelanguage.googleapis.com/v1beta/models/<model>:generateContent), DeepSeek chat-completions (api.deepseek.com/chat/completions), Mistral chat-completions (api.mistral.ai/v1/chat/completions). Each is recorded with the verified API reference citation.",
        },
        {
          label: "Provider docs / pricing / status URLs",
          detail:
            "Every provider entity carries primary docs, API docs, pricing docs, model catalogue, and status page URLs as verified fields where the provider publishes them.",
        },
        {
          label: "Status observation pipeline",
          detail:
            "Hourly cron writes vendor-reported and independent-probe observations for Anthropic; vendor-reported only for Google. See /research/ai-provider-status-monitoring.",
        },
      ]}
      dataGaps={[
        {
          label: "Regions",
          detail:
            "The ModelInfrastructure.regions field is null on every model record today. Provider regional availability lists exist on cloud-provider sides (Bedrock, Vertex) but require platform-specific verification we have not yet wired.",
        },
        {
          label: "Average request latency",
          detail:
            "ModelInfrastructure.avgLatencyMs is null everywhere. An independent measurement harness would be required; the only latency-shaped field we currently record is the status probe's fetch wall-clock time, which is explicitly NOT API latency.",
        },
        {
          label: "Uptime percentage",
          detail:
            "ModelInfrastructure.uptimePercent is null everywhere. See the status-monitoring policy for why we will not publish a number until we have enough durable independent observations.",
        },
        {
          label: "Rate-limit ceilings",
          detail:
            "Provider rate-limit tiers (RPM / TPM, concurrent requests, quota tiers) are not recorded as verified fields. They change frequently and are surfaced in the vendor's account console rather than in stable docs.",
        },
      ]}
      relatedLinks={[
        {
          href: "/infrastructure",
          label: "Infrastructure",
          description: "The structural infrastructure hub.",
        },
        {
          href: "/status",
          label: "Status",
          description: "Per-provider observer matrix.",
        },
        {
          href: "/coverage",
          label: "Coverage",
          description: "Per-provider verification matrix.",
        },
        {
          href: "/docs/provider-coverage",
          label: "Provider coverage reference",
          description: "Reference for what 'verified' means at the provider level.",
        },
      ]}
    >
      <section id="what-counts">
        <h2>What counts as infrastructure</h2>
        <p>
          For the purposes of the catalogue, &quot;inference
          infrastructure&quot; is the set of operational properties a
          builder needs to know to ship a model in production — beyond
          the model card itself. Stable inputs to that decision include
          regions, cloud availability, API surface (endpoint shape,
          authentication, request format), public status feeds,
          batching support, prompt caching, rate-limit structure, and
          throughput characteristics. Some are first-class fields on
          the catalogue today; others are documented data gaps the
          page reports openly.
        </p>
      </section>

      <section id="regions">
        <h2>Regions and cloud availability</h2>
        <p>
          A model served from a single region in one cloud is
          operationally different from one served across multiple
          regions in three clouds. The catalogue&apos;s
          ProviderEntity records carry a{" "}
          <code className="rounded bg-muted px-1">
            modelCatalogueUrl
          </code>{" "}
          field that points at each vendor&apos;s region-aware model
          listing, but the structured per-model regions array on the
          ModelInfrastructure type is null today. Bedrock and Vertex
          model-availability matrices are the obvious next sources;
          they require their own verification pass.
        </p>
      </section>

      <section id="api-surface">
        <h2>API surface and protocols</h2>
        <p>
          Every verified model record carries the model parameter
          string used on the wire. The four major shapes in the
          catalogue:
        </p>
        <ul>
          <li>
            <strong>Anthropic Messages API.</strong>{" "}
            <code className="rounded bg-muted px-1">
              POST api.anthropic.com/v1/messages
            </code>{" "}
            with model name in the JSON body.
          </li>
          <li>
            <strong>Google Gemini API.</strong>{" "}
            <code className="rounded bg-muted px-1">
              POST
              generativelanguage.googleapis.com/v1beta/models/&lt;model&gt;:generateContent
            </code>{" "}
            with model name in the URL path.
          </li>
          <li>
            <strong>DeepSeek chat completions.</strong>{" "}
            <code className="rounded bg-muted px-1">
              POST api.deepseek.com/chat/completions
            </code>{" "}
            with model name in the JSON body.
          </li>
          <li>
            <strong>Mistral chat completions.</strong>{" "}
            <code className="rounded bg-muted px-1">
              POST api.mistral.ai/v1/chat/completions
            </code>{" "}
            with model name in the JSON body.
          </li>
        </ul>
        <p>
          The differences in protocol shape — particularly model
          parameter position — matter for SDK adapters and for
          drop-in replacement scenarios. The model detail pages render
          a documentation-style example block for the providers whose
          API references are verified.
        </p>
      </section>

      <section id="hosted-platforms">
        <h2>Hosted inference platforms</h2>
        <p>
          Some inference providers do not create their own models —
          they host open-weights models from other organisations and
          bill the developer at platform-specific rates. Groq and
          Together AI are the two such platforms tracked here. They
          are valid <em>billing providers</em> on a pricing record,
          but they are never recorded as <em>model creators</em>.
        </p>
        <ul>
          <li>
            <strong>Model creator</strong> — the organisation that
            trained and released the model (Anthropic, Google, Meta,
            DeepSeek, Mistral, …). Stored on the model record&apos;s{" "}
            <code className="rounded bg-muted px-1">providerSlug</code>
            .
          </li>
          <li>
            <strong>Billing provider</strong> — the entity that
            invoices the developer for inference. For first-party
            APIs, equal to the model creator. For hosted-platform
            APIs, different. Stored on a pricing record&apos;s{" "}
            <code className="rounded bg-muted px-1">
              billingProviderSlug
            </code>
            .
          </li>
          <li>
            <strong>Hosted model ID</strong> — the platform-specific
            identifier the developer passes in API requests (e.g.
            Groq&apos;s{" "}
            <code className="rounded bg-muted px-1">
              meta-llama/llama-4-scout-17b-16e-instruct
            </code>
            ). Stored on a pricing record&apos;s{" "}
            <code className="rounded bg-muted px-1">hostedModelId</code>
            .
          </li>
        </ul>
        <p>
          Sprint 19 seeded the first hosted rows: Groq → Llama 4 Scout
          (Meta creator) and Together AI → DeepSeek V4 Pro (DeepSeek
          creator). Pricing decisions on those rows are made by the
          hosting platform — not by the model creator. We do NOT
          publish vendor latency / throughput / uptime claims from
          hosted platforms; the catalogue records only documented
          per-token rates, the hosted model ID, and the citation.
        </p>
        <p>
          Sprint 20 added two further safeguards: a freshness state
          (Fresh / Review due / Stale / Unknown) and a volatility tag
          (high / medium / low / unknown) on every pricing record, and
          a separate <em>hosted availability catalogue</em> that records
          the stable identity claim (host × model × hosted model ID)
          independently from the volatile rate. WebmasterID Models does
          not rank hosting platforms by price. See{" "}
          <Link
            href="/research/api-pricing-methodology#creator-vs-host"
            className="text-primary hover:underline"
          >
            /research/api-pricing-methodology
          </Link>{" "}
          and{" "}
          <Link
            href="/research/api-pricing-methodology#no-price-ranking"
            className="text-primary hover:underline"
          >
            no-price-ranking
          </Link>
          .
        </p>
      </section>

      <section id="status-feeds">
        <h2>Status feeds</h2>
        <p>
          Two patterns dominate. Anthropic and most newer providers
          use Statuspage, which exposes a stable JSON feed at{" "}
          <code className="rounded bg-muted px-1">
            /api/v2/status.json
          </code>{" "}
          with a typed indicator enum. Google Cloud uses a custom
          incidents-feed JSON at{" "}
          <code className="rounded bg-muted px-1">
            status.cloud.google.com/incidents.json
          </code>
          , which is an array of incident records with affected
          product lists. Mapping the second into our canonical
          ObservedStatus vocabulary requires filtering by product
          keyword and choosing a headline severity; see the source at{" "}
          <code className="rounded bg-muted px-1">
            lib/observers/google.ts
          </code>
          .
        </p>
      </section>

      <section id="batching-caching">
        <h2>Batching and caching</h2>
        <p>
          Every provider tracked today offers a batch API at a
          discounted rate (typically 50% of synchronous). Latency
          characteristics of the batch path are workload-dependent and
          provider-specific. The catalogue records the rate, not the
          SLA.
        </p>
        <p>
          Prompt caching diverges sharply — Anthropic uses two TTL
          tiers, Google uses a one-shot write fee plus per-hour
          storage, DeepSeek uses an automatic cache-miss/cache-hit
          input distinction. The pricing-fields reference at{" "}
          <Link
            href="/docs/pricing-fields"
            className="text-primary hover:underline"
          >
            /docs/pricing-fields
          </Link>{" "}
          documents the units; the methodology guide at{" "}
          <Link
            href="/research/api-pricing-methodology"
            className="text-primary hover:underline"
          >
            /research/api-pricing-methodology
          </Link>{" "}
          explains why we keep them as separate fields.
        </p>
      </section>

      <section id="rate-limits">
        <h2>Rate limits and throughput</h2>
        <p>
          Rate limits live in each vendor&apos;s account console and
          change with tier, region, and account history. We do not
          record per-tier rate-limit numbers as verified fields
          because they are not stable enough to be useful as a single
          published value; they belong in operational tooling, not in
          a public data catalogue.
        </p>
      </section>

      <section id="public-vs-private">
        <h2>Public vs private infrastructure fields</h2>
        <MethodologyMatrix
          caption="What providers typically publish vs keep private"
          columns={["Usually public", "Usually private"]}
          rows={[
            {
              label: "API endpoint shape",
              cells: [
                "Endpoint URL, model parameter format, payload schema.",
                "Internal routing / load-balancer topology.",
              ],
            },
            {
              label: "Pricing",
              cells: [
                "Per-token rates for current models; batch / cache schedule.",
                "Per-account tier pricing, enterprise discounts.",
              ],
            },
            {
              label: "Status",
              cells: [
                "Vendor-reported indicator on a status page or JSON feed.",
                "Per-region health, per-instance load.",
              ],
            },
            {
              label: "Regions",
              cells: [
                "Top-level cloud availability (Bedrock, Vertex catalogues).",
                "Per-region GPU allocation, traffic shaping.",
              ],
            },
            {
              label: "Rate limits",
              cells: [
                "Default tier limits (sometimes).",
                "Account-specific quotas, dynamic throttling thresholds.",
              ],
            },
            {
              label: "Architecture",
              cells: [
                "Model family + tokenizer sometimes.",
                "Parameter counts, training mix, fine-tune chain, serving stack.",
              ],
            },
          ]}
        />
      </section>

      <section id="what-we-do-not-know">
        <h2>What we do not know</h2>
        <p>
          The catalogue does not know provider internals: model
          architecture, parameter counts, training-set size, fine-tune
          chain, inference-stack details. None of these are documented
          consistently by the providers and none can be sourced
          end-to-end from a primary source today. We do not estimate.
        </p>
        <p>
          We also do not record GPU type, hardware generation, or
          serving topology. Those are interesting operational facts
          but they belong to the provider&apos;s deployment
          environment, not to the public-facing model.
        </p>
      </section>

      <section id="roadmap">
        <h2>Data roadmap</h2>
        <p>
          The next infrastructure-side data we expect to verify, in
          rough order of effort:
        </p>
        <ol>
          <li>
            <strong>Independent HTTP probes for more providers.</strong>{" "}
            Anthropic has one today; Google, DeepSeek, Mistral, OpenAI
            could each be onboarded with the same probe pattern (host
            root, no inference, no key).
          </li>
          <li>
            <strong>Durable storage for observations.</strong> The KV
            adapter is wired and idle; once credentials are set on
            production, the uptime gate at{" "}
            <Link
              href="/research/ai-provider-status-monitoring#sample-threshold"
              className="text-primary hover:underline"
            >
              the sample threshold
            </Link>{" "}
            becomes reachable.
          </li>
          <li>
            <strong>Regional availability.</strong> Bedrock and Vertex
            model-availability matrices are the highest-value structured
            input; both have stable docs surfaces.
          </li>
        </ol>
      </section>
    </ContentPageShell>
  );
}
