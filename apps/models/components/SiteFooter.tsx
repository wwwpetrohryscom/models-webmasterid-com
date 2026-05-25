import Link from "next/link";
import { Logo } from "@/components/Logo";
import { siteConfig } from "@/lib/site-config";

const sections: { label: string; links: { label: string; href: string }[] }[] =
  [
    {
      label: "For",
      links: [
        { label: "Audience hub", href: "/for" },
        { label: "Developers", href: "/for/developers" },
        { label: "Product teams", href: "/for/product-teams" },
        {
          label: "Automation specialists",
          href: "/for/automation-specialists",
        },
        { label: "Governance teams", href: "/for/governance-teams" },
        {
          label: "Platform positioning",
          href: "/docs/platform-positioning",
        },
      ],
    },
    {
      label: "Learn",
      links: [
        { label: "Learn hub", href: "/learn" },
        { label: "All paths", href: "/learn/paths" },
        { label: "Beginner path", href: "/learn/path/beginner" },
        { label: "Developer path", href: "/learn/path/developer" },
        {
          label: "Product manager path",
          href: "/learn/path/product-manager",
        },
        { label: "Governance path", href: "/learn/path/governance" },
        {
          label: "Automation specialist path",
          href: "/learn/path/automation-specialist",
        },
        { label: "Exercises", href: "/learn/exercises" },
        {
          label: "How to choose an AI model",
          href: "/learn/how-to-choose-ai-model",
        },
        { label: "Context windows", href: "/learn/context-window" },
        {
          label: "Hosted vs first-party",
          href: "/learn/hosted-vs-first-party",
        },
        { label: "Pricing references", href: "/learn/pricing-references" },
        { label: "Model lifecycle", href: "/learn/model-lifecycle" },
        { label: "Multimodal input", href: "/learn/multimodal-input" },
        { label: "Structured output", href: "/learn/structured-output" },
        {
          label: "Status-aware selection",
          href: "/learn/status-aware-selection",
        },
        {
          label: "Benchmark limitations",
          href: "/learn/benchmark-limitations",
        },
        { label: "Testing AI models", href: "/learn/testing-ai-models" },
      ],
    },
    {
      label: "Workflow",
      links: [
        { label: "Use cases", href: "/use-cases" },
        { label: "Select", href: "/select" },
        { label: "Compare", href: "/compare/build" },
        { label: "Briefs", href: "/briefs/build" },
        { label: "Kits", href: "/kits" },
        { label: "Lab", href: "/lab" },
        { label: "Lab templates", href: "/lab/templates" },
        { label: "Lab prompts", href: "/lab/prompts" },
        { label: "Evaluation guide", href: "/lab/evaluation" },
        { label: "Demos", href: "/demos" },
        { label: "Example brief", href: "/examples/decision-brief" },
        { label: "How it works", href: "/how-it-works" },
      ],
    },
    {
      label: "Intelligence",
      links: [
        { label: "Intelligence", href: "/intelligence" },
        { label: "Models", href: "/models" },
        { label: "Providers", href: "/providers" },
        { label: "Pricing", href: "/pricing" },
        { label: "Coverage", href: "/coverage" },
        { label: "Sources", href: "/sources" },
        { label: "Reverification", href: "/reverification" },
        { label: "Status", href: "/status" },
        { label: "Research", href: "/research" },
        { label: "Docs", href: "/docs" },
      ],
    },
    {
      label: "Ecosystem",
      links: siteConfig.ecosystemLinks.map((l) => ({
        label: l.label,
        href: l.href,
      })),
    },
  ];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-card/40">
      <div className="container-page grid gap-10 py-12 md:grid-cols-3 lg:grid-cols-6">
        <div className="md:col-span-1">
          <Logo variant="full" size={28} showDescriptor />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            {siteConfig.positioning}. Structured intelligence for the AI model
            ecosystem.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Canonical:{" "}
            <Link
              href={siteConfig.url}
              className="underline-offset-2 hover:underline"
            >
              {siteConfig.domain}
            </Link>
          </p>
        </div>

        {sections.map((s) => (
          <nav key={s.label} aria-label={s.label}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              {s.label}
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {s.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col gap-3 py-4 text-xs text-muted-foreground">
          <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
            <p>
              © {new Date(siteConfig.buildDate).getUTCFullYear()}{" "}
              {siteConfig.ecosystem}. {siteConfig.name}.
            </p>
            <p>
              Data integrity: where verified values are unavailable, this site
              renders a single canonical unverified-data label rather than an
              estimate.
            </p>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground/90">
            Provider names and logos are trademarks of their respective
            owners. WebmasterID Models is an independent intelligence
            platform and is not affiliated with or endorsed by listed
            providers. Marks shown here are either internally authored
            lettermarks or assets used under each owner's brand guidelines;
            see{" "}
            <a
              href="/BRAND_ASSETS.md"
              className="underline-offset-2 hover:underline"
            >
              brand-assets policy
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
