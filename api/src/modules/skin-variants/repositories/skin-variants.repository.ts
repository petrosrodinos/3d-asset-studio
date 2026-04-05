import { prisma } from "../../../integrations/db/client";
import type { CreateVariantInput, UpdateVariantByIdInput, UpsertVariantInput } from "../interfaces/skin-variants.types";

export async function upsertVariant(skinId: string, input: UpsertVariantInput) {
  return prisma.skinVariant.upsert({
    where: { skinId_variant: { skinId, variant: input.variant } },
    update: { name: input.name, prompt: input.prompt, negativePrompt: input.negativePrompt, imageModel: input.imageModel },
    create: {
      skinId,
      variant: input.variant,
      name: input.name,
      prompt: input.prompt,
      negativePrompt: input.negativePrompt,
      imageModel: input.imageModel,
    },
    include: { images: { include: { models: { include: { animations: true } } } } },
  });
}

export async function getVariant(skinId: string, variant: string) {
  return prisma.skinVariant.findUnique({
    where: { skinId_variant: { skinId, variant } },
    include: { images: { include: { models: { include: { animations: true } } } } },
  });
}

export async function updateVariantById(skinId: string, variantId: string, data: UpdateVariantByIdInput) {
  const existing = await prisma.skinVariant.findFirst({
    where: { id: variantId, skinId },
  });
  if (!existing) return null;

  return prisma.skinVariant.update({
    where: { id: variantId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.prompt !== undefined && { prompt: data.prompt }),
      ...(data.negativePrompt !== undefined && { negativePrompt: data.negativePrompt }),
      ...(data.imageModel !== undefined && { imageModel: data.imageModel }),
    },
    include: { images: { include: { models: { include: { animations: true } } } } },
  });
}

export async function createVariant(skinId: string, input: CreateVariantInput) {
  const count = await prisma.skinVariant.count({ where: { skinId } });
  const variant = String.fromCharCode(65 + count); // A, B, C...
  return prisma.skinVariant.create({
    data: {
      skinId,
      variant,
      name: input.name,
      ...(input.prompt !== undefined && { prompt: input.prompt }),
      ...(input.negativePrompt !== undefined && { negativePrompt: input.negativePrompt }),
      ...(input.imageModel !== undefined && { imageModel: input.imageModel }),
    },
    include: { images: { include: { models: { include: { animations: true } } } } },
  });
}

export async function findVariantWithGcsAssets(id: string) {
  return prisma.skinVariant.findUnique({
    where: { id },
    include: { images: { include: { models: { include: { animations: true } } } } },
  });
}

export async function deleteVariantById(id: string) {
  return prisma.skinVariant.delete({ where: { id } });
}

