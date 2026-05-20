import type { ModelEntity, ProviderEntity } from "./types";
import { siteConfig } from "./site-config";
import { isVerified } from "./verified";

/**
 * Builds a SoftwareApplication JSON-LD payload for a model. Only verified
 * fields are emitted. Unverified metrics are intentionally absent — they
 * must never reach machine-readable surfaces, since search engines and
 * LLMs treat schema.org claims as factual assertions.
 */
export function buildModelJsonLd(
  model: ModelEntity,
  provider: ProviderEntity | undefined
): Record<string, unknown> {
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: model.name,
    applicationCategory: "AIModel",
    operatingSystem: "API",
    description: model.description,
    url: `${siteConfig.url}/models/${model.slug}`,
    dateModified: model.updatedDate ?? undefined,
  };

  if (provider) {
    ld.creator = {
      "@type": "Organization",
      name: provider.name,
      url: provider.website ?? undefined,
    };
  }

  // identifier — only when the verified canonical API ID exists
  if (isVerified(model.apiIdentifiers)) {
    ld.identifier = {
      "@type": "PropertyValue",
      propertyID: "anthropic-api-id",
      value: model.apiIdentifiers.value.canonical,
    };
  }

  // releaseDate / version timing — only when verified
  if (isVerified(model.snapshotDate)) {
    ld.softwareVersion = model.snapshotDate.value;
  }

  // pricing — only emit Offers for verified rates
  const verifiedInput = model.pricing.find(
    (t) => t.unit === "1M input tokens" && isVerified(t.amount)
  );
  const verifiedOutput = model.pricing.find(
    (t) => t.unit === "1M output tokens" && isVerified(t.amount)
  );
  if (
    verifiedInput &&
    isVerified(verifiedInput.amount) &&
    verifiedOutput &&
    isVerified(verifiedOutput.amount)
  ) {
    ld.offers = [
      {
        "@type": "Offer",
        name: "Input tokens (per 1M)",
        priceCurrency: "USD",
        price: String(verifiedInput.amount.value),
        eligibleQuantity: {
          "@type": "QuantitativeValue",
          value: 1_000_000,
          unitText: "tokens",
        },
      },
      {
        "@type": "Offer",
        name: "Output tokens (per 1M)",
        priceCurrency: "USD",
        price: String(verifiedOutput.amount.value),
        eligibleQuantity: {
          "@type": "QuantitativeValue",
          value: 1_000_000,
          unitText: "tokens",
        },
      },
    ];
  }

  // featureList — only verified features become schema claims
  if (isVerified(model.features)) {
    const list: string[] = [];
    if (model.features.value.extendedThinking) list.push("Extended thinking");
    if (model.features.value.priorityTier) list.push("Priority Tier");
    if (model.features.value.toolUse) list.push("Tool use");
    if (list.length) ld.featureList = list;
  }

  // lifecycle — emit as accessMode-style extension only when verified
  if (isVerified(model.lifecycle) && model.lifecycle.value.status === "deprecated") {
    ld.disambiguatingDescription = `Deprecated; retires ${model.lifecycle.value.retirementDate ?? "TBD"}.`;
  }

  // citation — anchor the JSON-LD to its primary source
  if (model.citations.length) {
    ld.citation = model.citations.map((c) => c.url);
  }

  return ld;
}
