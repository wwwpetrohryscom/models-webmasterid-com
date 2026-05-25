import Link from "next/link";
import { HeroNetworkMap } from "./HeroNetworkMap";
import { siteConfig } from "@/lib/site-config";
import { formatDateISO } from "@/lib/utils";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden border-b border-border"
    >
      <div className="container-page grid items-center gap-10 py-14 md:grid-cols-12 md:py-20">
        <div className="md:col-span-7">
          <div
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground"
            aria-label="Live intelligence status"
          >
            <span
              aria-hidden="true"
              className="relative grid h-2 w-2 place-items-center"
            >
              <span className="absolute inline-flex h-full w-full rounded-full bg-success/60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            <span className="font-medium text-foreground">
              Learn · Apply · Verify
            </span>
            <span className="text-muted-foreground">
              · Build {formatDateISO(siteConfig.buildDate)}
            </span>
          </div>

          <h1
            id="hero-heading"
            className="mt-5 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl"
          >
            Learn how to use{" "}
            <span className="gradient-text">AI models correctly.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            A practical learning platform for choosing, comparing,
            testing, and documenting AI model decisions with verified
            model intelligence.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/start"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-foreground px-5 text-sm font-semibold text-background shadow-elevated transition hover:bg-foreground/90"
            >
              Start here
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:bg-card hover:text-primary"
            >
              See how it works
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <Link
              href="/for"
              className="font-medium text-muted-foreground transition hover:text-foreground"
            >
              Choose a role →
            </Link>
            <Link
              href="/resources"
              className="font-medium text-muted-foreground transition hover:text-foreground"
            >
              Open Resource Finder →
            </Link>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            No model rankings. No fake benchmarks. Source-backed
            workflows. Choose your learning path at your own pace —
            no accounts, no progress tracking.
          </p>

          <dl className="mt-10 grid max-w-xl grid-cols-3 gap-6">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Learn
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                10 lessons · 5 role paths
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Apply
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                8 exercises · Select · Compare · Brief
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Verify
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                Sourced · Timestamped · No rankings
              </dd>
            </div>
          </dl>
        </div>

        <div className="md:col-span-5">
          <HeroNetworkMap />
        </div>
      </div>
    </section>
  );
}
