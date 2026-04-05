export type PricingCostItemFixedDto = {
  kind: "fixed";
  key: string;
  label: string;
  unit: string;
  tokens: number;
};

export type PricingCostItemVariableDto = {
  kind: "variable";
  key: string;
  label: string;
  unit: string;
  catalogRef: "imageModels";
  description?: string;
};

export type PricingCostItemDto = PricingCostItemFixedDto | PricingCostItemVariableDto;

export type PricingCostsDto = {
  version: 1;
  /** Cost entries keyed by the same string as each item’s `key` field. */
  byKey: Record<string, PricingCostItemDto>;
};
