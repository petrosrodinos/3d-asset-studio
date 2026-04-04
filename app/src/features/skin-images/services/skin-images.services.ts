import { apiFetch } from "@/utils/apiClient";
import type {
  DeleteSkinImageParams,
  UploadSkinImageParams,
} from "@/features/skin-images/interfaces/skin-images.interfaces";
import type { SkinImage } from "@/interfaces";

export async function deleteSkinImage({
  figureId,
  skinId,
  variantId,
  imageId,
}: DeleteSkinImageParams): Promise<void> {
  return apiFetch<void>(
    `/api/figures/${figureId}/skins/${skinId}/variants/${variantId}/images/${imageId}`,
    { method: "DELETE" },
  );
}

export async function uploadSkinImage(params: UploadSkinImageParams): Promise<SkinImage> {
  const { figureId, skinId, variantId, file, imageId } = params;
  const form = new FormData();
  form.append("image", file);
  if (imageId) form.append("imageId", imageId);
  return apiFetch<SkinImage>(
    `/api/figures/${figureId}/skins/${skinId}/variants/${variantId}/images`,
    { method: "POST", body: form },
  );
}
