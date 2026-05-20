import type {
  MaybeVerified,
  SourceCitation,
  VerifiedField,
} from "./types";

export const UNVERIFIED_LABEL = "Data not yet verified." as const;

/** Type guard. Use this — never read `.value` without it. */
export function isVerified<T>(
  field: MaybeVerified<T> | undefined
): field is VerifiedField<T> {
  return Boolean(field && field.citation && field.value !== undefined);
}

/**
 * Returns the verified value, or null if unverified.
 * The renderer is responsible for showing UNVERIFIED_LABEL when null.
 */
export function verifiedValue<T>(
  field: MaybeVerified<T> | undefined
): T | null {
  return isVerified(field) ? field.value : null;
}

/**
 * Format a verified field for display. If the field has no citation, the
 * value is intentionally suppressed regardless of whether a non-null value
 * was provided in source — this is the type-level guard that blocks
 * unsourced rendering.
 */
export function verifiedDisplay<T>(
  field: MaybeVerified<T> | undefined,
  format?: (v: T) => string
): string {
  if (!isVerified(field)) return UNVERIFIED_LABEL;
  return format ? format(field.value) : String(field.value);
}

/**
 * Build a verified field. Throws at module-load time if any required
 * piece is missing — this catches malformed seed data during build.
 */
export function verified<T>(
  value: T,
  citation: SourceCitation,
  opts: { confidence?: VerifiedField<T>["confidenceLevel"]; notes?: string } = {}
): VerifiedField<T> {
  if (value === undefined || value === null) {
    throw new Error(
      "verified(): refusing to wrap null/undefined value. Use null at the field level instead."
    );
  }
  if (!citation || !citation.url || !citation.name) {
    throw new Error(
      "verified(): citation must include both url and name (primary source)."
    );
  }
  if (!citation.retrievedAt) {
    throw new Error(
      "verified(): citation must include retrievedAt (ISO datetime)."
    );
  }
  return {
    value,
    citation,
    confidenceLevel: opts.confidence ?? "high",
    notes: opts.notes,
  };
}

/** Build a citation. Centralised so the shape stays consistent. */
export function citation(input: SourceCitation): SourceCitation {
  if (!/^https?:\/\//.test(input.url)) {
    throw new Error(`citation(): url must be absolute: ${input.url}`);
  }
  return input;
}

/**
 * Returns the deduplicated set of citations used by a list of verified
 * fields. Useful for assembling a "Sources" section without listing the
 * same URL ten times.
 */
export function collectCitations(
  fields: (MaybeVerified<unknown> | undefined)[]
): SourceCitation[] {
  const seen = new Map<string, SourceCitation>();
  for (const f of fields) {
    if (isVerified(f)) seen.set(f.citation.url, f.citation);
  }
  return Array.from(seen.values());
}

/**
 * Merge per-entity citation lists with field citations. Stable order by
 * first-seen URL.
 */
export function mergeCitations(
  ...lists: (SourceCitation[] | undefined)[]
): SourceCitation[] {
  const seen = new Map<string, SourceCitation>();
  for (const list of lists) {
    if (!list) continue;
    for (const c of list) {
      if (!seen.has(c.url)) seen.set(c.url, c);
    }
  }
  return Array.from(seen.values());
}
