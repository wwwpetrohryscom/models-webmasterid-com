import Link from "next/link";

export function SectionHeader({
  eyebrow,
  title,
  description,
  cta,
  as: As = "h2",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  cta?: { label: string; href: string };
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <As className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </As>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {cta ? (
        <Link
          href={cta.href}
          className="text-sm font-medium text-primary hover:underline"
        >
          {cta.label} →
        </Link>
      ) : null}
    </div>
  );
}
