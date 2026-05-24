import Link from "next/link";
import type { LearningPath } from "@/lib/learning-paths";

/**
 * LearningPathProduces — the "what you walk away with" card on every
 * path detail page. Renders four blocks:
 *
 *   - What you will learn (concept-level outcomes)
 *   - What you will build (artifacts the path actively produces)
 *   - Evidence artifacts (paste-ready outputs, with chip labels)
 *   - Tools used (the workspaces the path routes through)
 *
 * Server component, no client JS. The component is the structural
 * promise of the path — every path detail page renders the same
 * shape so a reviewer knows where to look.
 */
export function LearningPathProduces({
  path,
  title = "What you walk away with",
}: {
  path: LearningPath;
  title?: string;
}) {
  return (
    <section
      aria-label={title}
      className="card-surface space-y-5 p-5 text-sm not-prose"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        {title}
      </p>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What you will learn
          </p>
          <ul className="space-y-1.5">
            {path.whatYouWillLearn.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-muted-foreground"
              >
                <span
                  aria-hidden="true"
                  className="mt-1 inline-block h-2 w-2 flex-none rounded-full bg-primary/70"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            What you will build
          </p>
          <ul className="space-y-1.5">
            {path.whatYouWillBuild.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-muted-foreground"
              >
                <span
                  aria-hidden="true"
                  className="mt-1 inline-block h-2 w-2 flex-none rounded-full bg-primary/70"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Evidence artifacts
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {path.evidenceArtifacts.map((a) => (
            <li
              key={a}
              className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs text-primary"
            >
              {a}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Tools used
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {path.toolsUsed.map((t) => (
            <li key={t.href}>
              <Link
                href={t.href}
                className="block rounded-lg border border-border bg-card p-3 transition hover:border-primary/30"
              >
                <p className="text-sm font-semibold text-foreground">
                  {t.label} →
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.purpose}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
