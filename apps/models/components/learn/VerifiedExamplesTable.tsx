import Link from "next/link";
import { getModelBySlug } from "@/data/models";
import { getProviderBySlug } from "@/data/providers";
import { isVerified, UNVERIFIED_LABEL } from "@/lib/verified";

/**
 * VerifiedExamplesTable — renders a row per model slug for one named
 * verified field, pulling values directly from the typed local data
 * layer. The point is to show the reader what a verified value (or an
 * explicit unverified-data label) actually looks like in the catalogue
 * — not to rank or recommend any model.
 *
 * Each row links to the underlying /models/<slug> page so the reader
 * can read the full citation.
 *
 * Discipline:
 *   - Only renders fields the data layer wraps with `verified(...)`.
 *   - For unverified entries, renders the canonical `UNVERIFIED_LABEL`
 *     and tags the row as such — never substitutes an estimate.
 *   - Never displays "best", price ranking, or speed claims.
 */
export type VerifiedExampleField =
  | "contextWindow"
  | "maxOutputTokens"
  | "lifecycle";

const FIELD_LABEL: Record<VerifiedExampleField, string> = {
  contextWindow: "Context window",
  maxOutputTokens: "Max output tokens",
  lifecycle: "Lifecycle status",
};

function formatField(
  field: VerifiedExampleField,
  model: ReturnType<typeof getModelBySlug>
): { display: string; verified: boolean } {
  if (!model) return { display: UNVERIFIED_LABEL, verified: false };
  if (field === "contextWindow") {
    if (!isVerified(model.contextWindow))
      return { display: UNVERIFIED_LABEL, verified: false };
    return {
      display: `${model.contextWindow.value.toLocaleString("en-US")} tokens`,
      verified: true,
    };
  }
  if (field === "maxOutputTokens") {
    if (!isVerified(model.maxOutputTokens))
      return { display: UNVERIFIED_LABEL, verified: false };
    return {
      display: `${model.maxOutputTokens.value.toLocaleString("en-US")} tokens`,
      verified: true,
    };
  }
  if (field === "lifecycle") {
    if (!isVerified(model.lifecycle))
      return { display: UNVERIFIED_LABEL, verified: false };
    const v = model.lifecycle.value;
    return {
      display: v.retirementDate
        ? `${v.status} (retires ${v.retirementDate})`
        : v.status,
      verified: true,
    };
  }
  return { display: UNVERIFIED_LABEL, verified: false };
}

export function VerifiedExamplesTable({
  field,
  modelSlugs,
  caption,
}: {
  field: VerifiedExampleField;
  modelSlugs: string[];
  caption?: string;
}) {
  return (
    <section
      aria-label={`Verified examples — ${FIELD_LABEL[field]}`}
      className="card-surface space-y-3 p-5 text-sm not-prose"
    >
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Verified examples · {FIELD_LABEL[field]}
        </p>
        {caption ? (
          <p className="text-xs text-muted-foreground">{caption}</p>
        ) : null}
      </header>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="py-2 pr-4 font-medium">
                Model
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                Provider
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                {FIELD_LABEL[field]}
              </th>
              <th scope="col" className="py-2 font-medium">
                Source state
              </th>
            </tr>
          </thead>
          <tbody>
            {modelSlugs.map((slug) => {
              const model = getModelBySlug(slug);
              const provider = model
                ? getProviderBySlug(model.providerSlug)
                : null;
              const formatted = formatField(field, model);
              return (
                <tr
                  key={slug}
                  className="border-b border-border/60 align-top"
                >
                  <td className="py-2 pr-4">
                    {model ? (
                      <Link
                        href={`/models/${model.slug}`}
                        className="text-primary hover:underline"
                      >
                        {model.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">{slug}</span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {provider?.name ?? "—"}
                  </td>
                  <td className="py-2 pr-4 text-foreground">
                    {formatted.display}
                  </td>
                  <td className="py-2 text-xs text-muted-foreground">
                    {formatted.verified
                      ? "verified · citation on record"
                      : "no primary source recorded yet"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Inspection only. The catalogue does not rank these models on
        the field above.
      </p>
    </section>
  );
}
