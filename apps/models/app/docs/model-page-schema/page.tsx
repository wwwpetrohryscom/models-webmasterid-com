import type { Metadata } from "next";
import Link from "next/link";
import { ContentPageShell } from "@/components/ContentPageShell";
import { FieldDefinitionTable } from "@/components/content/FieldDefinitionTable";
import { buildMetadata } from "@/lib/seo";
import { getContentPage } from "@/lib/content";

const SLUG = "/docs/model-page-schema";

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
        { id: "fields-table", label: "Field reference" },
        { id: "shape", label: "ModelEntity shape" },
        { id: "identifiers", label: "API identifiers" },
        { id: "lifecycle", label: "Lifecycle and snapshot" },
        { id: "capability", label: "Modality, context, output, features" },
        { id: "pricing", label: "Pricing tiers" },
        { id: "infrastructure", label: "Infrastructure fields" },
        { id: "benchmarks", label: "Benchmarks" },
        { id: "citations", label: "Source trail" },
        { id: "jsonld", label: "JSON-LD rules" },
      ]}
      relatedLinks={[
        {
          href: "/models",
          label: "Models",
          description: "Live filtered model catalogue.",
        },
        {
          href: "/docs/pricing-fields",
          label: "Pricing fields",
          description: "PricingUnit reference.",
        },
        {
          href: "/docs/data-verification",
          label: "Data verification",
          description: "Verification rules every field must satisfy.",
        },
      ]}
    >
      <section id="fields-table">
        <h2>Field reference</h2>
        <FieldDefinitionTable
          caption="ModelEntity field reference"
          identifierHeader="Field"
          rows={[
            {
              identifier: "id",
              definition: "Stable internal record id.",
            },
            {
              identifier: "slug",
              definition: "URL slug used in /models/<slug>.",
              rule: "Once shipped, never renamed.",
            },
            {
              identifier: "providerSlug",
              definition: "Foreign key into providers.",
            },
            {
              identifier: "apiIdentifiers",
              definition:
                "MaybeVerified<{canonical, alias?, bedrock?, vertex?, other?}>",
              rule: "Canonical is the pinned snapshot; alias is the rolling pointer.",
            },
            {
              identifier: "lifecycle",
              definition:
                "MaybeVerified<{status, retirementDate?, migrationTarget?}>",
              rule: "Drives /models?lifecycle= filter and the lifecycle badge.",
            },
            {
              identifier: "contextWindow",
              definition: "MaybeVerified<number> input token limit.",
            },
            {
              identifier: "maxOutputTokens",
              definition: "MaybeVerified<number> output token limit.",
            },
            {
              identifier: "modality",
              definition: "MaybeVerified<ModalityChannel[]>",
              rule: "Input + output channels tracked separately.",
            },
            {
              identifier: "features",
              definition:
                "MaybeVerified<{extendedThinking, adaptiveThinking, priorityTier, visionInput, toolUse}>",
            },
            {
              identifier: "pricing",
              definition: "VerifiedPricingTier[] — see /docs/pricing-fields.",
              rule: "Every row with a verified amount carries a citation.",
            },
            {
              identifier: "benchmarks",
              definition: "VerifiedBenchmarkScore[]",
              rule: "Empty across every model today. No scores published.",
            },
            {
              identifier: "infrastructure",
              definition:
                "{regions, avgLatencyMs, uptimePercent} — all MaybeVerified.",
              rule: "All null today. No fabricated latency/uptime/regions.",
            },
            {
              identifier: "citations",
              definition: "Deduplicated union of every citation referenced by verified fields.",
            },
          ]}
        />
      </section>

      <section id="shape">
        <h2>ModelEntity shape</h2>
        <pre className="overflow-x-auto rounded-lg border border-border bg-background/60 p-3 text-[12px] leading-relaxed">
          {`interface ModelEntity {
  id: string;
  slug: string;
  name: string;
  description: string;
  providerSlug: string;
  verified: boolean;
  verificationStatus: 'verified' | 'partial' | 'unverified';
  lastCheckedAt: string | null;
  updatedDate: string | null;

  apiIdentifiers: MaybeVerified<ModelApiIdentifiers>;
  releaseDate: MaybeVerified<string>;
  snapshotDate: MaybeVerified<string>;
  knowledgeCutoff: MaybeVerified<ModelKnowledgeCutoff>;
  contextWindow: MaybeVerified<number>;
  maxOutputTokens: MaybeVerified<number>;
  modality: MaybeVerified<ModalityChannel[]>;
  features: MaybeVerified<ModelFeatures>;
  lifecycle: MaybeVerified<ModelLifecycle>;

  pricing: VerifiedPricingTier[];
  benchmarks: VerifiedBenchmarkScore[];
  infrastructure: ModelInfrastructure;

  citations: SourceCitation[];
}`}
        </pre>
      </section>

      <section id="identifiers">
        <h2>API identifiers</h2>
        <p>
          The{" "}
          <code className="rounded bg-muted px-1">apiIdentifiers</code>{" "}
          field records:
        </p>
        <ul>
          <li>
            <code className="rounded bg-muted px-1">canonical</code> — the
            pinned snapshot ID (e.g.{" "}
            <code className="rounded bg-muted px-1">
              claude-opus-4-20250514
            </code>
            ).
          </li>
          <li>
            <code className="rounded bg-muted px-1">alias</code> — the
            rolling alias the provider promotes for general use (e.g.{" "}
            <code className="rounded bg-muted px-1">claude-opus-4-0</code>
            ). Aliases resolve to different snapshots over time and
            should not be used as a stable identifier in benchmarks.
          </li>
          <li>
            <code className="rounded bg-muted px-1">bedrock</code> /{" "}
            <code className="rounded bg-muted px-1">vertex</code> —
            platform-specific IDs where the model is also served via
            Amazon Bedrock or Google Vertex AI.
          </li>
          <li>
            <code className="rounded bg-muted px-1">other</code> — array
            of{" "}
            <code className="rounded bg-muted px-1">
              {`{ platform, id }`}
            </code>{" "}
            for any additional inference platforms.
          </li>
        </ul>
      </section>

      <section id="lifecycle">
        <h2>Lifecycle and snapshot</h2>
        <p>
          <code className="rounded bg-muted px-1">snapshotDate</code> is
          the date encoded in the pinned canonical identifier (e.g.{" "}
          <code className="rounded bg-muted px-1">2025-05-14</code> for{" "}
          <code className="rounded bg-muted px-1">
            claude-opus-4-20250514
          </code>
          ). It is distinct from{" "}
          <code className="rounded bg-muted px-1">releaseDate</code>{" "}
          (public-release date) — the catalogue records snapshot
          dates from canonical IDs and leaves release date null unless
          the vendor publishes a separate public-release record.
        </p>
        <p>
          <code className="rounded bg-muted px-1">lifecycle</code> is an
          object with{" "}
          <code className="rounded bg-muted px-1">status</code>{" "}
          (active / preview / deprecated / retired), optional{" "}
          <code className="rounded bg-muted px-1">retirementDate</code>,
          and optional{" "}
          <code className="rounded bg-muted px-1">migrationTarget</code>{" "}
          (slug of the recommended successor). The /models filter
          surfaces this directly.
        </p>
      </section>

      <section id="capability">
        <h2>Modality, context, output, features</h2>
        <ul>
          <li>
            <code className="rounded bg-muted px-1">modality</code> —
            array of{" "}
            <code className="rounded bg-muted px-1">ModalityChannel</code>{" "}
            values:{" "}
            <code className="rounded bg-muted px-1">text-in</code>,{" "}
            <code className="rounded bg-muted px-1">image-in</code>,{" "}
            <code className="rounded bg-muted px-1">audio-in</code>,{" "}
            <code className="rounded bg-muted px-1">video-in</code>,{" "}
            <code className="rounded bg-muted px-1">text-out</code>,{" "}
            <code className="rounded bg-muted px-1">image-out</code>,{" "}
            <code className="rounded bg-muted px-1">audio-out</code>.
            Input and output channels are tracked separately.
          </li>
          <li>
            <code className="rounded bg-muted px-1">contextWindow</code>{" "}
            — published max input tokens.
          </li>
          <li>
            <code className="rounded bg-muted px-1">maxOutputTokens</code>{" "}
            — published max output tokens in a single response.
          </li>
          <li>
            <code className="rounded bg-muted px-1">features</code> —{" "}
            object recording{" "}
            <code className="rounded bg-muted px-1">extendedThinking</code>,{" "}
            <code className="rounded bg-muted px-1">adaptiveThinking</code>,{" "}
            <code className="rounded bg-muted px-1">priorityTier</code>,{" "}
            <code className="rounded bg-muted px-1">visionInput</code>,{" "}
            <code className="rounded bg-muted px-1">toolUse</code>. Each
            flag is null when the vendor does not document the
            capability.
          </li>
        </ul>
      </section>

      <section id="pricing">
        <h2>Pricing tiers</h2>
        <p>
          The{" "}
          <code className="rounded bg-muted px-1">pricing</code> array
          carries one VerifiedPricingTier per pricing unit. See{" "}
          <Link
            href="/docs/pricing-fields"
            className="text-primary hover:underline"
          >
            pricing fields
          </Link>{" "}
          for the full enum and the validation rules.
        </p>
      </section>

      <section id="infrastructure">
        <h2>Infrastructure fields</h2>
        <p>
          <code className="rounded bg-muted px-1">infrastructure</code>{" "}
          is an object with three MaybeVerified slots:{" "}
          <code className="rounded bg-muted px-1">regions</code>,{" "}
          <code className="rounded bg-muted px-1">avgLatencyMs</code>,{" "}
          <code className="rounded bg-muted px-1">uptimePercent</code>.
          All three are null today across every model in the catalogue.
          See{" "}
          <Link
            href="/research/inference-infrastructure"
            className="text-primary hover:underline"
          >
            inference infrastructure
          </Link>{" "}
          for why.
        </p>
      </section>

      <section id="benchmarks">
        <h2>Benchmarks</h2>
        <p>
          The{" "}
          <code className="rounded bg-muted px-1">benchmarks</code>{" "}
          array on each model record is empty today; no per-model
          scores are published. The benchmark structural catalogue
          lives at{" "}
          <Link href="/benchmarks" className="text-primary hover:underline">
            /benchmarks
          </Link>{" "}
          and explains why.
        </p>
      </section>

      <section id="citations">
        <h2>Source trail</h2>
        <p>
          <code className="rounded bg-muted px-1">citations</code> is
          the deduplicated union of every citation referenced by any
          verified field on the record. Built once via the{" "}
          <code className="rounded bg-muted px-1">mergeCitations()</code>{" "}
          helper at module-load time. Model detail pages render the
          list as the &quot;Sources&quot; section.
        </p>
      </section>

      <section id="jsonld">
        <h2>JSON-LD rules</h2>
        <p>
          The model JSON-LD helper at{" "}
          <code className="rounded bg-muted px-1">
            lib/model-jsonld.ts
          </code>{" "}
          gates every metric behind{" "}
          <code className="rounded bg-muted px-1">isVerified()</code>.
          Unverified pricing, benchmark, latency, uptime, region, or
          features properties are never emitted. The integrity guard
          &quot;model-jsonld omits benchmark / latency / uptime fields
          entirely&quot; refuses the build if a banned property
          assignment appears in the helper.
        </p>
      </section>
    </ContentPageShell>
  );
}
