import Link from "next/link";
import type { LabTemplate } from "@/lib/lab-playbooks";

/**
 * LabTemplateCard — summary card for one template used on
 * /lab/templates. Server component, no client JS.
 */
export function LabTemplateCard({
  template,
}: {
  template: LabTemplate;
}) {
  return (
    <Link
      href={`/lab/templates/${template.slug}`}
      className="card-surface block h-full space-y-2 p-4 transition hover:border-primary/30 hover:shadow-elevated"
    >
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        Template · {template.format}
      </p>
      <p className="text-base font-semibold text-foreground">
        {template.title}
      </p>
      <p className="text-sm text-muted-foreground">{template.summary}</p>
      <p className="text-[11px] text-muted-foreground">
        {template.sections.length} sections · paste-ready Markdown
      </p>
      <p className="mt-1 text-xs font-medium text-primary">
        View template →
      </p>
    </Link>
  );
}
