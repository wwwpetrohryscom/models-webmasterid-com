import type { VerificationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const COPY: Record<VerificationStatus, { label: string; tone: string }> = {
  verified: {
    label: "Verified",
    tone: "border-success/30 bg-success/10 text-success",
  },
  partial: {
    label: "Partial",
    tone: "border-warning/30 bg-warning/10 text-warning",
  },
  unverified: {
    label: "Unverified",
    tone: "border-muted-foreground/20 bg-muted text-muted-foreground",
  },
  deprecated: {
    label: "Deprecated",
    tone: "border-muted-foreground/20 bg-muted text-muted-foreground line-through",
  },
};

export function VerificationBadge({
  status,
  className,
}: {
  status: VerificationStatus;
  className?: string;
}) {
  const c = COPY[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        c.tone,
        className
      )}
      aria-label={`Verification status: ${c.label}`}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full bg-current"
      />
      {c.label}
    </span>
  );
}
