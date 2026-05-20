export const siteConfig = {
  name: "WebmasterID Models",
  shortName: "Models",
  ecosystem: "WebmasterID",
  positioning: "AI Model Infrastructure Intelligence",
  description:
    "Track AI models, providers, pricing, benchmarks, and inference infrastructure — in real time.",
  url: "https://models.webmasterid.com",
  domain: "models.webmasterid.com",
  ogImage: "https://models.webmasterid.com/og.png",
  locale: "en_US",
  themeColor: "#F7F8FC",
  twitter: {
    handle: "@webmasterid",
    site: "@webmasterid",
  },
  ecosystemLinks: [
    { label: "WebmasterID", href: "https://webmasterid.com" },
    { label: "Models", href: "https://models.webmasterid.com" },
  ],
  primaryNav: [
    { label: "Models", href: "/models" },
    { label: "Providers", href: "/providers" },
    { label: "Compare", href: "/compare" },
    { label: "Benchmarks", href: "/benchmarks" },
    { label: "Pricing", href: "/pricing" },
    { label: "Infra", href: "/infrastructure" },
    { label: "Status", href: "/status" },
    { label: "Docs", href: "/docs" },
  ],
  secondaryNav: [
    { label: "News", href: "/news" },
    { label: "Research", href: "/research" },
  ],
  buildDate: new Date("2026-05-20T00:00:00.000Z").toISOString(),
} as const;

export type SiteConfig = typeof siteConfig;
