import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { ProviderLogo } from "@/components/ProviderLogo";
import { VerificationBadge } from "@/components/VerificationBadge";
import { DataNotVerified } from "@/components/DataNotVerified";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { providers, getProviderBySlug } from "@/data/providers";
import { models } from "@/data/models";
import { verificationAttempts } from "@/data/verification-attempts";
import { isVerified } from "@/lib/verified";
import { formatDateISO } from "@/lib/utils";
import {
  getEntityCoverageSummary,
  getStatusObserverForProvider,
} from "@/lib/entity-graph";
import {
  isStatusStorageConfigured,
  MINIMUM_OBSERVATIONS_FOR_UPTIME,
} from "@/lib/status-store";

export const metadata: Metadata = buildMetadata({
  title: "Coverage",
  description:
    "Verification coverage by provider: what has been verified, what has been attempted but blocked, and what is still pending a primary-source review.",
  path: "/coverage",
});

const ATTEMPT_TONE: Record<string, string> = {
  verified: "border-success/30 bg-success/10 text-success",
  reviewable: "border-primary/30 bg-primary/10 text-primary",
  "blocked-403":
    "border-warning/30 bg-warning/10 text-warning",
  "blocked-401":
    "border-warning/30 bg-warning/10 text-warning",
  "blocked-429":
    "border-warning/30 bg-warning/10 text-warning",
  "not-found-404":
    "border-muted-foreground/30 bg-muted text-muted-foreground",
  "redirect-loop":
    "border-muted-foreground/30 bg-muted text-muted-foreground",
  "requires-manual-browser":
    "border-muted-foreground/30 bg-muted text-muted-foreground",
};

const ATTEMPT_LABEL: Record<string, string> = {
  verified: "Verified",
  reviewable: "Reviewed",
  "blocked-403": "Blocked (403)",
  "blocked-401": "Blocked (401)",
  "blocked-429": "Blocked (429)",
  "not-found-404": "404",
  "redirect-loop": "Redirect loop",
  "requires-manual-browser": "Manual browser only",
};

