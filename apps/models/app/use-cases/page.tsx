import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { modelUseCases } from "@/lib/use-cases";
import { getOutcomeUseCases } from "@/lib/outcome-use-cases";
import { OutcomeUseCaseCard } from "@/components/outcomes/OutcomeUseCaseCard";

export const metadata: Metadata = buildMetadata({
  title: "Model Use Cases",
  description:
    "Selection workflows and outcome-driven entry points for AI model work — model evaluation for developers, model selection for product teams, automation testing, governance review, prompt evaluation, structured output testing, plus the verified-field selection workflows. Each routes the reader into the existing learn / apply / verify surfaces; none rank, recommend, or declare a winner.",
  path: "/use-cases",
});

export default function UseCasesHubPage() {
  const detailed = modelUseCases.filter((u) => u.route !== null);
  const reserved = modelUseCases.filter((u) => u.route === null);

  return (
    <PageShell
      eyebrow="Selection"
      title="Model use cases"
      intro="Use cases are selection workflows, not recommendations. Each one names the verified fields a reader should weight when screening models for a particular problem. WebmasterID Models does not declare a model 'best for' any use case."
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Use cases", href: "/use-cases" },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Use cases", href: "/use-cases" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Model use cases",
            url: `${siteConfig.url}/use-cases`,
            description:
              "Source-safe selection workflows for AI models.",
            dateModified: siteConfig.buildDate,
            isPartOf: { "@type": "WebSite", url: siteConfig.url },
          },
        ]}
      />

      <aside
        role="note"
        aria-label="Use-case policy"
        className="card-surface space-y-2 p-4 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          Selection workflow, not a recommendation engine.
        </p>
        <p>
          Each use case below points at verified fields and data gaps —
          never opinions, never ranks, never invented &quot;quality&quot;
          scores. Open a use case to read which fields to weight, the
          common misreads to avoid, and the source-backed shortlist
          generated from the typed local data layer.
        </p>
        <p className="text-xs">
          New to AI model selection? Start with{" "}
          <Link
            href="/learn/how-to-choose-ai-model"
            className="text-primary hover:underline"
          >
            /learn/how-to-choose-ai-model
          </Link>{" "}
          before picking a use case.
        </p>
      </aside>

      <section aria-label="Outcome-driven workflows" className="space-y-3">
        <SectionHeader
          eyebrow="Outcomes"
          title="Outcome-driven workflows"
          description="Outcome pages name the problem you are trying to solve and route you through the existing learn / apply / verify / test / package surfaces. Each ends with named Markdown artifacts — no recommendations, no rankings."
          as="h2"
        />
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {getOutcomeUseCases().map((o) => (
            <li key={o.slug}>
              <OutcomeUseCaseCard outcome={o} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Detailed use cases" className="space-y-3">
        <SectionHeader
          eyebrow="Detail pages"
          title="Use cases with detail pages"
          description="Each detail page walks the verified fields, the most common misreads, and the source-backed shortlist."
          as="h2"
        />
        <ul className="grid gap-3 sm:grid-cols-2">
          {detailed.map((u) => (
            <li key={u.slug}>
              <Link
                href={u.route!}
                className="card-surface block space-y-2 p-4 transition hover:border-primary/30 hover:shadow-elevated"
              >
                <p className="text-base font-semibold text-foreground">
                  {u.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {u.description}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-primary">
                  Verified fields used:{" "}
                  {u.verifiedFieldsUsed.slice(0, 3).join(" · ")}
                  {u.verifiedFieldsUsed.length > 3 ? " · …" : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {reserved.length ? (
        <section aria-label="Reserved use cases" className="space-y-3">
          <SectionHeader
            eyebrow="Reserved"
            title="Use cases — deep dive coming"
            description="The slugs below are reserved so the catalogue can grow without breaking links. They describe selection workflows the data layer already supports, but no dedicated detail page ships this sprint."
            as="h2"
          />
          <ul className="grid gap-3 sm:grid-cols-2">
            {reserved.map((u) => (
              <li
                key={u.slug}
                className="card-surface space-y-2 p-4"
              >
                <p className="text-sm font-semibold text-foreground">
                  {u.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {u.description}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Verified fields used:{" "}
                  {u.verifiedFieldsUsed.slice(0, 3).join(" · ")}
                  {u.verifiedFieldsUsed.length > 3 ? " · …" : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  Workflow currently available via{" "}
                  <Link
                    href={`/select?useCase=${u.slug}`}
                    className="text-primary hover:underline"
                  >
                    /select?useCase={u.slug}
                  </Link>
                  .
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <aside
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="Related workflows"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Related workflows
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <Link
              href="/resources?resourceType=outcome"
              className="text-primary hover:underline"
            >
              /resources?resourceType=outcome
            </Link>{" "}
            — every outcome inside the resource finder (filtered
            view, noindex).
          </li>
          <li>
            <Link href="/select" className="text-primary hover:underline">
              /select
            </Link>{" "}
            — apply a use case as a filter on the selection workspace.
          </li>
          <li>
            <Link href="/models" className="text-primary hover:underline">
              /models
            </Link>{" "}
            — full model catalogue.
          </li>
          <li>
            <Link href="/compare" className="text-primary hover:underline">
              /compare
            </Link>{" "}
            — side-by-side reference pages.
          </li>
          <li>
            <Link href="/coverage" className="text-primary hover:underline">
              /coverage
            </Link>{" "}
            — what is verified across the entity graph.
          </li>
          <li>
            <Link href="/sources" className="text-primary hover:underline">
              /sources
            </Link>{" "}
            — every primary-source citation.
          </li>
          <li>
            <Link
              href="/research/model-selection"
              className="text-primary hover:underline"
            >
              /research/model-selection
            </Link>{" "}
            — methodology behind the verified-field selection workflow.
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
