import Link from "next/link";
import type { ModelEntity } from "@/lib/types";
import { ProviderLogo } from "./ProviderLogo";
import { VerificationBadge } from "./VerificationBadge";

export function ModelBadge({
  model,
  providerName,
  asLink = true,
}: {
  model: ModelEntity;
  providerName: string;
  asLink?: boolean;
}) {
  const inner = (
    <div className="flex items-center gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-background/60">
        <ProviderLogo slug={model.providerSlug} name={providerName} size="sm" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {model.name}
        </p>
        <p className="truncate text-xs text-muted-foreground">{providerName}</p>
      </div>
      <VerificationBadge status={model.verificationStatus} />
    </div>
  );

  if (!asLink) return <div className="rounded-xl border border-border bg-card p-3">{inner}</div>;

  return (
    <Link
      href={`/models/${model.slug}`}
      className="block rounded-xl border border-border bg-card p-3 transition hover:border-primary/30 hover:shadow-elevated"
    >
      {inner}
    </Link>
  );
}
