import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/site-config";
import pkg from "../../../package.json";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function resolveEnvironment(): "production" | "preview" | "development" | "unknown" {
  const vercel = process.env.VERCEL_ENV;
  if (vercel === "production" || vercel === "preview" || vercel === "development") {
    return vercel;
  }
  if (process.env.NODE_ENV === "production") return "production";
  if (process.env.NODE_ENV === "development") return "development";
  return "unknown";
}

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: siteConfig.name,
      domain: siteConfig.domain,
      version: pkg.version,
      environment: resolveEnvironment(),
      updatedDate: siteConfig.buildDate,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
