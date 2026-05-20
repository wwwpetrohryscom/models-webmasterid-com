import Link from "next/link";

export function InternalLinkGrid({
  title,
  items,
}: {
  title?: string;
  items: { label: string; href: string; description?: string }[];
}) {
  return (
    <nav aria-label={title ?? "Related links"} className="space-y-3">
      {title ? (
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {title}
        </h2>
      ) : null}
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-xl border border-border bg-card p-3 transition hover:border-primary/30 hover:shadow-elevated"
            >
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              {item.description ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.description}
                </p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
