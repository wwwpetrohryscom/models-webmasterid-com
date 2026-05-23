import type { Metadata } from "next";
import Link from "next/link";
import { UseCaseDetailLayout } from "@/components/UseCaseDetailLayout";
import { buildMetadata } from "@/lib/seo";
import { getUseCaseBySlug } from "@/lib/use-cases";

const useCase = getUseCaseBySlug("multimodal-input")!;

export const metadata: Metadata = buildMetadata({
  title: useCase.title,
  description: useCase.description,
  path: useCase.route ?? "/use-cases/multimodal-input",
});

export default function MultimodalInputUseCasePage() {
  return (
    <UseCaseDetailLayout
      useCase={useCase}
      narrative={
        <>
          <p>
            Multimodal workloads pass images, audio, video, or PDFs in
            addition to text. The catalogue treats modality as a typed
            list — each verified entry is one of{" "}
            <code className="rounded bg-muted px-1">text-in</code>,{" "}
            <code className="rounded bg-muted px-1">image-in</code>,{" "}
            <code className="rounded bg-muted px-1">audio-in</code>,{" "}
            <code className="rounded bg-muted px-1">video-in</code>,{" "}
            <code className="rounded bg-muted px-1">text-out</code>{" "}
            (and the matching output channels) — and refuses to assert
            a channel the vendor docs do not list.
          </p>
          <p>
            That is the safest stance the catalogue can take, but it has
            two consequences readers should hold in mind:
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>
              <strong>
                Absence of a channel is not a rejection.
              </strong>{" "}
              A model may informally accept an image without the vendor
              listing image-in on its model card. The shortlist below
              filters on the verified field only — confirm against the
              vendor docs before excluding a candidate. Some Sprint-18
              records (Mistral Large 3, the Llama 4 family) carry an
              intentionally null modality list because the vendor card
              describes the model as &quot;multimodal&quot; without
              enumerating the channels.
            </li>
            <li>
              <strong>Output channels matter too.</strong> Most chat
              models are <code className="rounded bg-muted px-1">text-out</code>{" "}
              only — image-generation, audio, and video outputs are
              modeled separately. The catalogue records output channels
              on the same modality field; reading both ends gives the
              full picture of what the model can produce.
            </li>
          </ul>
          <p>
            For most workloads the safest progression is: filter on the
            specific input channel you need; open the model record;
            confirm against the vendor source URL; only then move to{" "}
            <Link href="/compare" className="text-primary hover:underline">
              /compare
            </Link>{" "}
            with a verified peer.
          </p>
        </>
      }
    />
  );
}
