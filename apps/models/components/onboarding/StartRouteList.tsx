import Link from "next/link";
import type { OnboardingPath } from "@/lib/onboarding";

interface RouteRow {
  step: number;
  kind: string;
  route: NonNullable<OnboardingPath["startRoutes"][keyof OnboardingPath["startRoutes"]]>;
}

function buildRows(path: OnboardingPath): RouteRow[] {
  const r = path.startRoutes;
  const rows: RouteRow[] = [
    { step: 1, kind: "Learning path", route: r.learningPath },
    { step: 2, kind: "First lesson", route: r.firstLesson },
    { step: 3, kind: "First exercise", route: r.firstExercise },
  ];
  let next = 4;
  if (r.labPlaybook) {
    rows.push({ step: next++, kind: "Lab playbook", route: r.labPlaybook });
  }
  if (r.kit) {
    rows.push({ step: next++, kind: "Workflow kit", route: r.kit });
  }
  rows.push({
    step: next++,
    kind: "Resource finder",
    route: r.resourceFinder,
  });
  return rows;
}

/**
 * StartRouteList — numbered list of the routes a role start page
 * recommends in order: learning path, first lesson, first exercise,
 * lab playbook (if any), kit (if any), and a filtered resource
 * finder view. Server component, all GET links.
 */
export function StartRouteList({
  path,
  title = "Your first route list",
}: {
  path: OnboardingPath;
  title?: string;
}) {
  const rows = buildRows(path);
  return (
    <section
      aria-label={title}
      className="card-surface space-y-3 p-5 text-sm not-prose"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          First route list
        </p>
        <p className="mt-1 text-base font-semibold text-foreground">
          {title}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Open these in order. Every route already exists in the
          product — Start Here is an entry point, not a parallel
          surface.
        </p>
      </div>
      <ol className="space-y-3">
        {rows.map((row) => (
          <li
            key={row.step}
            className="rounded-xl border border-border bg-card p-3"
          >
            <div className="flex flex-wrap items-baseline gap-2">
              <span
                aria-hidden="true"
                className="grid h-6 w-6 flex-none place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
              >
                {row.step}
              </span>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {row.kind}
              </p>
              <p className="text-base font-semibold text-foreground">
                {row.route.label}
              </p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {row.route.purpose}
            </p>
            <p className="mt-2">
              <Link
                href={row.route.href}
                className="inline-flex items-center text-xs font-medium text-primary hover:underline"
              >
                Open{" "}
                <code className="ml-1 rounded bg-muted px-1 py-0.5 text-[10px] text-foreground">
                  {row.route.href}
                </code>{" "}
                →
              </Link>
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
