import type { OnboardingPath } from "@/lib/onboarding";

/**
 * StartPathSummary — "3-minute orientation" block on a role start
 * page. Shows what to learn, practise, test, and produce. Server
 * component.
 */
export function StartPathSummary({
  path,
  title = "3-minute orientation",
}: {
  path: OnboardingPath;
  title?: string;
}) {
  return (
    <section
      aria-label={title}
      className="card-surface space-y-3 p-5 text-sm not-prose"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {title}
      </p>
      <p className="text-xs text-muted-foreground">
        Skim this before opening the first lesson. Estimated time for
        the full role path: ~{path.estimatedMinutes} minutes.
      </p>
      <dl className="space-y-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Learn
          </dt>
          <dd className="mt-1 text-sm text-foreground">
            {path.orientation.learn}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Practise
          </dt>
          <dd className="mt-1 text-sm text-foreground">
            {path.orientation.practise}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Test
          </dt>
          <dd className="mt-1 text-sm text-foreground">
            {path.orientation.test}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Produce
          </dt>
          <dd className="mt-1 text-sm text-foreground">
            {path.orientation.produce}
          </dd>
        </div>
      </dl>
    </section>
  );
}
