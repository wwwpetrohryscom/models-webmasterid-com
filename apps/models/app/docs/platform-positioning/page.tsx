import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/SectionHeader";
import { buildMetadata, breadcrumbJsonLd, articleJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";

const PATH = "/docs/platform-positioning";

export const metadata: Metadata = buildMetadata({
  title: "Platform positioning",
  description:
    "What AiModels WebmasterID is, what it is not, and how to use it responsibly. Long-form positioning for cold visitors, reviewers, and integrators — covering the Learn → Apply → Verify → Test loop, audience paths, evidence artifacts, and the verified-data backbone.",
  path: PATH,
  keywords: [
    "ai usage learning platform",
    "ai model intelligence",
    "ai model decision evidence",
    "ai model evaluation methodology",
    "platform positioning",
  ],
});

export default function PlatformPositioningPage() {
  return (
    <PageShell
      eyebrow="Docs · Positioning"
      title="Platform positioning"
      intro="What AiModels WebmasterID is, what it is not, and how to use it responsibly. A long-form positioning reference for cold visitors, internal reviewers, and partners — covering the Learn → Apply → Verify → Test loop, audience paths, the evidence artifacts the platform produces, and the verified-data backbone the rest of the product rests on."
    >
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Docs", href: "/docs" },
          { name: "Platform positioning", href: PATH },
        ]}
      />

      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Docs", href: "/docs" },
            { name: "Platform positioning", href: PATH },
          ]),
          articleJsonLd({
            type: "TechArticle",
            headline: "Platform positioning",
            description:
              "What AiModels WebmasterID is, what it is not, and how to use it responsibly.",
            path: PATH,
            dateModified: siteConfig.buildDate,
          }),
        ]}
      />

      <aside
        role="note"
        aria-label="Positioning policy"
        className="card-surface space-y-2 p-5 text-sm text-muted-foreground"
      >
        <p className="font-medium text-foreground">
          A learning + evidence platform.
        </p>
        <p>
          The platform's job is to help readers learn how to read AI
          model fields, apply that knowledge in source-backed
          workspaces, verify every claim against a primary source,
          and test model behaviour before integration. It does not
          rank models, certify them, or sell automation outcomes.
        </p>
      </aside>

      <article className="prose-content space-y-8 text-[15px] leading-relaxed text-muted-foreground">
        <section aria-label="What AiModels WebmasterID is">
          <h2>What AiModels WebmasterID is</h2>
          <p>
            AiModels WebmasterID is an AI usage learning platform
            powered by verified model intelligence. It packages four
            things into one product:
          </p>
          <ul>
            <li>
              A <strong className="text-foreground">curriculum</strong>{" "}
              of plain-language lessons, practical exercises, and
              role-based learning paths.
            </li>
            <li>
              A <strong className="text-foreground">workflow</strong>{" "}
              tier — selection workspace, comparison builder,
              decision brief builder — that produces paste-ready
              artifacts from verified catalogue rows.
            </li>
            <li>
              An <strong className="text-foreground">AI Usage Lab</strong>{" "}
              with playbooks, Markdown templates, and evaluation
              prompt sets for testing model behaviour before
              integration.
            </li>
            <li>
              A <strong className="text-foreground">verified-data backbone</strong>{" "}
              of models, providers, hosted availability, pricing
              references, source citations, status observations, and
              a reverification queue.
            </li>
          </ul>
          <p>
            The product loop is short:{" "}
            <strong className="text-foreground">
              Learn → Apply → Verify → Test
            </strong>
            . Every audience uses the same loop; the audience pages
            at <Link href="/for">/for</Link> only change the
            starting order.
          </p>
        </section>

        <section aria-label="What it is not">
          <h2>What it is not</h2>
          <p>
            The platform is deliberately not several adjacent things
            that the AI ecosystem tends to confuse with it:
          </p>
          <ul>
            <li>
              <strong className="text-foreground">Not an AI news feed.</strong>{" "}
              No daily roundups, no editorial commentary on launches.
              The catalogue records verified fields with timestamps
              instead.
            </li>
            <li>
              <strong className="text-foreground">Not a prompt pack or marketplace.</strong>{" "}
              The evaluation prompt library is explicitly framed as
              evaluation inputs, never production prompts, and it is
              never ranked or sold.
            </li>
            <li>
              <strong className="text-foreground">Not a model leaderboard or scoring engine.</strong>{" "}
              No model is declared better than another. Comparisons
              render verified fields side by side and leave the
              decision to the reader.
            </li>
            <li>
              <strong className="text-foreground">Not a live pricing-quote engine.</strong>{" "}
              Pricing rows are sourced references with retrievedAt
              dates. They are not live invoiceable quotes.
            </li>
            <li>
              <strong className="text-foreground">Not a certification authority.</strong>{" "}
              Verification means a primary source backed a value on
              the date recorded. It does not certify the model for any
              regulatory regime.
            </li>
            <li>
              <strong className="text-foreground">Not an AI tools directory or affiliate site.</strong>{" "}
              No tool roundups, no affiliate links, no vendor
              endorsement.
            </li>
          </ul>
        </section>

        <section aria-label="The Learn → Apply → Verify → Test loop">
          <h2>Learn → Apply → Verify → Test</h2>
          <p>
            The product's core loop has four stages. Each stage has
            one canonical entry point:
          </p>
          <ul>
            <li>
              <strong className="text-foreground">Learn</strong> —{" "}
              <Link href="/learn">/learn</Link>. Concept lessons on
              context window, pricing references, hosted vs
              first-party, lifecycle, status, structured output,
              benchmark limits, modality, testing.
            </li>
            <li>
              <strong className="text-foreground">Apply</strong> —{" "}
              <Link href="/select">/select</Link>,{" "}
              <Link href="/compare/build">/compare/build</Link>,{" "}
              <Link href="/briefs/build">/briefs/build</Link>. Each
              workspace produces a deterministic URL or a Markdown
              artifact.
            </li>
            <li>
              <strong className="text-foreground">Verify</strong> —{" "}
              <Link href="/sources">/sources</Link>,{" "}
              <Link href="/coverage">/coverage</Link>,{" "}
              <Link href="/reverification">/reverification</Link>.
              Every claim links back to a primary source with a
              retrievedAt date.
            </li>
            <li>
              <strong className="text-foreground">Test</strong> —{" "}
              <Link href="/lab">/lab</Link>. Six playbooks, three
              Markdown templates, six evaluation prompt sets. Markdown
              exports always serve with{" "}
              <code>X-Robots-Tag: noindex</code>.
            </li>
          </ul>
        </section>

        <section aria-label="Audience paths">
          <h2>Audience paths</h2>
          <p>
            Four audience entry points live under{" "}
            <Link href="/for">/for</Link>. They surface the same
            curriculum + workspaces in a different order:
          </p>
          <ul>
            <li>
              <Link href="/for/developers">/for/developers</Link> —
              engineers preparing an integration.
            </li>
            <li>
              <Link href="/for/product-teams">/for/product-teams</Link>{" "}
              — product managers / technical buyers turning a use case
              into a defensible decision.
            </li>
            <li>
              <Link href="/for/automation-specialists">
                /for/automation-specialists
              </Link>{" "}
              — automation builders, SEO operators, technical
              consultants using AI models inside workflows.
            </li>
            <li>
              <Link href="/for/governance-teams">/for/governance-teams</Link>{" "}
              — risk, compliance, governance reviewers preparing
              internal approval discussions.
            </li>
          </ul>
        </section>

        <section aria-label="Evidence artifacts">
          <h2>Evidence artifacts</h2>
          <p>
            Every walk through the platform ends with a concrete,
            paste-ready artifact. The catalogue never generates a
            score or a verdict; it produces evidence the reader's
            team owns the decision on.
          </p>
          <ul>
            <li>Shortlist URLs from <Link href="/select">/select</Link>.</li>
            <li>
              Comparison URLs from{" "}
              <Link href="/compare/build">/compare/build</Link>.
            </li>
            <li>
              Markdown evidence briefs from{" "}
              <Link href="/briefs/build">/briefs/build</Link> (and the
              JSON variant for machine consumption).
            </li>
            <li>
              Model evaluation plans, prompt test matrices, and
              automation risk checklists from{" "}
              <Link href="/lab/templates">/lab/templates</Link>.
            </li>
            <li>
              Evaluation prompt sets from{" "}
              <Link href="/lab/prompts">/lab/prompts</Link> for
              external test harness use.
            </li>
            <li>
              Source freshness checklists from{" "}
              <Link href="/reverification">/reverification</Link> and
              <code>/api/reverification/checklist</code>.
            </li>
          </ul>
        </section>

        <section aria-label="Verified model intelligence backbone">
          <h2>Verified model intelligence backbone</h2>
          <p>
            The catalogue's verified-data layer is the load-bearing
            substrate for the rest of the product. Every metric
            (pricing, context window, max output, modality, knowledge
            cutoff, lifecycle, hosted availability) is either backed
            by a primary-source citation with a retrievedAt date, or
            it is omitted. Unverified fields render the canonical
            unverified-data label, never an estimate.
          </p>
          <p>
            Primary sources are allow-listed: official vendor
            documentation, official pricing pages, regulatory
            filings, peer-reviewed papers, and public datasets. Blog
            posts, social media, and secondary summaries are not
            primary sources.
          </p>
          <p>
            Lifecycle, freshness, and reverification are first-class
            concerns. The catalogue never auto-mutates verified
            values; the reverification queue surfaces sources due for
            manual re-check.
          </p>
        </section>

        <section aria-label="No rankings, no recommendations, no guarantees">
          <h2>No rankings, no recommendations, no guarantees</h2>
          <p>
            Across every surface, the platform refuses to assert what
            the reader's team must decide:
          </p>
          <ul>
            <li>
              No "best model" or "winner" claims. Comparisons render
              verified fields without scores.
            </li>
            <li>
              No price ranking. Pricing rows are references with
              retrievedAt dates.
            </li>
            <li>
              No fabricated latency, throughput, or uptime. Status
              observations are recorded; SLA assertions are not.
            </li>
            <li>
              No benchmark publishing. Definitions are tracked;
              per-model scores require independently reproducible
              methodology before they land.
            </li>
            <li>
              No certification, no compliance approval, no production
              readiness guarantee, no SEO ranking guarantee. The lab
              policy says so explicitly.
            </li>
            <li>
              No accounts, no progress tracking, no badges, no course
              completion certificates.
            </li>
          </ul>
        </section>

        <section aria-label="How to use this platform responsibly">
          <h2>How to use this platform responsibly</h2>
          <ol>
            <li>
              Pick the audience page that matches your role at{" "}
              <Link href="/for">/for</Link>.
            </li>
            <li>
              Walk the recommended learning path to ground yourself
              in the relevant verified fields.
            </li>
            <li>
              Open the workspace the path routes you through and
              capture inputs as a URL (shortlist, comparison, brief).
            </li>
            <li>
              Run the matching AI Usage Lab playbook + prompt set in
              your own model harness — the platform does not call live
              models on your behalf.
            </li>
            <li>
              Verify every claim against the citation registry; check
              the reverification queue for anything due for re-read.
            </li>
            <li>
              Export an evidence brief and pair it with your own
              workload-specific tests before integration.
            </li>
            <li>
              Treat every recommendation, ranking, or certification
              concept as out of scope. The catalogue surfaces
              evidence; the decision is yours.
            </li>
          </ol>
        </section>
      </article>

      <section
        aria-label="Suggested next routes"
        className="card-surface space-y-3 p-5 text-sm"
      >
        <SectionHeader
          eyebrow="Next"
          title="Suggested next routes"
          description="Pick the next step that matches how you arrived here."
          as="h2"
        />
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { href: "/for", label: "Audience hub" },
            { href: "/learn", label: "Concept lessons" },
            { href: "/learn/paths", label: "Role-based learning paths" },
            { href: "/lab", label: "AI Usage Lab" },
            { href: "/lab/prompts", label: "Evaluation prompt library" },
            { href: "/how-it-works", label: "Five-step workflow walkthrough" },
            { href: "/sources", label: "Citation registry" },
            { href: "/reverification", label: "Reverification queue" },
            { href: "/briefs/build", label: "Decision brief builder" },
          ].map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-lg border border-border bg-card p-3 transition hover:border-primary/30"
              >
                <p className="text-sm font-semibold text-foreground">
                  {item.label} →
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
