import Link from "next/link";

/**
 * Persistent methodology-links rail. Used on every detail page so a
 * reader can jump from a model/provider/comparison to the relevant
 * research and reference docs without navigating up.
 *
 * The link set is callable: passing different `tone` configs lets each
 * entity type pick a methodology palette appropriate to it.
 */
export interface MethodologyLink {
  href: string;
  label: string;
  family: "research" | "docs";
}

export function EntityMethodologyLinks({
  title = "Methodology and reference",
  links,
}: {
  title?: string;
  links: MethodologyLink[];
}) {
  if (!links.length) return null;
  return (
    <aside
      aria-label="Methodology links"
      className="card-surface p-5 text-sm text-muted-foreground"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {title}
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="block rounded-lg border border-border bg-background/40 p-3 transition hover:border-primary/30 hover:shadow-elevated"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {link.family === "research" ? "Research guide" : "Reference"}
              </p>
              <p className="mt-0.5 text-sm font-medium text-foreground">
                {link.label}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
