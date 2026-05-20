import { citation } from "@/lib/verified";
import type { SourceCitation } from "@/lib/types";

/**
 * Centralised registry of primary-source citations used across the data
 * layer. Adding a citation here is the only sanctioned way to mark a
 * value as verified.
 *
 * Rules:
 *   1. Primary sources only (official vendor documentation, primary
 *      vendor sites, regulatory filings, public datasets).
 *   2. retrievedAt is an ISO-8601 datetime stamped during the manual
 *      review (see VERIFICATION.md).
 *   3. Once a citation is added, edits must be reviewed.
 */

export const anthropicModelsOverview: SourceCitation = citation({
  url: "https://platform.claude.com/docs/en/docs/about-claude/models/overview",
  name: "Anthropic — Models overview",
  type: "official-vendor-docs",
  retrievedAt: "2026-05-20T00:00:00.000Z",
  notes:
    "Anthropic's models overview page (legacy section), including the Claude Opus 4 row.",
});

export const anthropicPricing: SourceCitation = citation({
  url: "https://platform.claude.com/docs/en/about-claude/pricing",
  name: "Anthropic — Pricing",
  type: "official-vendor-pricing",
  retrievedAt: "2026-05-20T00:00:00.000Z",
  notes:
    "Anthropic's pricing reference (model pricing, prompt caching multipliers, batch API pricing).",
});
