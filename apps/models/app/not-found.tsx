import Link from "next/link";
import { PageShell } from "@/components/PageShell";

export default function NotFound() {
  return (
    <PageShell
      eyebrow="404"
      title="Page not found"
      intro="The page you're looking for doesn't exist in the WebmasterID Models entity graph."
    >
      <div className="card-surface p-6 text-sm text-muted-foreground">
        <p>
          Try the{" "}
          <Link href="/models" className="text-primary hover:underline">
            Models catalogue
          </Link>
          ,{" "}
          <Link href="/providers" className="text-primary hover:underline">
            Providers
          </Link>
          , or{" "}
          <Link href="/compare" className="text-primary hover:underline">
            Comparisons
          </Link>
          .
        </p>
      </div>
    </PageShell>
  );
}
