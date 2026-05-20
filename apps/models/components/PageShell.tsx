import type { ReactNode } from "react";

export function PageShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="container-page py-10 md:py-14">
      <header className="max-w-3xl">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        {intro ? (
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            {intro}
          </p>
        ) : null}
      </header>
      <div className="mt-10 space-y-10">{children}</div>
    </div>
  );
}
