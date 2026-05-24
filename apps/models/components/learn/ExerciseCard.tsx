import Link from "next/link";
import type { LearningExercise } from "@/lib/learning-exercises";

/**
 * ExerciseCard — summary card used on the /learn/exercises hub and
 * anywhere a lesson page wants to surface its related exercises.
 *
 * Renders title, difficulty chip, estimated minutes, summary, primary
 * workflow route, and a Start exercise CTA. Server component.
 */
export function ExerciseCard({
  exercise,
}: {
  exercise: LearningExercise;
}) {
  const primaryStepRoute = exercise.steps[0]?.route ?? "/select";
  return (
    <Link
      href={`/learn/exercises/${exercise.slug}`}
      className="card-surface block h-full space-y-2 p-4 transition hover:border-primary/30 hover:shadow-elevated"
    >
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
            exercise.difficulty === "beginner"
              ? "border border-primary/30 bg-primary/10 text-primary"
              : "border border-border bg-muted text-foreground"
          }`}
        >
          {exercise.difficulty}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {exercise.estimatedMinutes} min
        </span>
      </div>
      <p className="text-base font-semibold text-foreground">
        {exercise.title}
      </p>
      <p className="text-sm text-muted-foreground">{exercise.summary}</p>
      <p className="text-[11px] text-muted-foreground">
        Primary route:{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-[10px] text-foreground">
          {primaryStepRoute}
        </code>
      </p>
      <p className="mt-1 text-xs font-medium text-primary">
        Start exercise →
      </p>
    </Link>
  );
}
