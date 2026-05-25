import Link from "next/link";
import type { WorkflowKit } from "@/lib/workflow-kits";

/**
 * WorkflowKitCard — summary card for a workflow kit. Used on /kits
 * and on every audience / homepage surface that exposes the kit
 * entry. Server component, no client JS.
 */
export function WorkflowKitCard({ kit }: { kit: WorkflowKit }) {
  return (
    <Link
      href={`/kits/${kit.slug}`}
      className="card-surface block h-full space-y-2 p-4 transition hover:border-primary/30 hover:shadow-elevated"
    >
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
            kit.difficulty === "beginner"
              ? "border border-primary/30 bg-primary/10 text-primary"
              : "border border-border bg-muted text-foreground"
          }`}
        >
          {kit.difficulty}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {kit.estimatedMinutes} min
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          · {kit.workflow.length} steps
        </span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {kit.audienceSlug.replace(/-/g, " ")}
      </p>
      <p className="text-base font-semibold text-foreground">{kit.title}</p>
      <p className="text-sm text-muted-foreground">{kit.summary}</p>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {kit.whatYouWillProduce.slice(0, 3).map((a) => (
          <span
            key={a}
            className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-foreground"
          >
            {a}
          </span>
        ))}
        {kit.whatYouWillProduce.length > 3 ? (
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            +{kit.whatYouWillProduce.length - 3} more
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs font-medium text-primary">Open kit →</p>
    </Link>
  );
}
