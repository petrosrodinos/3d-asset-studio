import { getAiml } from "../../services";
import { IMAGES_CONFIG } from "./config/images.config";
import { ImageModels } from "../../config/models/image-models";
import type { ListedImageModelDto } from "./images.types";

export function listImageModels(): ListedImageModelDto[] {
  return ImageModels.filter((m) => m.available).map((m) => ({
    id: m.id,
    label: m.name,
    provider: m.provider,
    tokens: m.tokens,
    isImageToImage: m.is_image_to_image,
  }));
}

export async function generateImage(input: {
  prompt: string;
  model?: string;
  size?: string;
  n?: number;
  steps?: number;
}) {
  return getAiml().generateImage({
    model: input.model ?? IMAGES_CONFIG.DEFAULT_AIML_IMAGE_MODEL,
    prompt: input.prompt,
    size: input.size,
    n: input.n,
    steps: input.steps,
  });
}

