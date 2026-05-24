import Link from "next/link";
import type { LabPlaybook } from "@/lib/lab-playbooks";

/**
 * LabPlaybookCard — summary card for one playbook used on /lab and
 * anywhere the catalogue wants to expose the testing recipe entry
 * point. Server component, no client JS.
 */
export function LabPlaybookCard({
  playbook,
}: {
  playbook: LabPlaybook;
}) {
  return (
    <Link
      href={`/lab/${playbook.slug}`}
      className="card-surface block h-full space-y-2 p-4 transition hover:border-primary/30 hover:shadow-elevated"
    >
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
            playbook.difficulty === "beginner"
              ? "border border-primary/30 bg-primary/10 text-primary"
              : "border border-border bg-muted text-foreground"
          }`}
        >
          {playbook.difficulty}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {playbook.estimatedMinutes} min
        </span>
      </div>
      <p className="text-base font-semibold text-foreground">
        {playbook.title}
      </p>
      <p className="text-sm text-muted-foreground">{playbook.summary}</p>
      <p className="text-[11px] text-muted-foreground">
        Outputs: {playbook.outputs.length} artifact
        {playbook.outputs.length === 1 ? "" : "s"} · Templates:{" "}
        {playbook.relatedTemplates.length}
      </p>
      <p className="mt-1 text-xs font-medium text-primary">
        Open playbook →
      </p>
    </Link>
  );
}
