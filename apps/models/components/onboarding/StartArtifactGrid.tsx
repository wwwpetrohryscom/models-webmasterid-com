import Link from "next/link";
import type { OnboardingArtifact } from "@/lib/onboarding";

/**
 * StartArtifactGrid — "What do you want to produce?" cards. Each
 * card lands at /resources?artifact=<artifact> (or, for the kit
 * card, at /resources?resourceType=workflow-kit). Server component.
 */
export function StartArtifactGrid({
  artifacts,
  title = "What do you want to produce?",
}: {
  artifacts: OnboardingArtifact[];
  title?: string;
}) {
  return (
    <section
      aria-label={title}
      className="card-surface space-y-3 p-5 text-sm not-prose"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          By artifact
        </p>
        <p className="mt-1 text-base font-semibold text-foreground">
          {title}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Each card opens a filtered finder view that lists every
          resource that helps produce the artifact.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {artifacts.map((a) => (
          <li key={a.slug}>
            <Link
              href={a.href}
              className="card-surface block h-full space-y-1 p-3 transition hover:border-primary/30"
            >
              <p className="text-sm font-semibold text-foreground">
                {a.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {a.description}
              </p>
              <p className="text-[11px] font-medium text-primary">
                Open filtered view →
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
