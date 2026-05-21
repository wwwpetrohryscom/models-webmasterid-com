/**
 * Compact "X of Y fields verified" checklist used on model detail
 * pages. Pure presentational component — callers pass the computed
 * status of each field; the component does not interpret entity data.
 *
 * The integrity guard suite ensures no caller invents a "verified"
 * checkmark for a field whose underlying record is null.
 */
export interface VerificationChecklistItem {
  field: string;
  status: "verified" | "missing" | "not_applicable";
  /** Optional one-line caption rendered under the field label. */
  detail?: string;
}

const STATUS_TONE = {
  verified: "border-success/30 bg-success/10 text-success",
  missing: "border-warning/30 bg-warning/10 text-warning",
  not_applicable: "border-muted-foreground/30 bg-muted text-muted-foreground",
} as const;

const STATUS_LABEL = {
  verified: "Verified",
  missing: "Missing",
  not_applicable: "N/A",
} as const;

export function EntityVerificationChecklist({
  items,
  caption,
}: {
  items: VerificationChecklistItem[];
  caption?: string;
}) {
  const verified = items.filter((i) => i.status === "verified").length;
  const tracked = items.filter((i) => i.status !== "not_applicable").length;
  return (
    <section
      aria-label="Verification checklist"
      className="card-surface p-5 text-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Verification checklist
          </p>
          <p className="mt-1 text-base font-semibold text-foreground">
            {verified} of {tracked} tracked fields verified against a
            primary source
          </p>
          {caption ? (
            <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
          ) : null}
        </div>
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.map((i) => (
          <li
            key={i.field}
            className="flex items-start justify-between gap-2 rounded-lg border border-border bg-background/40 p-2.5"
          >
            <div className="min-w-0">
              <p className="font-medium text-foreground">{i.field}</p>
              {i.detail ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {i.detail}
                </p>
              ) : null}
            </div>
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_TONE[i.status]}`}
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-current"
              />
              {STATUS_LABEL[i.status]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
