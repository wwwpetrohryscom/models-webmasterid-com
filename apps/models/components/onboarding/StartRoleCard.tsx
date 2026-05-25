import Link from "next/link";
import type { OnboardingPath } from "@/lib/onboarding";

/**
 * StartRoleCard — single role card on the /start hub. Routes the
 * reader to /start/<slug>. Server component.
 */
export function StartRoleCard({ path }: { path: OnboardingPath }) {
  return (
    <Link
      href={`/start/${path.slug}`}
      className="card-surface block h-full space-y-2 p-4 transition hover:border-primary/30 hover:shadow-elevated"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
        Role · {path.audienceLabel}
      </p>
      <p className="text-base font-semibold text-foreground">
        {path.title}
      </p>
      <p className="text-sm text-muted-foreground">{path.summary}</p>
      <p className="text-xs text-muted-foreground">
        First step: {path.firstStep} · ~{path.estimatedMinutes} min
      </p>
      <p className="text-xs font-medium text-primary">
        Open the role path →
      </p>
    </Link>
  );
}
