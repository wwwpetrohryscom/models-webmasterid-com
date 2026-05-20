import type { ModelEntity, MaybeVerified } from "@/lib/types";
import { isVerified } from "@/lib/verified";
import { VerificationBadge } from "./VerificationBadge";
import { LifecycleBadge } from "./LifecycleBadge";
import { DataFreshness } from "./DataFreshness";

const TRACKED_FIELDS: { key: keyof ModelEntity | string; label: string }[] = [
  { key: "apiIdentifiers", label: "API identifiers" },
  { key: "releaseDate", label: "Release / snapshot date" },
  { key: "contextWindow", label: "Context window" },
  { key: "maxOutputTokens", label: "Max output tokens" },
  { key: "modality", label: "Modality" },
  { key: "knowledgeCutoff", label: "Knowledge cutoff" },
  { key: "features", label: "Features" },
  { key: "lifecycle", label: "Lifecycle" },
];

function fieldOf(model: ModelEntity, key: string): MaybeVerified<unknown> | undefined {
  // Safe lookup: only specific top-level verified fields are inspected.
  const allow = new Set([
    "apiIdentifiers",
    "releaseDate",
    "snapshotDate",
    "contextWindow",
    "maxOutputTokens",
    "modality",
    "knowledgeCutoff",
    "features",
    "lifecycle",
  ]);
  if (!allow.has(key)) return undefined;
  return (model as unknown as Record<string, MaybeVerified<unknown> | undefined>)[
    key
  ];
}

export function VerificationSummary({ model }: { model: ModelEntity }) {
  const trackedHits = TRACKED_FIELDS.map((f) => ({
    label: f.label,
    verified: isVerified(fieldOf(model, String(f.key))),
  }));
  const pricingVerified = model.pricing.some((t) => isVerified(t.amount));
  const benchmarksVerified = model.benchmarks.some((b) => isVerified(b.score));

  const fields = [
    ...trackedHits,
    { label: "Pricing", verified: pricingVerified },
    { label: "Benchmarks", verified: benchmarksVerified },
  ];

  const verifiedCount = fields.filter((f) => f.verified).length;
  const total = fields.length;

  return (
    <section
      aria-label="Verification summary"
      className="card-surface p-5"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Verification
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {verifiedCount} of {total} tracked fields verified against a
            primary source.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <VerificationBadge status={model.verificationStatus} />
          <LifecycleBadge field={model.lifecycle} />
        </div>
      </header>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {fields.map((f) => (
          <li
            key={f.label}
            className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-3 py-2 text-sm"
          >
            <span className="text-foreground">{f.label}</span>
            <span
              className={
                f.verified
                  ? "text-[11px] font-medium uppercase tracking-wider text-success"
                  : "text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
              }
              data-verification={f.verified ? "verified" : "unverified"}
            >
              {f.verified ? "verified" : "not yet verified"}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <DataFreshness
          lastCheckedAt={model.lastCheckedAt}
          updatedDate={model.updatedDate}
        />
      </div>
    </section>
  );
}
