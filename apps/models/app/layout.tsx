import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { siteConfig } from "@/lib/site-config";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...buildMetadata({
    title: siteConfig.name,
    description: siteConfig.description,
    path: "/",
    keywords: [
      "AI models",
      "AI providers",
      "AI benchmarks",
      "API pricing",
      "inference infrastructure",
      "model comparison",
      "AI observability",
      "AI infrastructure intelligence",
    ],
  }),
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.ecosystem, url: "https://webmasterid.com" }],
  creator: siteConfig.ecosystem,
  publisher: siteConfig.ecosystem,
  formatDetection: { email: false, address: false, telephone: false },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: siteConfig.themeColor,
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-foreground focus:px-3 focus:py-2 focus:text-sm focus:text-background"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
