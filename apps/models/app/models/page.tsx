import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { ModelBadge } from "@/components/ModelBadge";
import { JsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import {
  buildMetadata,
  breadcrumbJsonLd,
  datasetJsonLd,
} from "@/lib/seo";
import { isFilteredRoute, robotsMetadata } from "@/lib/should-index";
import { siteConfig } from "@/lib/site-config";
import { models } from "@/data/models";
import { providers, getProviderBySlug } from "@/data/providers";
import { hostedPricing } from "@/data/hosted-pricing";
import { getReverificationQueue } from "@/lib/reverification";
import { isVerified } from "@/lib/verified";
import type {
  LifecycleStatus,
  ModalityChannel,
  VerificationStatus,
} from "@/lib/types";

type SearchParams = Record<string, string | string[] | undefined>;

interface PageProps {
  searchParams: Promise<SearchParams>;
}

const VERIFICATION_OPTIONS: { value: VerificationStatus; label: string }[] = [
  { value: "verified", label: "Verified" },
  { value: "partial", label: "Partially verified" },
  { value: "unverified", label: "Unverified" },
];

const LIFECYCLE_OPTIONS: { value: LifecycleStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "preview", label: "Preview" },
  { value: "deprecated", label: "Deprecated" },
  { value: "retired", label: "Retired" },
];

const MODALITY_OPTIONS: { value: ModalityChannel | "text" | "image" | "audio" | "video"; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "image", label: "Image" },
  { value: "audio", label: "Audio" },
  { value: "video", label: "Video" },
];

function readParam(
  searchParams: SearchParams,
  key: string
): string | undefined {
  const v = searchParams[key];
  if (typeof v === "string" && v.trim().length > 0) return v.trim();
  return undefined;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const filtered = isFilteredRoute(params);
  return {
    ...buildMetadata({
      title: "AI Models",
      description:
        "Browse tracked AI models across Anthropic, Google, DeepSeek, Mistral, OpenAI, Meta, and more. Filter by provider, verification status, lifecycle, and modality.",
      path: "/models",
    }),
    robots: robotsMetadata(!filtered),
  };
}

