import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteSkinImage, uploadSkinImage } from "@/features/skin-images/services/skin-images.services";
import type {
  DeleteSkinImageParams,
  UploadSkinImageParams,
} from "@/features/skin-images/interfaces/skin-images.interfaces";

export function useDeleteSkinImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: DeleteSkinImageParams) => deleteSkinImage(params),
    onSuccess: () => {
      toast.success("Skin image removed");
      void qc.invalidateQueries({ queryKey: ["figures"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not remove skin image"),
  });
}

export function useUploadSkinImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: UploadSkinImageParams) => uploadSkinImage(params),
    onSuccess: () => {
      toast.success("Image uploaded");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not upload image"),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["figures"] });
    },
  });
}
