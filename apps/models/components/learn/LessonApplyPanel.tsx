import Link from "next/link";
import type { LessonApplyLink } from "@/lib/lessons";

/**
 * LessonApplyPanel — standalone inline "apply this workflow" block.
 *
 * The sidebar in LessonLayout already renders apply links, but a
 * lesson body may want to surface the same call-to-action inline
 * after a particular section (e.g. "Now go inspect this in the
 * comparison builder"). This panel is the same data, rendered as a
 * full-width card.
 */
export function LessonApplyPanel({
  title = "Apply this workflow",
  routes,
}: {
  title?: string;
  routes: LessonApplyLink[];
}) {
  if (!routes.length) return null;
  return (
    <section
      aria-label={title}
      className="card-surface space-y-3 p-5 text-sm not-prose"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {title}
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {routes.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="block rounded-lg border border-border bg-card p-3 transition hover:border-primary/30"
            >
              <p className="text-sm font-semibold text-foreground">
                {link.label} →
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {link.purpose}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
