import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { VerificationBadge } from "@/components/VerificationBadge";
import { DecisionWorkflow } from "@/components/DecisionWorkflow";
import { breadcrumbJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import {
  freshnessClasses,
  freshnessLabel,
} from "@/lib/source-freshness";
import { getUseCaseShortlist } from "@/lib/model-shortlists";
import { comparisonBuilderUrl } from "@/lib/comparison-builder";
import type { ModelUseCase } from "@/lib/use-cases";
import { isVerified } from "@/lib/verified";

/**
 * Shared layout for a use-case detail page. Renders the hero + the
 * verified-fields + caution + shortlist + related-routes blocks so
 * each detail page only owns its narrative copy.
 */
export function UseCaseDetailLayout({
  useCase,
  narrative,
}: {
  useCase: ModelUseCase;
  narrative: React.ReactNode;
}) {
  const shortlist = getUseCaseShortlist(useCase.slug);

  return (
    <PageShell
      eyebrow="Use case"
      title={useCase.title}
      intro={useCase.description}
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Use cases", href: "/use-cases" },
          { name: useCase.title, href: useCase.route ?? "/use-cases" },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Use cases", href: "/use-cases" },
            {
              name: useCase.title,
              href: useCase.route ?? "/use-cases",
            },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "TechArticle",
            name: useCase.title,
            url: `${siteConfig.url}${useCase.route ?? "/use-cases"}`,
            description: useCase.description,
            dateModified: siteConfig.buildDate,
            isPartOf: { "@type": "WebSite", url: siteConfig.url },
          },
        ]}
      />

      <aside
        role="note"
        aria-label="Use-case caution"
        className="card-surface space-y-2 p-4 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          What this page is — and is not.
        </p>
        <p>{useCase.caution}</p>
        <p>
          This page does not declare a model{" "}
          <strong className="text-foreground">best for</strong> this use
          case. It surfaces verified fields and lets the reader screen
          their own shortlist.
        </p>
      </aside>

      <section
        aria-label="Verified fields used"
        className="card-surface space-y-2 p-4 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Verified fields used
        </p>
        <ul className="ml-5 list-disc space-y-1 text-muted-foreground">
          {useCase.verifiedFieldsUsed.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Use-case narrative"
        className="card-surface space-y-3 p-5 text-sm text-foreground"
      >
        {narrative}
      </section>

      <DecisionWorkflow variant="card" highlightStep={1} />

      <section aria-label="Shortlist" className="space-y-3">
        <SectionHeader
          eyebrow="Shortlist"
          title={`Shortlist for ${useCase.title.toLowerCase()} (${shortlist.length})`}
          description="Generated from the typed local data layer. Shortlist order: verified field count → active lifecycle → source count → name. Not a ranking."
          cta={{
            label: "Open in selection workspace",
            href: `/select?useCase=${useCase.slug}`,
          }}
          as="h2"
        />
        {shortlist.length >= 2 ? (
          <p className="text-xs text-muted-foreground">
            <Link
              href={comparisonBuilderUrl({
                modelSlugs: shortlist
                  .slice(0, 4)
                  .map((e) => e.model.slug),
                useCase: useCase.slug,
              })}
              className="text-primary hover:underline"
            >
              Open comparison builder for this use case →
            </Link>{" "}
            Pre-seeded with the top 4 shortlist candidates; these are
            candidates, not picks.
          </p>
        ) : null}
        {shortlist.length ? (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left">
                    Model
                  </th>
                  <th scope="col" className="px-4 py-2 text-left">
                    Provider
                  </th>
                  <th scope="col" className="px-4 py-2 text-left">
                    Lifecycle
                  </th>
                  <th scope="col" className="px-4 py-2 text-right">
                    Context
                  </th>
                  <th scope="col" className="px-4 py-2 text-left">
                    Modalities
                  </th>
                  <th scope="col" className="px-4 py-2 text-right">
                    Sources
                  </th>
                  <th scope="col" className="px-4 py-2 text-left">
                    Freshness
                  </th>
                  <th scope="col" className="px-4 py-2 text-left">
                    Next action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card">
                {shortlist.map(({ model, signals, suggestedAction }) => (
                  <tr
                    key={model.slug}
                    className="border-t border-border align-top"
                  >
                    <th
                      scope="row"
                      className="px-4 py-2 text-left font-medium text-foreground"
                    >
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/models/${model.slug}`}
                          className="hover:underline"
                        >
                          {model.name}
                        </Link>
                        <VerificationBadge
                          status={model.verificationStatus}
                        />
                      </div>
                    </th>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      <Link
                        href={`/providers/${model.providerSlug}`}
                        className="hover:underline"
                      >
                        {model.providerSlug}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {isVerified(model.lifecycle)
                        ? model.lifecycle.value.status
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-xs">
                      {isVerified(model.contextWindow)
                        ? model.contextWindow.value.toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {isVerified(model.modality)
                        ? model.modality.value.join(", ")
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-xs">
                      {signals.sourceCount}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${freshnessClasses(signals.freshnessState)}`}
                      >
                        {freshnessLabel(signals.freshnessState)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {suggestedAction}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="card-surface p-4 text-sm text-muted-foreground">
            No models on the catalogue match this use case yet. Reset
            to the full catalogue at{" "}
            <Link href="/models" className="text-primary hover:underline">
              /models
            </Link>
            .
          </p>
        )}
      </section>

      <aside
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="Related routes"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Related workflows + methodology
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {useCase.relatedRoutes.map((r) => (
            <li key={r}>
              <Link href={r} className="text-primary hover:underline">
                {r}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/coverage" className="text-primary hover:underline">
              /coverage
            </Link>{" "}
            — verification breadth across the entity graph.
          </li>
          <li>
            <Link href="/sources" className="text-primary hover:underline">
              /sources
            </Link>{" "}
            — every primary-source citation.
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
