import type { Metadata } from "next";
import Link from "next/link";
import { ContentPageShell } from "@/components/ContentPageShell";
import { FieldDefinitionTable } from "@/components/content/FieldDefinitionTable";
import { buildMetadata } from "@/lib/seo";
import { getContentPage } from "@/lib/content";

const SLUG = "/docs/comparison-methodology";

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
        { id: "no-winner", label: "No winner declared" },
        { id: "buckets", label: "Two-sided / one-sided / pending" },
        { id: "table-rules", label: "Comparison table rules" },
        { id: "source-trail", label: "Source trail" },
        { id: "indexing", label: "Indexing rules" },
      ]}
      relatedLinks={[
        {
          href: "/compare",
          label: "Compare",
          description: "Live filtered comparison hub.",
        },
        {
          href: "/coverage",
          label: "Coverage",
          description: "Entity-graph summary including comparison counts.",
        },
        {
          href: "/docs/data-verification",
          label: "Data verification",
          description: "The verification rules every metric in a comparison must satisfy.",
        },
      ]}
    >
      <section id="no-winner">
        <h2>No winner declared</h2>
        <p>
          Every ComparisonEntity record carries the literal field{" "}
          <code className="rounded bg-muted px-1">declaresWinner: false</code>{" "}
          as a type-level invariant. The build refuses to compile a
          comparison with{" "}
          <code className="rounded bg-muted px-1">true</code>; an
          integrity guard greps the data layer and the page copy for
          &quot;winner&quot; / &quot;best model&quot; outside the
          explicit disclaimer; the rendered page carries an aside that
          states &quot;No winner declared&quot; in plain text. The
          discipline is structural, not editorial.
        </p>
        <p>
          A comparison&apos;s job is to set verified attributes
          side-by-side. Readers compare against their own workload; the
          platform does not assert that one model is overall &quot;better&quot;
          than another along any axis we are not willing to source
          directly.
        </p>
      </section>

      <section id="buckets">
        <h2>Two-sided / one-sided / pending</h2>
        <p>
          /compare groups every ComparisonEntity into one of three
          buckets:
        </p>
        <FieldDefinitionTable
          caption="Comparison buckets"
          identifierHeader="Bucket"
          rows={[
            {
              identifier: "two-sided-verified",
              title: "Both models verified",
              definition:
                "Both compared models carry verificationStatus: 'verified'.",
              rule: "Indexable. Surfaced first on /compare. JSON-LD includes the full pricing/context/modality fields.",
            },
            {
              identifier: "one-sided-verified",
              title: "One model verified",
              definition:
                "Exactly one of the compared models is verified end-to-end; the other is partial or unverified.",
              rule: "Indexable. Surfaced second. The asymmetry is documented on the page; unverified fields render as the canonical label.",
            },
            {
              identifier: "pending",
              title: "Neither side verified",
              definition:
                "Both sides are partial or unverified. Kept structural until verification lands.",
              rule: "Noindex. Filtered URL set is also noindex per the global hub rules.",
            },
          ]}
        />
      </section>

      <section id="table-rules">
        <h2>Comparison table rules</h2>
        <p>
          The comparison table renders each attribute through a
          VerifiedField — never a raw value. If a model lacks a
          verified value for an attribute, the cell renders the
          canonical unverified-data label rather than &quot;N/A&quot;
          or a guess. Pricing cells render per-row, with each unit
          shown separately (no &quot;total cost&quot; column).
          Capability flags (extended thinking, vision input, tool use)
          render only when verified.
        </p>
        <p>
          Limitations are recorded as a per-comparison{" "}
          <code className="rounded bg-muted px-1">limitations</code>{" "}
          array and rendered as a Caveats section. The
          comparison&apos;s &quot;use cases&quot; field is a
          neutral list of workload classes each side is commonly
          chosen for; it is not a recommendation.
        </p>
      </section>

      <section id="source-trail">
        <h2>Source trail</h2>
        <p>
          Every comparison renders the union of both sides&apos;
          citations at the bottom of the page (using{" "}
          <code className="rounded bg-muted px-1">
            mergeCitations(modelA.citations, modelB.citations)
          </code>
          ). The list deduplicates by URL so a citation that backs
          both sides appears once. Readers can audit every metric on
          the page directly against the underlying primary source.
        </p>
      </section>

      <section id="indexing">
        <h2>Indexing rules</h2>
        <p>
          A comparison page is indexable only when at least one side
          is verified — enforced by{" "}
          <code className="rounded bg-muted px-1">shouldIndexComparison()</code>{" "}
          in{" "}
          <code className="rounded bg-muted px-1">lib/should-index.ts</code>.
          Pending comparisons remain reachable (so the catalogue stays
          honest about gaps) but emit{" "}
          <code className="rounded bg-muted px-1">noindex, follow</code>{" "}
          metadata. Filtered URLs (e.g.{" "}
          <code className="rounded bg-muted px-1">/compare?provider=anthropic</code>
          ) are also noindex; the unfiltered base URL is the
          canonical.
        </p>
        <p>
          See{" "}
          <Link href="/compare" className="text-primary hover:underline">
            /compare
          </Link>{" "}
          for the live hub and the filter form.
        </p>
      </section>
    </ContentPageShell>
  );
}
