export interface UpsertVariantInput {
  variant: string;
  name?: string;
  prompt?: string;
  negativePrompt?: string;
  imageModel?: string;
}

export interface CreateVariantInput {
  name?: string;
}

