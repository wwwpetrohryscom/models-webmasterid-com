import Link from "next/link";
import type { LearningPath } from "@/lib/learning-paths";

/**
 * LearningPathCard — summary card for one role-based path.
 *
 * Used on the /learn hub picker, on /learn/paths, and anywhere else
 * the catalogue wants to expose the four-path entry point. Server
 * component, no client JS.
 */
export function LearningPathCard({
  path,
}: {
  path: LearningPath;
}) {
  return (
    <Link
      href={`/learn/path/${path.slug}`}
      className="card-surface block h-full space-y-2 p-4 transition hover:border-primary/30 hover:shadow-elevated"
    >
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
            path.difficulty === "beginner"
              ? "border border-primary/30 bg-primary/10 text-primary"
              : "border border-border bg-muted text-foreground"
          }`}
        >
          {path.difficulty}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {path.estimatedMinutes} min
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          · {path.steps.length} steps
        </span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {path.audienceLabel}
      </p>
      <p className="text-base font-semibold text-foreground">
        {path.title}
      </p>
      <p className="text-sm text-muted-foreground">{path.summary}</p>
      <div className="flex flex-wrap gap-1.5">
        {path.evidenceArtifacts.slice(0, 3).map((a) => (
          <span
            key={a}
            className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-foreground"
          >
            {a}
          </span>
        ))}
        {path.evidenceArtifacts.length > 3 ? (
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            +{path.evidenceArtifacts.length - 3} more
          </span>
        ) : null}
      </div>
      <p className="text-xs font-medium text-primary">
        Start path →
      </p>
    </Link>
  );
}
