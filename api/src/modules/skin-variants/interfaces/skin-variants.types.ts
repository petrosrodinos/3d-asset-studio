export interface UpsertVariantInput {
  variant: string;
  name?: string;
  prompt?: string;
  negativePrompt?: string;
  imageModel?: string;
}

/** PATCH fields for `PUT .../variants/by-id/:id` (does not change the stable `variant` letter). */
export type UpdateVariantByIdInput = Omit<UpsertVariantInput, "variant">;

export interface CreateVariantInput {
  name?: string;
  /** Optional seed when duplicating settings from another variant (each row stays independent after save). */
  prompt?: string | null;
  negativePrompt?: string | null;
  imageModel?: string | null;
}

