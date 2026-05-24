import Link from "next/link";
import type { GuidedDemoRoute } from "@/lib/guided-demos";

/**
 * DemoStepStrip — renders the demo's primary route plan as a
 * numbered server-rendered list. Each step links to the live
 * surface and explains what the visitor should inspect there.
 *
 * No client JS. No charting. No fabricated screenshots.
 */
export function DemoStepStrip({
  routes,
  caption,
}: {
  routes: GuidedDemoRoute[];
  caption?: string;
}) {
  if (!routes.length) {
    return null;
  }
  return (
    <ol
      aria-label={caption ?? "Demo workflow steps"}
      className="grid gap-3 md:grid-cols-2 lg:grid-cols-3"
    >
      {routes.map((route, idx) => (
        <li key={route.href}>
          <Link
            href={route.href}
            className="card-surface block h-full p-4 transition hover:border-primary/30 hover:shadow-elevated"
          >
            <p className="text-[10px] uppercase tracking-[0.18em] text-primary">
              Step {idx + 1}
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {route.label}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {route.purpose}
            </p>
            <p className="mt-2 break-all text-[10px] text-muted-foreground">
              {route.href}
            </p>
          </Link>
        </li>
      ))}
    </ol>
  );
}
