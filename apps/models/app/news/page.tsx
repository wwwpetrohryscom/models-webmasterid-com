import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { JsonLd } from "@/components/JsonLd";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "News",
  description:
    "Verified changes across tracked AI models, providers, and infrastructure. Not a news aggregator.",
  path: "/news",
});

export default function NewsPage() {
  return (
    <PageShell
      eyebrow="Change log"
      title="News"
      intro="WebmasterID Models is not an AI news aggregator. This page logs verified changes to tracked entities — model launches, pricing updates, infrastructure shifts — once they have been confirmed against primary sources."
    >
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "News", href: "/news" },
        ])}
      />

      <div className="card-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">
          No verified updates yet
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Verified entries will appear here once the model and provider graph
          has been populated with confirmed source citations. Until then,
          rather than republishing rumours or vendor announcements, this page
          stays empty.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Looking for current state? Browse{" "}
          <Link href="/models" className="text-primary hover:underline">
            Models
          </Link>
          ,{" "}
          <Link href="/providers" className="text-primary hover:underline">
            Providers
          </Link>
          , or{" "}
          <Link href="/pricing" className="text-primary hover:underline">
            Pricing
          </Link>
          .
        </p>
      </div>
    </PageShell>
  );
}
