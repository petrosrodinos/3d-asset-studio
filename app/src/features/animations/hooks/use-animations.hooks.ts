import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteAnimation } from "@/features/animations/services/animations.services";

export function useDeleteAnimation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ model3dId, animationId }: { model3dId: string; animationId: string }) =>
      deleteAnimation(model3dId, animationId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["figures"] }),
  });
}
