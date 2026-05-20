import type { Metadata } from "next";
import { siteConfig } from "./site-config";

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  if (!path.startsWith("/")) path = `/${path}`;
  return `${siteConfig.url}${path}`;
}

export function buildMetadata({
  title,
  description,
  path,
  keywords,
}: {
  title: string;
  description?: string;
  path: string;
  keywords?: string[];
}): Metadata {
  const url = absoluteUrl(path);
  const desc = description ?? siteConfig.description;
  const fullTitle =
    title === siteConfig.name ? siteConfig.name : `${title} | ${siteConfig.name}`;

  return {
    title: fullTitle,
    description: desc,
    keywords,
    metadataBase: new URL(siteConfig.url),
    alternates: { canonical: url },
    openGraph: {
      // images intentionally omitted so Next's file convention
      // (app/opengraph-image.tsx) provides the auto-generated PNG.
      type: "website",
      locale: siteConfig.locale,
      url,
      title: fullTitle,
      description: desc,
      siteName: siteConfig.name,
    },
    twitter: {
      // images falls back to og:image via Next's metadata pipeline.
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
      site: siteConfig.twitter.site,
      creator: siteConfig.twitter.handle,
    },
    robots: { index: true, follow: true },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: "en",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/models?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.ecosystem,
    url: "https://webmasterid.com",
    sameAs: [siteConfig.url],
    description:
      "WebmasterID builds AI ecosystem intelligence platforms for builders and operators.",
  };
}

export function softwareAppJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    url: siteConfig.url,
    description: siteConfig.description,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}

export function breadcrumbJsonLd(
  items: { name: string; href: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  };
}

export function datasetJsonLd({
  name,
  description,
  path,
  dateModified,
}: {
  name: string;
  description: string;
  path: string;
  dateModified: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name,
    description,
    url: absoluteUrl(path),
    creator: { "@type": "Organization", name: siteConfig.ecosystem },
    dateModified,
    isAccessibleForFree: true,
    license: "https://creativecommons.org/licenses/by/4.0/",
  };
}
