import Link from "next/link";
import { Logo } from "@/components/Logo";
import { siteConfig } from "@/lib/site-config";

const sections: { label: string; links: { label: string; href: string }[] }[] =
  [
    {
      label: "Intelligence",
      links: [
        { label: "Models", href: "/models" },
        { label: "Providers", href: "/providers" },
        { label: "Compare", href: "/compare" },
        { label: "Benchmarks", href: "/benchmarks" },
      ],
    },
    {
      label: "Infrastructure",
      links: [
        { label: "Pricing", href: "/pricing" },
        { label: "Infra", href: "/infrastructure" },
        { label: "Status", href: "/status" },
      ],
    },
    {
      label: "Content",
      links: [
        { label: "How it works", href: "/how-it-works" },
        { label: "News", href: "/news" },
        { label: "Research", href: "/research" },
        { label: "Intelligence", href: "/intelligence" },
        { label: "Coverage", href: "/coverage" },
        { label: "Sources", href: "/sources" },
        { label: "Reverification", href: "/reverification" },
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
      <div className="container-page grid gap-10 py-12 md:grid-cols-5">
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
