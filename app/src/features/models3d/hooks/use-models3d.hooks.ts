import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteModel3d } from "@/features/models3d/services/models3d.services";
import type { DeleteModel3dParams } from "@/features/models3d/interfaces/models3d.interfaces";

export function useDeleteModel3d() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: DeleteModel3dParams) => deleteModel3d(params),
    onSuccess: () => {
      toast.success("3D model removed");
      void qc.invalidateQueries({ queryKey: ["figures"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not remove 3D model"),
  });
}
