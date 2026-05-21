import Link from "next/link";

export interface BreadcrumbItem {
  name: string;
  href: string;
}

/**
 * Plain-text breadcrumb trail. The corresponding `BreadcrumbList` JSON-LD
 * is emitted separately via `lib/seo.ts#breadcrumbJsonLd` so the rendered
 * trail and the structured-data trail stay in lock-step.
 *
 * The last item is treated as the current page and rendered as plain
 * text with `aria-current="page"` rather than a link.
 */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (!items.length) return null;
  return (
    <nav
      aria-label="Breadcrumb"
      className="text-xs text-muted-foreground"
    >
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.href}-${i}`} className="flex items-center gap-1">
              {isLast ? (
                <span
                  aria-current="page"
                  className="font-medium text-foreground"
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-foreground hover:underline"
                >
                  {item.name}
                </Link>
              )}
              {!isLast ? (
                <span aria-hidden="true" className="text-muted-foreground/60">
                  /
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
