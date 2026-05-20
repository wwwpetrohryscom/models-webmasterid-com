import { formatDateISO, formatRelative } from "@/lib/utils";

export function DataFreshness({
  lastCheckedAt,
  updatedDate,
}: {
  lastCheckedAt: string | null | undefined;
  updatedDate: string | null | undefined;
}) {
  const last = lastCheckedAt ?? updatedDate;
  return (
    <p className="text-xs text-muted-foreground">
      <span className="font-medium text-foreground">Data freshness:</span>{" "}
      last checked {formatRelative(last)} · updated {formatDateISO(updatedDate)}
    </p>
  );
}
