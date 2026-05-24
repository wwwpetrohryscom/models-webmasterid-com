import Link from "next/link";
import type { AudiencePage } from "@/lib/audiences";

interface WorkflowStep {
  step: string;
  label: string;
  href: string;
  detail: string;
}

/**
 * AudienceWorkflow — five-step "learn → apply → test → brief →
 * verify" strip for an audience detail page. Each step links to the
 * canonical surface the audience should walk through. Server
 * component, no client JS.
 */
export function AudienceWorkflow({
  audience,
}: {
  audience: AudiencePage;
}) {
  const evidenceFirst = audience.evidenceRoutes[0];
  const evidenceSecond =
    audience.evidenceRoutes.find((r) => /\/sources|\/reverification/.test(r.href)) ??
    audience.evidenceRoutes[audience.evidenceRoutes.length - 1];

  const steps: WorkflowStep[] = [
    {
      step: "Learn",
      label: audience.suggestedPath.label,
      href: audience.suggestedPath.href,
      detail:
        "Read the role path that frames the workflow with lessons + exercises.",
    },
    {
      step: "Apply",
      label: evidenceFirst?.label ?? "Selection workspace",
      href: evidenceFirst?.href ?? "/select",
      detail:
        "Open the workspace the path routes you through and capture your inputs as a URL.",
    },
    {
      step: "Test",
      label: audience.suggestedLab?.label ?? "AI Usage Lab",
      href: audience.suggestedLab?.href ?? "/lab",
      detail:
        "Run the playbook or template that matches the failure modes you need to surface.",
    },
    {
      step: "Brief",
      label: "Decision brief builder",
      href: "/briefs/build",
      detail:
        "Export a Markdown evidence brief that ships with your reviewer pack.",
    },
    {
      step: "Verify",
      label: evidenceSecond?.label ?? "Citation registry",
      href: evidenceSecond?.href ?? "/sources",
      detail:
        "Walk the citation + freshness trail before sign-off.",
    },
  ];

  return (
    <section
      aria-label="Suggested workflow"
      className="card-surface space-y-3 p-5"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        Suggested workflow
      </p>
      <ol className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-5">
        {steps.map((s, i) => (
          <li
            key={`${s.step}-${i}`}
            className="rounded-xl border border-border bg-card p-3"
          >
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Step {i + 1} · {s.step}
            </p>
            <Link
              href={s.href}
              className="mt-1 block text-sm font-semibold text-foreground hover:underline"
            >
              {s.label} →
            </Link>
            <p className="mt-1 text-xs text-muted-foreground">
              {s.detail}
            </p>
          </li>
        ))}
      </ol>
      {audience.guidedDemo ? (
        <p className="text-xs text-muted-foreground">
          Want a worked example first?{" "}
          <Link
            href={audience.guidedDemo.href}
            className="text-primary hover:underline"
          >
            Walk the {audience.guidedDemo.label}
          </Link>
          .
        </p>
      ) : null}
    </section>
  );
}
