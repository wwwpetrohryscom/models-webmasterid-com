import Link from "next/link";

/**
 * ReviewChecklist — non-interactive "review before moving on"
 * checklist used by lessons and exercises. Renders as visual
 * unchecked boxes; the catalogue never persists state.
 */
export function ReviewChecklist({
  items,
  title = "Review before moving on",
  caution,
  nextRoute,
}: {
  items: string[];
  title?: string;
  caution?: string;
  nextRoute?: { label: string; href: string };
}) {
  if (!items.length) return null;
  return (
    <section
      aria-label={title}
      className="card-surface space-y-3 p-5 text-sm not-prose"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {title}
      </p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-muted-foreground"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 inline-grid h-4 w-4 flex-none place-items-center rounded border border-border bg-card text-[10px] text-muted-foreground"
            >
              ☐
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {caution ? (
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Caution:</span>{" "}
          {caution}
        </p>
      ) : null}
      {nextRoute ? (
        <p className="text-xs">
          <Link
            href={nextRoute.href}
            className="text-primary hover:underline"
          >
            Continue → {nextRoute.label}
          </Link>
        </p>
      ) : null}
    </section>
  );
}
