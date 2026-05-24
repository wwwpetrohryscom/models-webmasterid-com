import Link from "next/link";
import { getExercisesForLesson } from "@/lib/learning-exercises";

/**
 * LessonExercisesPanel — surfaces the exercises tagged with a given
 * lesson slug. Lessons render this in their body so the reader can
 * jump directly from concept to practice.
 *
 * If no exercises are registered for the lesson yet, the panel
 * renders nothing — the lesson stays informational.
 */
export function LessonExercisesPanel({
  lessonSlug,
}: {
  lessonSlug: string;
}) {
  const exercises = getExercisesForLesson(lessonSlug);
  if (!exercises.length) return null;
  return (
    <section
      aria-label="Practise this lesson"
      className="card-surface space-y-3 p-5 text-sm not-prose"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        Practise this lesson
      </p>
      <p className="text-muted-foreground">
        These exercises route the lesson concept through the
        verified-data product surfaces. Each one ends with a concrete
        artifact you can share.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {exercises.map((e) => (
          <li key={e.slug}>
            <Link
              href={`/learn/exercises/${e.slug}`}
              className="block rounded-lg border border-border bg-card p-3 transition hover:border-primary/30"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                    e.difficulty === "beginner"
                      ? "border border-primary/30 bg-primary/10 text-primary"
                      : "border border-border bg-muted text-foreground"
                  }`}
                >
                  {e.difficulty}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {e.estimatedMinutes} min
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {e.title} →
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {e.summary}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
