import { apiFetch } from "@/utils/apiClient";

export async function deleteAnimation(model3dId: string, animationId: string) {
  return apiFetch<void>(`/api/models3d/${encodeURIComponent(model3dId)}/animations/${encodeURIComponent(animationId)}`, {
    method: "DELETE",
  });
}
