import type { AudiencePage } from "@/lib/audiences";

/**
 * AudienceHero — top-of-page hero block on an audience detail page.
 * Renders the eyebrow, headline, and summary in a consistent shape.
 * Server component, no client JS.
 *
 * The PageShell already renders the H1 + intro for the audience
 * title/summary. This component renders the secondary headline +
 * positioning callout directly below the page hero so the visitor
 * understands the focus before the body content loads.
 */
export function AudienceHero({
  audience,
}: {
  audience: AudiencePage;
}) {
  return (
    <section
      aria-label="Audience positioning"
      className="card-surface space-y-3 p-5 sm:p-6"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {audience.title}
      </p>
      <p className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {audience.headline}
      </p>
      <p className="text-sm text-muted-foreground sm:text-base">
        {audience.summary}
      </p>
    </section>
  );
}
