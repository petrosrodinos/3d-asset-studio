/** Context forwarded to POST /api/figures/ai-variant */
export interface GenerateAiPromptContext {
  figureName?: string;
  figureType?: string;
  skinName?: string;
  existingModel?: string | null;
  existingPrompt?: string | null;
  existingNegPrompt?: string | null;
  otherVariantPrompt?: string | null;
}

export interface GenerateAiPromptDto {
  description: string;
  /** Saved display name when set; otherwise a stable fallback such as "Variant A" */
  variant: string;
  context?: GenerateAiPromptContext;
}

export interface GenerateAiPromptResponse {
  prompt: string;
  negativePrompt?: string;
  model?: string;
}

export interface UpdateSkinVariantDto {
  name?: string | null;
  prompt?: string;
  negativePrompt?: string;
  imageModel?: string;
}

export interface GenerateSkinImageDto {
  /** Required unless `fromSketch` (server builds mesh-ready prompts) */
  prompt?: string;
  negativePrompt?: string;
  model?: string;
  /** Base64 data URL (`data:image/...;base64,...`) for image-to-image models */
  sourceImageDataUrl?: string;
  /** Optional source image upscale preset, e.g. `64x64`. */
  upscalePreset?: string;
  /** Sketch → img2i with curated 3D/mesh prompts; requires `sourceImageDataUrl` */
  fromSketch?: boolean;
  sketchHint?: string;
  figureType?: string;
}

export interface GenerateSkinImageResponse {
  imageUrl: string;
  skinImageId: string;
}

export interface CreateSkinVariantParams {
  figureId: string;
  skinId: string;
  name?: string;
  /** If set, new variant starts with these values (typically copied from the active variant). */
  prompt?: string | null;
  negativePrompt?: string | null;
  imageModel?: string | null;
}

export interface UpdateSkinVariantParams {
  figureId: string;
  skinId: string;
  variantId: string;
  dto: UpdateSkinVariantDto;
}

export interface DeleteSkinVariantParams {
  figureId: string;
  skinId: string;
  variantId: string;
}

export interface GenerateSkinImageParams {
  figureId: string;
  skinId: string;
  variantCode: string;
  dto: GenerateSkinImageDto;
}
