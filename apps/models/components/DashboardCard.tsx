import Link from "next/link";

export function DashboardCard({
  title,
  description,
  href,
  children,
  cta,
}: {
  title: string;
  description?: string;
  href?: string;
  children: React.ReactNode;
  cta?: string;
}) {
  return (
    <section className="card-surface flex flex-col p-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            {title}
          </h3>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {href ? (
          <Link
            href={href}
            className="text-xs font-medium text-primary hover:underline"
            aria-label={`${cta ?? "View all"} ${title}`}
          >
            {cta ?? "View all"} →
          </Link>
        ) : null}
      </header>
      <div className="mt-4 flex-1">{children}</div>
    </section>
  );
}
