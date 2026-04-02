import fs from "fs/promises";
import { getAiml } from "../../services";
import { IMAGES_CONFIG } from "./config/images.config";

export async function listImageModels() {
  const raw = await fs.readFile(IMAGES_CONFIG.IMAGE_MODELS_PATH, "utf-8");
  return JSON.parse(raw);
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

