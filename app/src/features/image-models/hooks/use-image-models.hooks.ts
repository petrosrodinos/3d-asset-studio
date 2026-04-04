import { useQuery } from "@tanstack/react-query";
import { fetchImageModels } from "@/features/image-models/services/image-models.services";

export function useImageModels() {
  return useQuery({
    queryKey: ["image-models"],
    queryFn: fetchImageModels,
    staleTime: 5 * 60_000,
  });
}
