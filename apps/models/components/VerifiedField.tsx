import Link from "next/link";
import type { MaybeVerified } from "@/lib/types";
import { isVerified } from "@/lib/verified";
import { DataNotVerified } from "./DataNotVerified";

/**
 * Renders a verified value with a tooltip-anchored citation link, or
 * renders DataNotVerified when the field has no citation. This is the
 * type-system-enforced rendering path for any sourced metric.
 */
export function VerifiedField<T>({
  field,
  format,
  label,
  inlineCitation = true,
}: {
  field: MaybeVerified<T> | undefined;
  format?: (v: T) => string;
  label?: string;
  inlineCitation?: boolean;
}) {
  if (!isVerified(field)) {
    return <DataNotVerified reason={label ? `${label}: unverified` : undefined} />;
  }
  const text = format ? format(field.value) : String(field.value);
  return (
    <span
      data-verification="verified"
      data-confidence={field.confidenceLevel}
      className="inline-flex items-center gap-1.5"
    >
      <span className="text-foreground">{text}</span>
      {inlineCitation ? (
        <Link
          href={field.citation.url}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] font-medium uppercase tracking-wider text-primary hover:underline"
          aria-label={`Source: ${field.citation.name}`}
          title={`${field.citation.name} — retrieved ${field.citation.retrievedAt.slice(0, 10)}`}
        >
          src
        </Link>
      ) : null}
    </span>
  );
}
