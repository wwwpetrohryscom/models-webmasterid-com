import Link from "next/link";
import type { LearningPathStep } from "@/lib/learning-paths";

function stepRoute(step: LearningPathStep): string {
  switch (step.type) {
    case "lesson":
      return `/learn/${step.slug}`;
    case "exercise":
      return `/learn/exercises/${step.slug}`;
    case "workflow":
      return step.href;
  }
}

function stepChipClasses(type: LearningPathStep["type"]): string {
  switch (type) {
    case "lesson":
      return "border border-primary/30 bg-primary/10 text-primary";
    case "exercise":
      return "border border-border bg-muted text-foreground";
    case "workflow":
      return "border border-border bg-card text-foreground";
  }
}

/**
 * LearningPathTimeline — numbered, vertical timeline of the path
 * steps. Each step renders its kind (lesson / exercise / workflow),
 * title, purpose, estimated minutes, and a route link.
 *
 * Pure server component, no client JS, no completion state.
 */
export function LearningPathTimeline({
  steps,
}: {
  steps: LearningPathStep[];
}) {
  return (
    <ol className="space-y-3 not-prose">
      {steps.map((step, i) => (
        <li key={`${step.type}-${i}`} className="card-surface p-4 text-sm">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="grid h-7 w-7 flex-none place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
            >
              {i + 1}
            </span>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${stepChipClasses(step.type)}`}
                >
                  {step.type}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {step.estimatedMinutes} min
                </span>
              </div>
              <p className="text-base font-semibold text-foreground">
                {step.title}
              </p>
              <p className="text-muted-foreground">{step.purpose}</p>
              <p>
                <Link
                  href={stepRoute(step)}
                  className="inline-flex items-center text-xs font-medium text-primary hover:underline"
                >
                  Open{" "}
                  <code className="ml-1 rounded bg-muted px-1 py-0.5 text-[10px] text-foreground">
                    {stepRoute(step)}
                  </code>{" "}
                  →
                </Link>
              </p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
