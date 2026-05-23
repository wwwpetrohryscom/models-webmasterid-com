import type { Metadata } from "next";
import Link from "next/link";
import { ContentPageShell } from "@/components/ContentPageShell";
import { ProviderCoverageMatrix } from "@/components/content/ProviderCoverageMatrix";
import { buildMetadata } from "@/lib/seo";
import { getContentPage } from "@/lib/content";

const SLUG = "/docs/provider-coverage";

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
        { id: "shape", label: "ProviderEntity shape" },
        { id: "dimensions", label: "Coverage dimensions" },
        { id: "roles", label: "Model creator vs hosted platform" },
        { id: "availability-vs-pricing", label: "Hosted availability vs hosted pricing" },
        { id: "live-matrix", label: "Current provider coverage matrix" },
        { id: "status-meaning", label: "What 'verified' means at the provider level" },
        { id: "partial", label: "Partial verification" },
        { id: "blocked", label: "Blocked retrieval" },
      ]}
      relatedLinks={[
        {
          href: "/providers",
          label: "Providers",
          description: "Provider catalogue with per-provider verification badges.",
        },
        {
          href: "/coverage",
          label: "Coverage",
          description: "Per-provider verification matrix and retrieval audit log.",
        },
        {
          href: "/docs/data-verification",
          label: "Data verification",
          description: "Verification states the provider record can be in.",
        },
      ]}
    >
      <section id="shape">
        <h2>ProviderEntity shape</h2>
        <pre className="overflow-x-auto rounded-lg border border-border bg-background/60 p-3 text-[12px] leading-relaxed">
          {`interface ProviderEntity {
  id: string;
  slug: string;
  name: string;
  description: string;
  // documentation surface
  docsUrl?: string | null;
  apiDocsUrl?: string | null;
  pricingUrl?: string | null;
  modelCatalogueUrl?: string | null;
  statusPageUrl?: string | null;
  deprecationsUrl?: string | null;
  // verification
  verified: boolean;
  verificationStatus: 'verified' | 'partial' | 'unverified';
  lastCheckedAt: string | null;
  updatedDate: string | null;
  notes?: string | null;
  // operational
  headquarters?: string | null;
  website?: string | null;
}`}
        </pre>
        <p>
          A provider record is intentionally lean. The model entries
          attached to a provider carry the per-model pricing,
          lifecycle, modality, and benchmark fields; the provider
          record itself records the documentation surface and the
          overall verification status.
        </p>
      </section>

      <section id="dimensions">
        <h2>Coverage dimensions</h2>
        <p>
          Six URLs make up the provider surface, each one verified
          independently:
        </p>
        <ul>
          <li>
            <code className="rounded bg-muted px-1">docsUrl</code> — top
            level technical documentation.
          </li>
          <li>
            <code className="rounded bg-muted px-1">apiDocsUrl</code> —
            stable API reference URL (Messages, chat-completions, etc.).
          </li>
          <li>
            <code className="rounded bg-muted px-1">pricingUrl</code> —
            primary pricing reference.
          </li>
          <li>
            <code className="rounded bg-muted px-1">modelCatalogueUrl</code>{" "}
            — the page listing the provider&apos;s current models.
          </li>
          <li>
            <code className="rounded bg-muted px-1">statusPageUrl</code>{" "}
            — public status page (used by the status pipeline; not an
            uptime claim).
          </li>
          <li>
            <code className="rounded bg-muted px-1">deprecationsUrl</code>{" "}
            — official deprecation schedule, where the vendor publishes
            one.
          </li>
        </ul>
      </section>

      <section id="roles">
        <h2>Model creator vs hosted platform</h2>
        <p>
          Providers fall into one of two roles:
        </p>
        <ul>
          <li>
            <strong>Model creator.</strong> The organisation that trains
            and releases the model. Anthropic (Claude), Google (Gemini),
            DeepSeek (DeepSeek V4 Pro), Mistral (Mistral Large 3), and
            Meta (Llama 4 Scout / Maverick) are model creators. The
            model record&apos;s{" "}
            <code className="rounded bg-muted px-1">providerSlug</code>{" "}
            always points at the creator.
          </li>
          <li>
            <strong>Hosted platform.</strong> An inference provider that
            does not create models but charges for running third-party
            ones. Groq and Together AI are hosted platforms. The
            catalogue intentionally does not carry per-model records
            under <code className="rounded bg-muted px-1">providerSlug: &quot;groq&quot;</code>{" "}
            or{" "}
            <code className="rounded bg-muted px-1">
              providerSlug: &quot;together-ai&quot;
            </code>{" "}
            — that would misattribute the model&apos;s origin. Pricing
            offered by these platforms lives in{" "}
            <code className="rounded bg-muted px-1">
              data/hosted-pricing.ts
            </code>{" "}
            and carries{" "}
            <code className="rounded bg-muted px-1">
              pricingContext: &quot;hosted_provider_api&quot;
            </code>
            .
          </li>
        </ul>
        <p>
          Both roles can be{" "}
          <code className="rounded bg-muted px-1">verified</code> — the
          verification is about whether the platform&apos;s primary
          documentation is reachable and has been used to populate the
          records that depend on it, not about whether the platform
          creates models.
        </p>
      </section>

      <section id="availability-vs-pricing">
        <h2>Hosted availability vs hosted pricing</h2>
        <p>
          For hosted-platform providers, the catalogue separates two
          claims: (1) <em>availability</em> — the platform exposes the
          model under a specific hosted model ID, and (2){" "}
          <em>pricing</em> — the per-token rate the platform charges.
          Availability is stable; pricing is volatile and reference-
          only. The provider page renders both, but they are not
          coupled: an availability row can render even if its
          associated pricing row goes stale.
        </p>
        <p>
          The reverse also holds — a model creator&apos;s provider page
          surfaces &quot;third-party hosting of our models&quot; from
          the availability catalogue, distinct from any first-party
          pricing the creator may publish. Meta&apos;s provider page is
          the worked example: Llama 4 Scout has no Meta first-party
          API pricing, but availability on Groq is recorded and
          rendered. See{" "}
          <Link
            href="/research/api-pricing-methodology#availability-vs-pricing"
            className="text-primary hover:underline"
          >
            /research/api-pricing-methodology
          </Link>
          .
        </p>
      </section>

      <section id="live-matrix">
        <h2>Current provider coverage matrix</h2>
        <p>
          Derived from the data layer at render time:
        </p>
        <ProviderCoverageMatrix />
      </section>

      <section id="status-meaning">
        <h2>What &quot;verified&quot; means at the provider level</h2>
        <p>
          A provider is marked{" "}
          <code className="rounded bg-muted px-1">verified</code> when
          its primary documentation surfaces (docs, API reference,
          pricing reference) have been successfully retrieved and used
          to populate at least one verified model record. Anthropic,
          Google, and DeepSeek are{" "}
          <code className="rounded bg-muted px-1">verified</code> by
          this definition today. The provider&apos;s{" "}
          <code className="rounded bg-muted px-1">notes</code> field
          records the date, the citation tokens used, and the scope of
          what was verified.
        </p>
      </section>

      <section id="partial">
        <h2>Partial verification</h2>
        <p>
          A provider is marked{" "}
          <code className="rounded bg-muted px-1">partial</code> when
          its primary URLs are reachable but some model-record fields
          remain null. Mistral is the canonical example: the models
          overview and API reference were retrieved, but per-model
          spec card pages return 404, so context window / max output /
          modality / pricing on the Large 3 record remain unverified.
          The provider notes spell out the specific gap and the
          unblock (a manual browser pass).
        </p>
      </section>

      <section id="blocked">
        <h2>Blocked retrieval</h2>
        <p>
          When a provider&apos;s primary URLs cannot be retrieved
          (HTTP 403, JS-only rendering, redirect loop), each blocked
          attempt is recorded in{" "}
          <code className="rounded bg-muted px-1">
            verification-attempts.ts
          </code>{" "}
          with URL, date, outcome category, and a free-text note. The
          provider record carries{" "}
          <code className="rounded bg-muted px-1">verified: false</code>{" "}
          and{" "}
          <code className="rounded bg-muted px-1">
            verificationStatus: &quot;partial&quot;
          </code>{" "}
          until the gap closes. OpenAI is the current example —{" "}
          <code className="rounded bg-muted px-1">platform.openai.com</code>{" "}
          returns 403 to automated retrieval and the attempt log shows
          every URL that was tried. Audit log is on{" "}
          <Link href="/coverage" className="text-primary hover:underline">
            /coverage
          </Link>
          .
        </p>
      </section>
    </ContentPageShell>
  );
}
