import type { Metadata } from "next";
import Link from "next/link";
import { ContentPageShell } from "@/components/ContentPageShell";
import { buildMetadata } from "@/lib/seo";
import { getContentPage } from "@/lib/content";

const SLUG = "/docs/resource-map";

export const metadata: Metadata = (() => {
  const page = getContentPage(SLUG)!;
  return buildMetadata({
    title: page.title,
    description: page.description,
    path: page.slug,
    keywords: page.keywords,
  });
})();

export default function ResourceMapDocsPage() {
  const page = getContentPage(SLUG)!;
  return (
    <ContentPageShell
      page={page}
      breadcrumbParent={{ name: "Docs", href: "/docs" }}
      toc={[
        { id: "what-the-graph-is", label: "What the resource graph is" },
        { id: "product-loop", label: "Learn → Apply → Verify → Test → Package" },
        { id: "resource-types", label: "Resource types" },
        { id: "choose-next-step", label: "How to choose your next step" },
        { id: "how-things-connect", label: "How audiences, outcomes, kits, lab tools connect" },
        { id: "policy", label: "What the platform does not decide" },
      ]}
      relatedLinks={[
        {
          href: "/resources",
          label: "Resource finder",
          description:
            "Server-rendered finder across every product surface.",
        },
        {
          href: "/for",
          label: "Audience hub",
          description: "Pick the audience entry point that matches your role.",
        },
        {
          href: "/learn",
          label: "Learn hub",
          description: "Concept lessons + role-based paths.",
        },
        {
          href: "/lab",
          label: "AI Usage Lab",
          description: "Testing playbooks + evaluation prompt sets.",
        },
        {
          href: "/kits",
          label: "Workflow kits",
          description: "Packaged Markdown work documents per audience.",
        },
        {
          href: "/use-cases",
          label: "Use cases",
          description: "Outcome-driven entry points.",
        },
        {
          href: "/briefs/build",
          label: "Decision brief builder",
          description: "Package the evidence trail as a paste-ready Markdown brief.",
        },
        {
          href: "/sources",
          label: "Sources",
          description: "Every primary-source citation backing a verified value.",
        },
        {
          href: "/reverification",
          label: "Reverification queue",
          description: "Citations due for manual re-check.",
        },
      ]}
    >
      <section id="what-the-graph-is">
        <h2>What the resource graph is</h2>
        <p>
          The resource graph is a single navigation index across every
          product surface — lessons, exercises, learning paths, lab
          playbooks, lab templates, evaluation prompt sets, workflow
          kits, outcome pages, audience pages, guided demos, and the
          evidence workspaces that produce a decision brief or
          comparison URL. Each resource is tagged with a stage, an
          audience set, the goals it serves, and the evidence
          artifacts it helps produce. The{" "}
          <Link
            href="/resources"
            className="text-primary hover:underline"
          >
            /resources
          </Link>{" "}
          finder reads from this graph; nothing on it scores, sorts,
          or recommends a model.
        </p>
        <p>
          The graph is pure local data. Titles and descriptions come
          from the underlying registries, so a rename in
          <code className="ml-1 rounded bg-muted px-1 py-0.5 text-[11px]">
            lessons.ts
          </code>{" "}
          or
          <code className="ml-1 rounded bg-muted px-1 py-0.5 text-[11px]">
            workflow-kits.ts
          </code>{" "}
          flows through to the finder automatically. The stage /
          audience / goal / artifact tags live only in
          <code className="ml-1 rounded bg-muted px-1 py-0.5 text-[11px]">
            lib/resource-graph.ts
          </code>{" "}
          — that file is the routing layer.
        </p>
      </section>

      <section id="product-loop">
        <h2>Learn → Apply → Verify → Test → Package</h2>
        <p>
          Every product surface lives at exactly one stage of the
          product loop. The graph lets the reader scan where the next
          step lives instead of guessing which hub to open.
        </p>
        <ol>
          <li>
            <strong>Learn.</strong> Plain-language concept lessons,
            audience entry points, and role-based learning paths
            (
            <Link href="/learn" className="text-primary hover:underline">
              /learn
            </Link>
            ,{" "}
            <Link href="/for" className="text-primary hover:underline">
              /for
            </Link>
            ,{" "}
            <Link
              href="/learn/paths"
              className="text-primary hover:underline"
            >
              /learn/paths
            </Link>
            ).
          </li>
          <li>
            <strong>Apply.</strong> Exercises, the selection and
            comparison workspaces, and the guided demos that produce a
            working URL (
            <Link
              href="/learn/exercises"
              className="text-primary hover:underline"
            >
              /learn/exercises
            </Link>
            ,{" "}
            <Link href="/select" className="text-primary hover:underline">
              /select
            </Link>
            ,{" "}
            <Link
              href="/compare/build"
              className="text-primary hover:underline"
            >
              /compare/build
            </Link>
            ,{" "}
            <Link href="/demos" className="text-primary hover:underline">
              /demos
            </Link>
            ).
          </li>
          <li>
            <strong>Verify.</strong> Source freshness, lifecycle
            inspection, the reverification queue, and the coverage
            audit (
            <Link href="/sources" className="text-primary hover:underline">
              /sources
            </Link>
            ,{" "}
            <Link
              href="/reverification"
              className="text-primary hover:underline"
            >
              /reverification
            </Link>
            ,{" "}
            <Link
              href="/coverage"
              className="text-primary hover:underline"
            >
              /coverage
            </Link>
            ).
          </li>
          <li>
            <strong>Test.</strong> Lab playbooks and evaluation prompt
            sets the reader runs in their own harness — the catalogue
            never calls live models on the reader's behalf (
            <Link href="/lab" className="text-primary hover:underline">
              /lab
            </Link>
            ,{" "}
            <Link
              href="/lab/prompts"
              className="text-primary hover:underline"
            >
              /lab/prompts
            </Link>
            ).
          </li>
          <li>
            <strong>Package.</strong> The decision brief, the Markdown
            templates, the workflow kits, and the outcome flows that
            ship a paste-ready artifact (
            <Link
              href="/briefs/build"
              className="text-primary hover:underline"
            >
              /briefs/build
            </Link>
            ,{" "}
            <Link
              href="/lab/templates"
              className="text-primary hover:underline"
            >
              /lab/templates
            </Link>
            ,{" "}
            <Link href="/kits" className="text-primary hover:underline">
              /kits
            </Link>
            ,{" "}
            <Link
              href="/use-cases"
              className="text-primary hover:underline"
            >
              /use-cases
            </Link>
            ).
          </li>
        </ol>
      </section>

      <section id="resource-types">
        <h2>Resource types</h2>
        <p>
          The graph distinguishes thirteen resource types so the
          finder can filter precisely. Each type maps onto a single
          source registry:
        </p>
        <ul>
          <li>
            <strong>Lesson.</strong> Plain-language concept read from{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
              lib/lessons.ts
            </code>
            .
          </li>
          <li>
            <strong>Exercise.</strong> Hands-on apply step from{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
              lib/learning-exercises.ts
            </code>
            .
          </li>
          <li>
            <strong>Learning path.</strong> Sequenced lesson + exercise
            walk-through from{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
              lib/learning-paths.ts
            </code>
            .
          </li>
          <li>
            <strong>Lab playbook.</strong> Structured testing recipe
            from{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
              lib/lab-playbooks.ts
            </code>
            .
          </li>
          <li>
            <strong>Lab template.</strong> Paste-ready Markdown
            scaffold from the same registry.
          </li>
          <li>
            <strong>Evaluation prompt set.</strong> Generic, safe
            prompt sets from{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
              lib/evaluation-prompts.ts
            </code>
            .
          </li>
          <li>
            <strong>Workflow kit.</strong> Packaged Markdown work
            document from{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
              lib/workflow-kits.ts
            </code>
            .
          </li>
          <li>
            <strong>Outcome.</strong> Outcome-driven landing page from{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
              lib/outcome-use-cases.ts
            </code>
            .
          </li>
          <li>
            <strong>Audience.</strong> Role-based entry page from{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
              lib/audiences.ts
            </code>
            .
          </li>
          <li>
            <strong>Guided demo.</strong> Pre-packaged route plan
            from{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
              lib/guided-demos.ts
            </code>
            .
          </li>
          <li>
            <strong>Workspace.</strong> Live builders (
            <Link href="/select" className="text-primary hover:underline">
              /select
            </Link>
            ,{" "}
            <Link
              href="/compare/build"
              className="text-primary hover:underline"
            >
              /compare/build
            </Link>
            ,{" "}
            <Link
              href="/briefs/build"
              className="text-primary hover:underline"
            >
              /briefs/build
            </Link>
            ).
          </li>
          <li>
            <strong>Evidence example.</strong> Worked output the
            reader can inspect before producing their own.
          </li>
          <li>
            <strong>Reference.</strong> The verification surfaces (
            <Link
              href="/sources"
              className="text-primary hover:underline"
            >
              /sources
            </Link>
            ,{" "}
            <Link
              href="/coverage"
              className="text-primary hover:underline"
            >
              /coverage
            </Link>
            ,{" "}
            <Link
              href="/reverification"
              className="text-primary hover:underline"
            >
              /reverification
            </Link>
            ).
          </li>
        </ul>
      </section>

      <section id="choose-next-step">
        <h2>How to choose your next step</h2>
        <p>
          The finder supports six independent filters: audience, goal,
          stage, resource type, evidence artifact, and difficulty.
          Each filter is a GET link, no client state, no accounts.
          Combining filters is safe — the canonical URL stays{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
            /resources
          </code>{" "}
          and any combination with a query string is{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
            noindex, follow
          </code>
          .
        </p>
        <p>
          Two common entry shapes:
        </p>
        <ul>
          <li>
            <strong>By role.</strong> Apply the{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
              audience
            </code>{" "}
            filter — every resource tagged for that audience surfaces
            in stage order so the reader can walk Learn → Package
            without leaving the page.
          </li>
          <li>
            <strong>By artifact.</strong> Apply the{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
              artifact
            </code>{" "}
            filter — the finder lists every resource that helps
            produce that specific Markdown output, so the reader
            walks straight to the package.
          </li>
        </ul>
      </section>

      <section id="how-things-connect">
        <h2>How audiences, outcomes, kits, and lab tools connect</h2>
        <p>
          Each audience entry page links to a role-based learning
          path, a workflow kit, and the outcome pages that match the
          audience's primary problem. Each outcome page lists the
          lessons, exercises, lab playbooks, prompt sets, and
          workflow kit that route the reader through Learn → Apply →
          Verify → Test → Package. Each kit packages the same
          resources as a single Markdown work document that the
          reader can paste into a PR, design doc, or review ticket.
        </p>
        <p>
          The finder makes all of these reachable from one URL — but
          the underlying registries stay independent. Adding a new
          lesson updates the finder automatically. Removing a lesson
          drops it from the finder without breaking other registries.
        </p>
      </section>

      <section id="policy">
        <h2>What the platform does not decide</h2>
        <ul>
          <li>
            Which model is best for the reader's workload. The
            catalogue never declares a winner.
          </li>
          <li>
            Which provider is cheapest or fastest. Pricing rows are
            references with retrievedAt dates; the platform does not
            rank by price or speed.
          </li>
          <li>
            Whether the integration meets the bar for production use.
            The workflow ends with an external test plan — running
            those tests is the team's responsibility.
          </li>
          <li>
            Whether the model is compliant for any regulatory regime.
            Governance pages name the questions to ask; the team's
            reviewers make the call.
          </li>
          <li>
            Whether a particular SEO outcome will follow from using
            the platform. The resource finder is a navigation aid,
            not a search-ranking guarantee.
          </li>
        </ul>
      </section>
    </ContentPageShell>
  );
}