export default function CoveragePage() {
  const summary = getEntityCoverageSummary();
  const summaryCards: { label: string; value: number; href?: string }[] = [
    {
      label: "Verified models",
      value: summary.verifiedModels,
      href: "/models?verification=verified",
    },
    {
      label: "Partially verified models",
      value: summary.partiallyVerifiedModels,
      href: "/models?verification=partial",
    },
    {
      label: "Retired / historical models",
      value: summary.retiredOrHistoricalModels,
      href: "/models?lifecycle=retired",
    },
    {
      label: "Verified providers",
      value: summary.verifiedProviders,
      href: "/providers",
    },
    {
      label: "Providers with status observer",
      value: summary.providersWithStatusObserver,
      href: "/status",
    },
    {
      label: "Verified pricing rows",
      value: summary.verifiedPricingRows,
      href: "/pricing?status=verified",
    },
    {
      label: "Indexed comparisons",
      value: summary.twoSidedVerifiedComparisons,
      href: "/compare?indexable=yes",
    },
    {
      label: "Noindex comparisons",
      value:
        summary.oneSidedVerifiedComparisons + summary.pendingComparisons,
      href: "/compare?indexable=no",
    },
  ];

  return (
    <PageShell
      eyebrow="Transparency"
      title="Coverage"
      intro="Verification state across the entity graph. This page reports exactly what has been verified against primary sources, what has been attempted but blocked, and what is still pending. There is no fabricated coverage here — if a field is unverified, this page says so."
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Coverage", href: "/coverage" },
        ]}
      />

      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Coverage", href: "/coverage" },
        ])}
      />

      <section
        aria-label="Entity graph summary"
        className="space-y-3"
      >
        <SectionHeader
          eyebrow="At a glance"
          title="Entity graph summary"
          description="Counts derived from the typed local data layer. Cards link into the corresponding filtered hub view (filtered URLs are noindex, follow)."
          as="h2"
        />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => {
            const inner = (
              <>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {card.label}
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                  {card.value}
                </p>
              </>
            );
            return (
              <li key={card.label}>
                {card.href ? (
                  <Link
                    href={card.href}
                    className="card-surface block p-4 transition hover:border-primary/30 hover:shadow-elevated"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className="card-surface p-4">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-label="Per-provider coverage" className="space-y-3">
        <SectionHeader
          eyebrow="By provider"
          title="Per-provider verification"
          as="h2"
        />
        <ul className="grid gap-3 sm:grid-cols-2">
          {providers.map((p) => {
            const providerModels = models.filter(
              (m) => m.providerSlug === p.slug
            );
            const verifiedModels = providerModels.filter(
              (m) => m.verificationStatus === "verified"
            );
            const verifiedPricingRows = providerModels.flatMap((m) =>
              m.pricing.filter((t) => isVerified(t.amount))
            );
            return (
              <li
                key={p.slug}
                className="card-surface flex flex-col gap-3 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ProviderLogo slug={p.slug} name={p.name} />
                    <div>
                      <Link
                        href={`/providers/${p.slug}`}
                        className="text-sm font-semibold text-foreground hover:underline"
                      >
                        {p.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        Last checked:{" "}
                        {p.lastCheckedAt
                          ? formatDateISO(p.lastCheckedAt)
                          : "not yet"}
                      </p>
                    </div>
                  </div>
                  <VerificationBadge status={p.verificationStatus} />
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-border bg-background/40 p-3">
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                      Models verified
                    </dt>
                    <dd className="mt-1 font-semibold tabular-nums text-foreground">
                      {verifiedModels.length}
                      <span className="text-xs font-normal text-muted-foreground">
                        {" / "}
                        {providerModels.length} tracked
                      </span>
                    </dd>
                  </div>
                  <div className="rounded-lg border border-border bg-background/40 p-3">
                    <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                      Verified pricing rows
                    </dt>
                    <dd className="mt-1 font-semibold tabular-nums text-foreground">
                      {verifiedPricingRows.length}
                    </dd>
                  </div>
                </dl>
                <p className="text-xs text-muted-foreground">
                  {p.notes ?? "No coverage notes recorded for this provider yet."}
                </p>
                {(() => {
                  const observer = getStatusObserverForProvider(p.slug);
                  if (!observer) return null;
                  return (
                    <p className="text-xs">
                      <Link
                        href={`/api/status/${p.slug}`}
                        prefetch={false}
                        className="text-primary hover:underline"
                      >
                        Vendor-status observation API →
                      </Link>
                    </p>
                  );
                })()}
              </li>
            );
          })}
        </ul>
      </section>

      <section
        aria-label="Status observation coverage"
        className="card-surface p-5 text-sm"
      >
        <h2 className="text-base font-semibold text-foreground">
          Status observation coverage
        </h2>
        <ul className="mt-3 space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">
              Anthropic vendor-status observer:
            </strong>{" "}
            enabled. Reads the Statuspage JSON feed at{" "}
            <Link
              href="https://status.anthropic.com"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              status.anthropic.com
            </Link>
            ; surfaced live at{" "}
            <Link
              href="/api/status/anthropic"
              className="text-primary hover:underline"
              prefetch={false}
            >
              /api/status/anthropic
            </Link>
            .
          </li>
          <li>
            <strong className="text-foreground">
              Independent HTTP probe:
            </strong>{" "}
            not enabled for any provider. Vendor-reported status is not
            independent monitoring.
          </li>
          <li>
            <strong className="text-foreground">Uptime percentage:</strong>{" "}
            not computed. WebmasterID does not publish an uptime %
            without durable observations over a meaningful window.
          </li>
          <li>
            <strong className="text-foreground">Cron:</strong> hourly via
            Vercel Cron against{" "}
            <code className="rounded bg-muted px-1">/api/cron/status</code>;
            bearer-token-guarded in production.
          </li>
          <li>
            <strong className="text-foreground">Durable storage:</strong>{" "}
            {isStatusStorageConfigured() ? (
              <span>configured.</span>
            ) : (
              <span>not configured on this deployment.</span>
            )}{" "}
            Observations are persisted via{" "}
            <code className="rounded bg-muted px-1">KV_REST_API_URL</code>
            {" / "}
            <code className="rounded bg-muted px-1">KV_REST_API_TOKEN</code>
            ; when unset, the cron logs{" "}
            <code className="rounded bg-muted px-1">skipped_no_store</code>{" "}
            and nothing is written.
          </li>
          <li>
            <strong className="text-foreground">Read endpoints:</strong>{" "}
            <Link
              href="/api/status/anthropic/latest"
              prefetch={false}
              className="text-primary hover:underline"
            >
              /api/status/anthropic/latest
            </Link>{" "}
            and{" "}
            <Link
              href="/api/status/anthropic/window?hours=24"
              prefetch={false}
              className="text-primary hover:underline"
            >
              /api/status/anthropic/window?hours=24
            </Link>
            .
          </li>
          <li>
            <strong className="text-foreground">
              Uptime window eligibility:
            </strong>{" "}
            not yet. Requires at least{" "}
            {MINIMUM_OBSERVATIONS_FOR_UPTIME} stored observations in the
            window before any uptime-shaped number is exposed by the
            window endpoint. The /status page itself does not display
            this number.
          </li>
        </ul>
      </section>

      <section
        aria-label="Sprint 8B verification summary"
        className="card-surface p-5 text-sm"
      >
        <h2 className="text-base font-semibold text-foreground">
          Sprint 8B — DeepSeek &amp; Mistral verification summary
        </h2>
        <ul className="mt-3 space-y-2 text-muted-foreground">
          <li>
            <strong className="text-foreground">DeepSeek V4 Pro</strong>: API
            string, lifecycle, context window, input cache-miss, input
            cache-hit, and output pricing verified end-to-end against
            DeepSeek&apos;s Models &amp; Pricing page and chat-completions
            API reference. Re-verified on 2026-05-21 — values unchanged.
            The 75% promotional discount on{" "}
            <code className="rounded bg-muted px-1">deepseek-v4-pro</code>{" "}
            is still active until 2026/05/31 15:59 UTC; the regular rate
            is recorded as the durable value.
          </li>
          <li>
            <strong className="text-foreground">DeepSeek R1 (historical)</strong>:
            kept as a historical record anchored to the R1-0528 release
            announcement. The R1 family is no longer in the current API
            model parameter list, so the entry is recorded as{" "}
            <em>retired</em> with{" "}
            <code className="rounded bg-muted px-1">deepseek-v4-pro</code>{" "}
            as the documented migration target.
          </li>
          <li>
            <strong className="text-foreground">Mistral Large 3</strong>:
            API string and lifecycle verified from Mistral&apos;s models
            overview and table. Per-model spec card pages still 404 to
            automated retrieval; the API pricing tab on
            mistral.ai/pricing is still JS-driven. Pricing, context
            window, max output, and modality remain unverified pending a
            manual browser pass.
          </li>
          <li>
            <strong className="text-foreground">Mistral Large 2</strong>:
            Sprint 8B&apos;s preferred target is documented in Mistral&apos;s
            Legacy/Deprecated table as deprecated 2024-11-30 and retired
            2025-03-30 — already retired today. The catalogue carries it
            as a historical entry; new workloads should evaluate Mistral
            Large 3.
          </li>
          <li>
            <strong className="text-foreground">Gemini cache pricing</strong>:
            the schema keeps Google&apos;s per-hour cache storage rate (
            <code className="rounded bg-muted px-1">1M cache storage / hour</code>
            ) distinct from Anthropic&apos;s TTL-write rates. We do not
            map one provider&apos;s cache semantics into another&apos;s.
          </li>
        </ul>
      </section>

      <section aria-label="Retrieval attempts" className="space-y-3">
        <SectionHeader
          eyebrow="Audit log"
          title="Primary-source retrieval attempts"
          description="Every URL targeted during a verification pass, the outcome, and a free-text note. This is what makes the platform auditable."
          as="h2"
        />
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2 text-left">
                  Provider
                </th>
                <th scope="col" className="px-4 py-2 text-left">
                  Target
                </th>
                <th scope="col" className="px-4 py-2 text-left">
                  URL
                </th>
                <th scope="col" className="px-4 py-2 text-left">
                  Attempted
                </th>
                <th scope="col" className="px-4 py-2 text-left">
                  Result
                </th>
              </tr>
            </thead>
            <tbody className="bg-card">
              {verificationAttempts.map((a) => {
                const p = getProviderBySlug(a.providerSlug);
                const tone =
                  ATTEMPT_TONE[a.result] ??
                  "border-muted-foreground/30 bg-muted text-muted-foreground";
                const label = ATTEMPT_LABEL[a.result] ?? a.result;
                return (
                  <tr key={`${a.url}-${a.attemptedAt}`} className="border-t border-border">
                    <th
                      scope="row"
                      className="px-4 py-2 text-left font-medium text-foreground"
                    >
                      {p ? (
                        <Link
                          href={`/providers/${p.slug}`}
                          className="hover:underline"
                        >
                          {p.name}
                        </Link>
                      ) : (
                        a.providerSlug
                      )}
                    </th>
                    <td className="px-4 py-2 text-muted-foreground">
                      {a.target}
                    </td>
                    <td className="px-4 py-2">
                      <Link
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-xs text-primary hover:underline"
                      >
                        {a.url.replace(/^https?:\/\//, "")}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {formatDateISO(a.attemptedAt)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone}`}
                      >
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 rounded-full bg-current"
                        />
                        {label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label="What you will not find" className="card-surface p-5 text-sm text-muted-foreground">
        <h2 className="text-base font-semibold text-foreground">
          What you will not find on this site
        </h2>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>
            Benchmark leaderboards with scores. Scores are not republished
            without an independent primary-source reference.
          </li>
          <li>
            Estimated latency or uptime numbers. <DataNotVerified />{" "}
            renders in their place until an independent monitor is wired.
          </li>
          <li>
            Vendor-provided pricing where the vendor's documentation page
            could not be retrieved. The blocked entries above record
            exactly which pages.
          </li>
        </ul>
      </section>
    </PageShell>
  );
}
