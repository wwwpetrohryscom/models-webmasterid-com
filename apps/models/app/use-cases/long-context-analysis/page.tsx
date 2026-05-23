import type { Metadata } from "next";
import Link from "next/link";
import { UseCaseDetailLayout } from "@/components/UseCaseDetailLayout";
import { buildMetadata } from "@/lib/seo";
import { getUseCaseBySlug } from "@/lib/use-cases";

const useCase = getUseCaseBySlug("long-context-analysis")!;

export const metadata: Metadata = buildMetadata({
  title: useCase.title,
  description: useCase.description,
  path: useCase.route ?? "/use-cases/long-context-analysis",
});

export default function LongContextUseCasePage() {
  return (
    <UseCaseDetailLayout
      useCase={useCase}
      narrative={
        <>
          <p>
            Long-context workloads — codebases, multi-file
            transcriptions, multi-document research — depend on the
            vendor&apos;s published <em>context window</em>. The
            verified context-window field on each model record is
            backed by the vendor&apos;s own model page, and it is the
            only context number this site asserts.
          </p>
          <p>
            Three caveats every reader should hold in mind:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>A large window is not a quality claim.</strong> It
              means the model can <em>accept</em> a long prompt; it does
              not mean every token is equally well used. Comprehension
              degrades with prompt size on every model published today.
            </li>
            <li>
              <strong>Long context can cost more.</strong> Vendors that
              publish a prompt-size pricing tier (Google&apos;s &gt;200k
              surcharge is the live example) charge differently above a
              threshold. Cross-check the relevant pricing tier on{" "}
              <Link href="/pricing" className="text-primary hover:underline">
                /pricing
              </Link>{" "}
              and remember that pricing is a source-backed reference,
              not a live quote.
            </li>
            <li>
              <strong>Max output limits are usually much smaller.</strong>{" "}
              A million-token context window does not imply a
              million-token output. Each model records max output
              separately; unverified output limits remain null.
            </li>
          </ul>
          <p>
            Open a candidate&apos;s detail page from the shortlist
            below and inspect the verified context-window, max-output,
            and pricing reference rows side-by-side with the vendor
            citation. For a paired side-by-side reference between two
            candidates, open{" "}
            <Link href="/compare" className="text-primary hover:underline">
              /compare
            </Link>{" "}
            after selecting two finalists.
          </p>
        </>
      }
    />
  );
}
