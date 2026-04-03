import type { CreateVariantInput, UpsertVariantInput } from "./interfaces/skin-variants.types";
import {
  getVariant as getVariantRepo,
  upsertVariant as upsertVariantRepo,
  createVariant as createVariantRepo,
  deleteVariantById as deleteVariantByIdRepo,
} from "./repositories/skin-variants.repository";
import { getAiml } from "../../services";
import * as skinImageSvc from "../skin-images/skin-images.service";
import { IMAGES_CONFIG } from "../images/config/images.config";

export async function upsertVariant(skinId: string, input: UpsertVariantInput) {
  return upsertVariantRepo(skinId, input);
}

export async function getVariant(skinId: string, variant: string) {
  return getVariantRepo(skinId, variant);
}

export async function createVariant(skinId: string, input: CreateVariantInput) {
  return createVariantRepo(skinId, input);
}

export async function deleteVariantById(id: string) {
  return deleteVariantByIdRepo(id);
}

export async function generateImageForVariant(
  skinId: string,
  variant: string,
  figureId: string,
  overrides: { prompt?: string; model?: string; negativePrompt?: string } = {},
) {
  const v = await getVariantRepo(skinId, variant);
  if (!v) throw new Error("Variant not found");

  const model = overrides.model ?? v.imageModel ?? IMAGES_CONFIG.DEFAULT_AIML_IMAGE_MODEL;
  const prompt = (overrides.prompt ?? v.prompt ?? "").trim();
  const neg = (overrides.negativePrompt ?? v.negativePrompt ?? "").trim();

  if (!prompt) throw new Error("Prompt is required to generate an image");

  const finalPrompt = neg ? `${prompt}\n\nNegative prompt: ${neg}` : prompt;
  const generated = await getAiml().generateImage({ model, prompt: finalPrompt });

  const first = generated.data?.[0];
  const imageUrl =
    first?.url ??
    (first?.b64_json ? `data:image/png;base64,${first.b64_json}` : null);

  if (!imageUrl) throw new Error("No image returned from generation");

  const savedImage = await skinImageSvc.createSkinImage(v.id, figureId, imageUrl);
  return { imageUrl, skinImageId: savedImage.id };
}