export default async function ModelsIndexPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const q = readParam(params, "q")?.toLowerCase();
  const providerFilter = readParam(params, "provider");
  const verificationFilter = readParam(params, "verification") as
    | VerificationStatus
    | undefined;
  const lifecycleFilter = readParam(params, "lifecycle") as
    | LifecycleStatus
    | undefined;
  const modalityFilter = readParam(params, "modality")?.toLowerCase();
  // Sprint 22: role filter — creator vs hosted-platform vs both
  const roleFilter = readParam(params, "role") as
    | "creator"
    | "hosted-platform"
    | "both"
    | undefined;

  const filtered = isFilteredRoute(params);

  // Pre-compute the set of provider slugs that bill at least one
  // hosted-pricing row (hosted platforms).
  const hostedPlatformSlugs = new Set(
    hostedPricing.map((r) => r.billingProviderSlug)
  );
  // Provider slugs that create at least one tracked model.
  const creatorSlugs = new Set(models.map((m) => m.providerSlug));

  const results = models.filter((m) => {
    if (q) {
      const haystack =
        `${m.name} ${m.slug} ${m.description ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (roleFilter) {
      const isCreator = creatorSlugs.has(m.providerSlug);
      const isHosted = hostedPlatformSlugs.has(m.providerSlug);
      if (roleFilter === "creator" && !(isCreator && !isHosted)) return false;
      if (roleFilter === "hosted-platform" && !isHosted) return false;
      if (roleFilter === "both" && !(isCreator && isHosted)) return false;
    }
    if (providerFilter && m.providerSlug !== providerFilter) return false;
    if (
      verificationFilter &&
      m.verificationStatus !== verificationFilter
    ) {
      return false;
    }
    if (lifecycleFilter) {
      if (!isVerified(m.lifecycle)) return false;
      if (m.lifecycle.value.status !== lifecycleFilter) return false;
    }
    if (modalityFilter) {
      if (!isVerified(m.modality)) return false;
      const found = m.modality.value.some((ch) =>
        ch.toLowerCase().includes(modalityFilter)
      );
      if (!found) return false;
    }
    return true;
  });

  return (
    <PageShell
      eyebrow="Catalogue"
      title="AI Models"
      intro="Structured catalogue of AI models with provider attribution, verification status, and links to deeper intelligence. Unknown metrics are explicitly marked as not yet verified."
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Models", href: "/models" },
        ]}
      />

      {(() => {
        const verifiedCount = models.filter(
          (m) => m.verificationStatus === "verified"
        ).length;
        const partialCount = models.filter(
          (m) => m.verificationStatus === "partial"
        ).length;
        const activeCount = models.filter((m) => {
          if (!isVerified(m.lifecycle)) return true;
          return m.lifecycle.value.status === "active";
        }).length;
        const historicalCount = models.filter((m) => {
          if (!isVerified(m.lifecycle)) return false;
          return (
            m.lifecycle.value.status === "retired" ||
            m.lifecycle.value.status === "deprecated"
          );
        }).length;
        const hostedSlugs = new Set(hostedPricing.map((r) => r.modelSlug));
        const modelsWithHosted = models.filter((m) =>
          hostedSlugs.has(m.slug)
        ).length;
        const reviewQueue = getReverificationQueue();
        const reviewModelSlugs = new Set(
          reviewQueue
            .filter(
              (q) =>
                q.entityType === "model" ||
                q.entityType === "pricing" ||
                q.entityType === "hosted_pricing"
            )
            .map((q) => q.entitySlug)
            .filter((s): s is string => Boolean(s))
        );
        const dueForReview = models.filter((m) =>
          reviewModelSlugs.has(m.slug)
        ).length;
        const cards: { label: string; value: number; href: string }[] = [
          { label: "Verified", value: verifiedCount, href: "/models?verification=verified" },
          { label: "Partially verified", value: partialCount, href: "/models?verification=partial" },
          { label: "Active", value: activeCount, href: "/models?lifecycle=active" },
          {
            label: "Historical / retired",
            value: historicalCount,
            href: "/models?lifecycle=retired",
          },
          {
            label: "With hosted availability",
            value: modelsWithHosted,
            href: "/pricing",
          },
          {
            label: "Due for review",
            value: dueForReview,
            href: "/reverification?entityType=pricing",
          },
        ];
        return (
          <section
            aria-label="Models discovery summary"
            className="space-y-3"
          >
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              {cards.map((card) => (
                <li key={card.label}>
                  <Link
                    href={card.href}
                    className="card-surface block p-3 transition hover:border-primary/30 hover:shadow-elevated"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {card.label}
                    </p>
                    <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
                      {card.value}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              Cross-references:{" "}
              <Link
                href="/intelligence"
                className="text-primary hover:underline"
              >
                /intelligence
              </Link>
              {" · "}
              <Link
                href="/coverage"
                className="text-primary hover:underline"
              >
                /coverage
              </Link>
              {" · "}
              <Link
                href="/sources"
                className="text-primary hover:underline"
              >
                /sources
              </Link>
              {" · "}
              <Link
                href="/reverification?entityType=model"
                className="text-primary hover:underline"
              >
                /reverification (models)
              </Link>
              .
            </p>
          </section>
        );
      })()}

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Models", href: "/models" },
          ]),
          datasetJsonLd({
            name: `${siteConfig.name} — Models`,
            description: "Catalogue of AI models tracked by WebmasterID Models.",
            path: "/models",
            dateModified: siteConfig.buildDate,
          }),
        ]}
      />

      <form
        method="get"
        action="/models"
        aria-label="Filter and search models"
        className="card-surface p-4"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">Search</span>
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Filter by model name…"
              aria-label="Search models"
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">Provider</span>
            <select
              name="provider"
              defaultValue={providerFilter ?? ""}
              aria-label="Filter by provider"
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">All providers</option>
              {providers.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">
              Verification
            </span>
            <select
              name="verification"
              defaultValue={verificationFilter ?? ""}
              aria-label="Filter by verification status"
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">Any status</option>
              {VERIFICATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">Lifecycle</span>
            <select
              name="lifecycle"
              defaultValue={lifecycleFilter ?? ""}
              aria-label="Filter by lifecycle status"
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">Any lifecycle</option>
              {LIFECYCLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="block font-medium text-foreground">Modality</span>
            <select
              name="modality"
              defaultValue={modalityFilter ?? ""}
              aria-label="Filter by modality"
              className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="">Any modality</option>
              {MODALITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <button
            type="submit"
            className="inline-flex h-8 items-center rounded-lg border border-primary/30 bg-primary/10 px-3 font-medium text-primary hover:bg-primary/15"
          >
            Apply filters
          </button>
          {filtered ? (
            <Link href="/models" className="text-primary hover:underline">
              Reset
            </Link>
          ) : null}
          <span>
            {results.length} model{results.length === 1 ? "" : "s"}
            {filtered ? " match the current filters" : " in the catalogue"}.
          </span>
        </div>
      </form>

      <section aria-label="Models">
        {results.length === 0 ? (
          <div className="card-surface p-5 text-sm text-muted-foreground">
            <p>
              No models match the current filters. Try{" "}
              <Link href="/models" className="text-primary hover:underline">
                resetting
              </Link>{" "}
              or removing one of: search query, provider, verification,
              lifecycle, modality.
            </p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((m) => {
              const p = getProviderBySlug(m.providerSlug);
              return (
                <li key={m.slug}>
                  <ModelBadge model={m} providerName={p?.name ?? "Unknown"} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <aside className="card-surface p-5 text-sm text-muted-foreground">
        <p>
          Need a side-by-side view? See{" "}
          <Link href="/compare" className="text-primary hover:underline">
            Compare
          </Link>
          , or browse{" "}
          <Link href="/providers" className="text-primary hover:underline">
            Providers
          </Link>{" "}
          to scope by lab. Filtered URLs on this hub are{" "}
          <code className="rounded bg-muted px-1">noindex, follow</code> so the
          canonical{" "}
          <Link href="/models" className="text-primary hover:underline">
            /models
          </Link>{" "}
          remains the indexed catalogue.
        </p>
      </aside>

      <aside
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="How to read this catalogue"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          How to read this catalogue
        </p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          <li>
            <Link
              href="/docs/model-page-schema"
              className="text-primary hover:underline"
            >
              Model page schema
            </Link>{" "}
            — every field on a model record.
          </li>
          <li>
            <Link
              href="/docs/pricing-fields"
              className="text-primary hover:underline"
            >
              Pricing fields
            </Link>{" "}
            — what each pricing unit means.
          </li>
          <li>
            <Link
              href="/research/model-selection"
              className="text-primary hover:underline"
            >
              Model selection
            </Link>{" "}
            — a verified-data approach to choosing.
          </li>
          <li>
            <Link
              href="/research/model-context-windows"
              className="text-primary hover:underline"
            >
              Context windows in practice
            </Link>
            .
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
