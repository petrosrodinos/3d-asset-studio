import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createFigure,
  deleteFigure,
  listFigures,
  updateFigure,
} from "@/features/figures/services/figures.services";
import type { CreateFigureDto, UpdateFigureParams } from "@/features/figures/interfaces/figure.interfaces";

export function useFigures() {
  return useQuery({ queryKey: ["figures"], queryFn: listFigures });
}

export function useCreateFigure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateFigureDto) => createFigure(dto),
    onSuccess: () => {
      toast.success("Figure created");
      void qc.invalidateQueries({ queryKey: ["figures"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not create figure"),
  });
}

export function useUpdateFigure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: UpdateFigureParams) => updateFigure(id, dto),
    onSuccess: () => {
      toast.success("Figure updated");
      void qc.invalidateQueries({ queryKey: ["figures"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not update figure"),
  });
}

export function useDeleteFigure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFigure(id),
    onSuccess: () => {
      toast.success("Figure deleted");
      void qc.invalidateQueries({ queryKey: ["figures"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not delete figure"),
  });
}
