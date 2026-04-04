import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createSkin, updateSkin, deleteSkin } from "@/features/skins/services/skins.services";
import type {
  CreateSkinParams,
  DeleteSkinParams,
  UpdateSkinParams,
} from "@/features/skins/interfaces/skins.interfaces";

export function useCreateSkin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ figureId, name }: CreateSkinParams) => createSkin(figureId, { name }),
    onSuccess: () => {
      toast.success("Skin created");
      void qc.invalidateQueries({ queryKey: ["figures"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not create skin"),
  });
}

export function useUpdateSkin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ figureId, skinId, name }: UpdateSkinParams) => updateSkin(figureId, skinId, { name }),
    onSuccess: () => {
      toast.success("Skin updated");
      void qc.invalidateQueries({ queryKey: ["figures"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not update skin"),
  });
}

export function useDeleteSkin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ figureId, skinId }: DeleteSkinParams) => deleteSkin(figureId, skinId),
    onSuccess: () => {
      toast.success("Skin deleted");
      void qc.invalidateQueries({ queryKey: ["figures"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not delete skin"),
  });
}
