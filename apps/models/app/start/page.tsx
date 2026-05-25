import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { StartRoleCard } from "@/components/onboarding/StartRoleCard";
import { StartGoalGrid } from "@/components/onboarding/StartGoalGrid";
import { StartArtifactGrid } from "@/components/onboarding/StartArtifactGrid";
import { StartPolicyNote } from "@/components/onboarding/StartPolicyNote";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import {
  getOnboardingPaths,
  onboardingArtifacts,
  onboardingGoals,
} from "@/lib/onboarding";

export const metadata: Metadata = buildMetadata({
  title: "Start here",
  description:
    "First-run navigation for cold visitors. Choose a role, a goal, or an artifact to find the right learning path, lab workflow, resource set, or kit. No accounts, no quiz scoring, no model recommendations.",
  path: "/start",
  keywords: [
    "start here ai usage platform",
    "ai model evaluation onboarding",
    "ai usage first run navigation",
  ],
});

export default function StartPage() {
  const paths = getOnboardingPaths();
  return (
    <PageShell
      eyebrow="Onboarding"
      title="Start here"
      intro="Choose a role, a goal, or an artifact to find the right learning path, lab workflow, resource set, or kit. Start Here is a navigation aid — no accounts, no quiz scoring, no client-side state, no model recommendations."
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Start here", href: "/start" },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Start here", href: "/start" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Start here",
            url: `${siteConfig.url}/start`,
            description:
              "First-run navigation across the AI usage learning platform — role paths, goal-filtered resource views, artifact-filtered resource views.",
            dateModified: siteConfig.buildDate,
            isPartOf: { "@type": "WebSite", url: siteConfig.url },
          },
        ]}
      />

      <section
        aria-label="Primary entry points"
        className="card-surface space-y-3 p-5 text-sm"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Three ways to start
        </p>
        <ul className="grid gap-3 sm:grid-cols-3">
          <li>
            <Link
              href="#choose-role"
              className="card-surface block h-full space-y-1 p-3 transition hover:border-primary/30"
            >
              <p className="text-sm font-semibold text-foreground">
                Choose a role →
              </p>
              <p className="text-xs text-muted-foreground">
                Open the role-based learning path that matches your
                work.
              </p>
            </Link>
          </li>
          <li>
            <Link
              href="/resources"
              className="card-surface block h-full space-y-1 p-3 transition hover:border-primary/30"
            >
              <p className="text-sm font-semibold text-foreground">
                Open the resource finder →
              </p>
              <p className="text-xs text-muted-foreground">
                Filter every lesson, exercise, lab tool, kit, and
                outcome by audience, goal, stage, or artifact.
              </p>
            </Link>
          </li>
          <li>
            <Link
              href="/start/beginner"
              className="card-surface block h-full space-y-1 p-3 transition hover:border-primary/30"
            >
              <p className="text-sm font-semibold text-foreground">
                Start the beginner path →
              </p>
              <p className="text-xs text-muted-foreground">
                No prerequisites — four concept lessons + your first
                shortlist.
              </p>
            </Link>
          </li>
        </ul>
      </section>

      <section
        id="choose-role"
        aria-label="Choose your role"
        className="space-y-3"
      >
        <SectionHeader
          eyebrow="By role"
          title="Choose your role"
          description="Each role opens a Start Here page with a three-minute orientation, a first route list, and the artifacts the role produces. Picking a role is a navigation choice, not a quiz answer."
          as="h2"
        />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {paths.map((p) => (
            <li key={p.slug}>
              <StartRoleCard path={p} />
            </li>
          ))}
        </ul>
      </section>

      <StartGoalGrid goals={onboardingGoals} />

      <StartArtifactGrid artifacts={onboardingArtifacts} />

      <StartPolicyNote />

      <aside
        className="card-surface p-5 text-sm text-muted-foreground"
        aria-label="Related routes"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Related routes
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <Link href="/for" className="text-primary hover:underline">
              /for
            </Link>{" "}
            — audience entry points (each pairs an audience page with
            a workflow kit + outcome).
          </li>
          <li>
            <Link
              href="/learn/paths"
              className="text-primary hover:underline"
            >
              /learn/paths
            </Link>{" "}
            — all role-based learning paths.
          </li>
          <li>
            <Link
              href="/resources"
              className="text-primary hover:underline"
            >
              /resources
            </Link>{" "}
            — resource finder with six independent filters.
          </li>
          <li>
            <Link
              href="/docs/resource-map"
              className="text-primary hover:underline"
            >
              /docs/resource-map
            </Link>{" "}
            — how every product surface fits together.
          </li>
          <li>
            <Link
              href="/docs/platform-positioning"
              className="text-primary hover:underline"
            >
              /docs/platform-positioning
            </Link>{" "}
            — what the platform is, what it is not.
          </li>
        </ul>
      </aside>
    </PageShell>
  );
}
