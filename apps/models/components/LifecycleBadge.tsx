import type { MaybeVerified, ModelLifecycle } from "@/lib/types";
import { isVerified } from "@/lib/verified";

const TONE: Record<ModelLifecycle["status"], string> = {
  active: "border-success/30 bg-success/10 text-success",
  preview: "border-primary/30 bg-primary/10 text-primary",
  deprecated: "border-warning/30 bg-warning/10 text-warning",
  retired: "border-muted-foreground/30 bg-muted text-muted-foreground",
};

const LABEL: Record<ModelLifecycle["status"], string> = {
  active: "Active",
  preview: "Preview",
  deprecated: "Deprecated",
  retired: "Retired",
};

export function LifecycleBadge({
  field,
}: {
  field: MaybeVerified<ModelLifecycle>;
}) {
  if (!isVerified(field)) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border border-muted-foreground/20 bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
        aria-label="Lifecycle: not yet verified"
        data-verification="unverified"
      >
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
        Lifecycle unknown
      </span>
    );
  }
  const status = field.value.status;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${TONE[status]}`}
      aria-label={`Lifecycle: ${LABEL[status]}`}
      data-verification="verified"
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABEL[status]}
      {status === "deprecated" && field.value.retirementDate ? (
        <span className="ml-1 font-normal opacity-80">
          · retires {field.value.retirementDate}
        </span>
      ) : null}
    </span>
  );
}
