import { apiFetch } from "@/utils/apiClient";
import type { ImageModel } from "@/features/image-models/interfaces/image-models.interfaces";

export async function fetchImageModels(): Promise<ImageModel[]> {
  return apiFetch<ImageModel[]>("/api/models");
}
