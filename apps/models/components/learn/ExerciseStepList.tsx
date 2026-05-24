import Link from "next/link";
import type { LearningExerciseStep } from "@/lib/learning-exercises";

/**
 * ExerciseStepList — numbered list of exercise steps with route link
 * and expected-outcome callout per step.
 *
 * Server component, no client JS, no progress state. The artifact at
 * the end of the exercise is what marks completion — not a UI toggle.
 */
export function ExerciseStepList({
  steps,
}: {
  steps: LearningExerciseStep[];
}) {
  return (
    <ol className="space-y-4 not-prose">
      {steps.map((step, i) => (
        <li
          key={i}
          className="card-surface flex gap-4 p-4 text-sm"
        >
          <span
            aria-hidden="true"
            className="grid h-7 w-7 flex-none place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
          >
            {i + 1}
          </span>
          <div className="space-y-2">
            <p className="text-base font-semibold text-foreground">
              {step.title}
            </p>
            <p className="text-muted-foreground">{step.instruction}</p>
            <p>
              <Link
                href={step.route}
                className="inline-flex items-center text-xs font-medium text-primary hover:underline"
              >
                Open{" "}
                <code className="ml-1 rounded bg-muted px-1 py-0.5 text-[10px] text-foreground">
                  {step.route}
                </code>{" "}
                →
              </Link>
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                Expected outcome:
              </span>{" "}
              {step.expectedOutcome}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
