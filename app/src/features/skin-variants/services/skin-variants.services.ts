import { apiFetch, jsonInit } from "@/utils/apiClient";
import type { SkinVariant } from "@/interfaces";
import type {
  CreateSkinVariantParams,
  GenerateAiPromptDto,
  GenerateAiPromptResponse,
  GenerateSkinImageDto,
  GenerateSkinImageResponse,
  UpdateSkinVariantDto,
} from "@/features/skin-variants/interfaces/skin-variants.interfaces";

export async function createVariant(
  figureId: string,
  skinId: string,
  body: Pick<CreateSkinVariantParams, "prompt" | "negativePrompt" | "imageModel" | "name"> = {},
): Promise<SkinVariant> {
  const { name, prompt, negativePrompt, imageModel } = body;
  const payload: Record<string, unknown> = {};
  if (name !== undefined) payload.name = name;
  if (prompt !== undefined) payload.prompt = prompt;
  if (negativePrompt !== undefined) payload.negativePrompt = negativePrompt;
  if (imageModel !== undefined) payload.imageModel = imageModel;
  return apiFetch<SkinVariant>(`/api/figures/${figureId}/skins/${skinId}/variants`, {
    method: "POST",
    ...jsonInit(payload),
  });
}

export async function updateVariant(
  figureId: string,
  skinId: string,
  variantId: string,
  dto: UpdateSkinVariantDto,
): Promise<SkinVariant> {
  return apiFetch<SkinVariant>(`/api/figures/${figureId}/skins/${skinId}/variants/by-id/${variantId}`, {
    method: "PUT",
    ...jsonInit(dto),
  });
}

export async function deleteVariant(figureId: string, skinId: string, variantId: string): Promise<void> {
  return apiFetch<void>(`/api/figures/${figureId}/skins/${skinId}/variants/by-id/${variantId}`, {
    method: "DELETE",
  });
}

export async function generateAiPrompt(dto: GenerateAiPromptDto): Promise<GenerateAiPromptResponse> {
  return apiFetch("/api/figures/ai-variant", { method: "POST", ...jsonInit(dto) });
}

export async function generateImage(
  figureId: string,
  skinId: string,
  variantCode: string,
  dto: GenerateSkinImageDto,
): Promise<GenerateSkinImageResponse> {
  return apiFetch(`/api/figures/${figureId}/skins/${skinId}/variants/${variantCode}/generate-image`, {
    method: "POST",
    ...jsonInit(dto),
  });
}
