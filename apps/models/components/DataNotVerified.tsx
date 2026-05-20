import { UNVERIFIED_LABEL } from "@/lib/verified";

/**
 * The only sanctioned way to render an unverified value. Keep the
 * surface tiny: callers should not be tempted to roll their own copy.
 */
export function DataNotVerified({
  reason,
  className,
  inline = true,
}: {
  reason?: string;
  className?: string;
  inline?: boolean;
}) {
  const Tag = inline ? "span" : "p";
  return (
    <Tag
      className={`text-muted-foreground italic ${className ?? ""}`.trim()}
      data-verification="unverified"
      title={reason}
    >
      {UNVERIFIED_LABEL}
    </Tag>
  );
}
