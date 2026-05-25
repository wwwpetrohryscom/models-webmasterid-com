import Link from "next/link";
import type { OnboardingGoal } from "@/lib/onboarding";

/**
 * StartGoalGrid — "What are you trying to do?" cards. Each card
 * lands at a filtered /resources view the finder already supports.
 * Server component.
 */
export function StartGoalGrid({
  goals,
  title = "What are you trying to do?",
}: {
  goals: OnboardingGoal[];
  title?: string;
}) {
  return (
    <section
      aria-label={title}
      className="card-surface space-y-3 p-5 text-sm not-prose"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          By goal
        </p>
        <p className="mt-1 text-base font-semibold text-foreground">
          {title}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Each card opens a pre-filtered view of the resource finder.
          No accounts, no client state — filtered URLs are
          noindex,follow.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((g) => (
          <li key={g.slug}>
            <Link
              href={g.href}
              className="card-surface block h-full space-y-1 p-3 transition hover:border-primary/30"
            >
              <p className="text-sm font-semibold text-foreground">
                {g.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {g.description}
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
