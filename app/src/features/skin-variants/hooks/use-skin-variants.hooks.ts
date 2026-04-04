import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createVariant,
  updateVariant,
  deleteVariant,
  generateAiPrompt,
  generateImage,
} from "@/features/skin-variants/services/skin-variants.services";
import type {
  CreateSkinVariantParams,
  DeleteSkinVariantParams,
  GenerateAiPromptDto,
  GenerateSkinImageParams,
  UpdateSkinVariantParams,
} from "@/features/skin-variants/interfaces/skin-variants.interfaces";

export function useCreateVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ figureId, skinId }: CreateSkinVariantParams) => createVariant(figureId, skinId),
    onSuccess: () => {
      toast.success("Variant created");
      void qc.invalidateQueries({ queryKey: ["figures"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not create variant"),
  });
}

export function useUpdateVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ figureId, skinId, variantCode, dto }: UpdateSkinVariantParams) =>
      updateVariant(figureId, skinId, variantCode, dto),
    onSuccess: () => {
      toast.success("Variant updated");
      void qc.invalidateQueries({ queryKey: ["figures"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not update variant"),
  });
}

export function useDeleteVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ figureId, skinId, variantId }: DeleteSkinVariantParams) =>
      deleteVariant(figureId, skinId, variantId),
    onSuccess: () => {
      toast.success("Variant deleted");
      void qc.invalidateQueries({ queryKey: ["figures"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not delete variant"),
  });
}

export function useGenerateAiPrompt() {
  return useMutation({
    mutationFn: (dto: GenerateAiPromptDto) => generateAiPrompt(dto),
    onSuccess: () => toast.success("AI prompt generated"),
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not generate AI prompt"),
  });
}

export function useGenerateImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ figureId, skinId, variantCode, dto }: GenerateSkinImageParams) =>
      generateImage(figureId, skinId, variantCode, dto),
    onSuccess: () => {
      toast.success("Image generated");
      void qc.invalidateQueries({ queryKey: ["figures"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not generate image"),
  });
}
