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
            <span className="font-medium text-foreground">Live intelligence</span>
            <span className="text-muted-foreground">
              · Last updated {formatDateISO(siteConfig.buildDate)}
            </span>
          </div>

          <h1
            id="hero-heading"
            className="mt-5 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl"
          >
            AI Model Infrastructure{" "}
            <span className="gradient-text">Intelligence.</span>
          </h1>

          <p className="mt-5 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            Track AI models, providers, pricing, benchmarks, and inference
            infrastructure — in real time. Built for builders who treat the
            model stack as critical infrastructure.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/models"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-foreground px-5 text-sm font-semibold text-background shadow-elevated transition hover:bg-foreground/90"
            >
              Explore Models
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/compare"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:bg-card hover:text-primary"
            >
              Compare Models
            </Link>
            <Link
              href="/coverage"
              className="inline-flex h-11 items-center justify-center rounded-xl px-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              View coverage →
            </Link>
          </div>

          <dl className="mt-10 grid max-w-xl grid-cols-3 gap-6">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Coverage
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                Models · Providers · Pricing
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Signals
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                Benchmarks · Infra · Status
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Integrity
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                Verified, timestamped, cited
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
