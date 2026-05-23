import type { Metadata } from "next";
import Link from "next/link";
import { UseCaseDetailLayout } from "@/components/UseCaseDetailLayout";
import { buildMetadata } from "@/lib/seo";
import { getUseCaseBySlug } from "@/lib/use-cases";

const useCase = getUseCaseBySlug("governance-review")!;

export const metadata: Metadata = buildMetadata({
  title: useCase.title,
  description: useCase.description,
  path: useCase.route ?? "/use-cases/governance-review",
});

export default function GovernanceReviewUseCasePage() {
  return (
    <UseCaseDetailLayout
      useCase={useCase}
      narrative={
        <>
          <p>
            Internal AI model inventory + source-backed due diligence
            is the natural use case for the catalogue&apos;s
            transparency surface. Each verified field is paired with
            a primary-source citation and a deterministic freshness
            state; data gaps are explicit; the reverification queue
            lists every record due for manual re-check.
          </p>
          <p>
            Signals to walk during a governance review:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>Verification status</strong> — a record is{" "}
              <code className="rounded bg-muted px-1">verified</code>,{" "}
              <code className="rounded bg-muted px-1">partial</code>, or{" "}
              <code className="rounded bg-muted px-1">unverified</code>.
              Partial is meaningful: the model exists on the catalogue
              but some metric fields are null because the vendor does
              not publish, or because automated retrieval is blocked
              (the OpenAI 403 case).
            </li>
            <li>
              <strong>Lifecycle status</strong> — an active model is
              eligible for new workloads; deprecated and retired
              records are retained for inventory continuity but should
              not be used for new procurement.
            </li>
            <li>
              <strong>Source citations</strong> — every verified field
              points at a primary-source URL with a{" "}
              <code className="rounded bg-muted px-1">retrievedAt</code>{" "}
              date. Open the citation, confirm the value still
              matches, and treat the record as confirmed.
            </li>
            <li>
              <strong>Freshness state</strong> — fresh / review_due /
              stale / blocked / unknown, computed deterministically
              against{" "}
              <code className="rounded bg-muted px-1">
                siteConfig.buildDate
              </code>
              . Stale ≠ false; it means re-verify before reuse.
            </li>
            <li>
              <strong>Reverification queue</strong> — surfaces every
              source that has aged out, every blocked vendor doc, and
              every partial-coverage provider with a suggested manual
              action. Open at{" "}
              <Link
                href="/reverification"
                className="text-primary hover:underline"
              >
                /reverification
              </Link>
              .
            </li>
          </ul>
          <p>
            <strong className="text-foreground">
              Important caveat.
            </strong>{" "}
            A record marked &quot;verified&quot; means the field is
            backed by a primary-source citation on the date recorded —
            it is <em>not</em> a certification, a compliance attestation,
            or a fitness-for-purpose claim against any specific
            regulatory regime. The catalogue is a source-backed starting
            point for due diligence, not a substitute for legal,
            security, or compliance review.
          </p>
          <p>
            The shortlist below collects models with any source
            citations recorded (the minimum bar for a governance
            review). For the full source registry across every provider
            see{" "}
            <Link href="/sources" className="text-primary hover:underline">
              /sources
            </Link>
            ; for the verification coverage matrix see{" "}
            <Link href="/coverage" className="text-primary hover:underline">
              /coverage
            </Link>
            .
          </p>
        </>
      }
    />
  );
}
