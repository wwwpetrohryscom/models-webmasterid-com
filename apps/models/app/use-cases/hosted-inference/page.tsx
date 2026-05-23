import type { Metadata } from "next";
import Link from "next/link";
import { UseCaseDetailLayout } from "@/components/UseCaseDetailLayout";
import { buildMetadata } from "@/lib/seo";
import { getUseCaseBySlug } from "@/lib/use-cases";

const useCase = getUseCaseBySlug("hosted-inference")!;

export const metadata: Metadata = buildMetadata({
  title: useCase.title,
  description: useCase.description,
  path: useCase.route ?? "/use-cases/hosted-inference",
});

export default function HostedInferenceUseCasePage() {
  return (
    <UseCaseDetailLayout
      useCase={useCase}
      narrative={
        <>
          <p>
            Hosted inference is the right use case when the model
            creator does <em>not</em> run a paid first-party API.
            Meta is the canonical example today: Llama 4 Scout and
            Llama 4 Maverick are open-weights releases with no Meta
            first-party API; inference is delivered by third-party
            hosting platforms (Groq, Together AI) at rates each
            platform sets independently.
          </p>
          <p>
            The catalogue separates two distinct claims here:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>Hosted availability</strong> is a stable identity
              fact — the platform exposes the model under a specific
              hosted model ID (e.g. Groq&apos;s{" "}
              <code className="rounded bg-muted px-1">
                meta-llama/llama-4-scout-17b-16e-instruct
              </code>
              ). Availability rarely changes and is recorded in{" "}
              <code className="rounded bg-muted px-1">
                lib/hosted-availability.ts
              </code>
              .
            </li>
            <li>
              <strong>Hosted pricing</strong> is a volatile reference
              value — the platform&apos;s published per-token rate on
              a specific date. Hosted pricing carries a freshness chip
              and a high-volatility tag because hosting platforms
              re-price frequently. See{" "}
              <Link
                href="/research/api-pricing-methodology"
                className="text-primary hover:underline"
              >
                /research/api-pricing-methodology
              </Link>{" "}
              for the full distinction.
            </li>
          </ul>
          <p>
            Two read-traps to avoid:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>
                A hosting platform is not the model creator.
              </strong>{" "}
              Groq does not become &quot;the maker of Llama 4 Scout&quot; by
              exposing it. The catalogue refuses to attribute creator
              status to a hosting platform; the integrity guards block
              any such drift.
            </li>
            <li>
              <strong>
                Hosted pricing is not creator pricing.
              </strong>{" "}
              Groq&apos;s Llama 4 Scout rate reflects Groq&apos;s
              pricing decision — not Meta&apos;s. WebmasterID Models
              does not rank hosting platforms by price, and you should
              not infer that Together&apos;s rate is &quot;cheaper&quot;
              or &quot;more expensive&quot; in a meaningful sense
              without a workload-specific projection.
            </li>
          </ul>
          <p>
            The shortlist below collects models with verified hosted
            availability records. Each row links to the hosting
            platform&apos;s provider page, where the availability
            sidebar + hosted pricing references render side-by-side
            with the verification + freshness state. Re-verify against
            the platform&apos;s own pricing page before any
            procurement decision.
          </p>
        </>
      }
    />
  );
}
