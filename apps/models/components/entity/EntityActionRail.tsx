import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Standard horizontal action rail for model / provider / comparison
 * detail pages.
 *
 * Buttons are intentionally low-key: secondary visual weight, clear
 * imperative verbs, no marketing copy. The integrity guard suite
 * forbids any of "Get started" / "Start now" / "Best model" / etc.
 * here — see check-production-readiness.ts.
 *
 * Pure server component, no JS, semantic <nav>.
 */
export interface EntityAction {
  label: string;
  href: string;
  hint?: string;
  /** External link → opens in a new tab + adds rel="noreferrer". */
  external?: boolean;
  /** Optional icon glyph (inline text). Keep terse, e.g. "→". */
  icon?: ReactNode;
}

export function EntityActionRail({
  label,
  actions,
}: {
  label: string;
  actions: EntityAction[];
}) {
  if (!actions.length) return null;
  return (
    <nav aria-label={label} className="card-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {label}
      </p>
      <ul className="mt-3 flex flex-wrap gap-2 text-sm">
        {actions.map((action) => (
          <li key={action.href}>
            <Link
              href={action.href}
              target={action.external ? "_blank" : undefined}
              rel={action.external ? "noreferrer" : undefined}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background/40 px-3 py-1.5 font-medium text-foreground transition hover:border-primary/30 hover:text-primary"
            >
              <span>{action.label}</span>
              {action.icon ? (
                <span aria-hidden className="text-muted-foreground">
                  {action.icon}
                </span>
              ) : null}
            </Link>
            {action.hint ? (
              <span className="ml-2 text-xs text-muted-foreground">
                {action.hint}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  );
}
