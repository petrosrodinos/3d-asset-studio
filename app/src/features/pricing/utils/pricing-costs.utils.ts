import type { PricingCostsDto } from "@/features/pricing/interfaces/pricing-costs.interfaces";

export function getFixedCostTokens(data: PricingCostsDto | undefined, key: string): number | undefined {
  if (!data) return undefined;
  const item = data.byKey[key];
  return item?.kind === "fixed" ? item.tokens : undefined;
}
