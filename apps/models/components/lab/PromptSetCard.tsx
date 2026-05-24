import Link from "next/link";
import type { EvaluationPromptSet } from "@/lib/evaluation-prompts";

/**
 * PromptSetCard — summary card for one evaluation prompt set used on
 * /lab/prompts and any surface that surfaces the library entry point.
 * Server component, no client JS.
 */
export function PromptSetCard({
  set,
}: {
  set: EvaluationPromptSet;
}) {
  return (
    <Link
      href={`/lab/prompts/${set.slug}`}
      className="card-surface block h-full space-y-2 p-4 transition hover:border-primary/30 hover:shadow-elevated"
    >
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
            set.difficulty === "beginner"
              ? "border border-primary/30 bg-primary/10 text-primary"
              : "border border-border bg-muted text-foreground"
          }`}
        >
          {set.difficulty}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {set.estimatedMinutes} min
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          · {set.prompts.length} prompts
        </span>
      </div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {set.category}
      </p>
      <p className="text-base font-semibold text-foreground">{set.title}</p>
      <p className="text-sm text-muted-foreground">{set.summary}</p>
      <p className="mt-1 text-xs font-medium text-primary">
        Open prompt set →
      </p>
    </Link>
  );
}
