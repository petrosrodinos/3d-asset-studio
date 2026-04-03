import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ModelViewer } from "@/pages/forge/components/model-card/model-viewer";
import { AnimationList } from "@/pages/forge/components/animation-list";
import { AnimationPicker } from "@/pages/forge/components/animation-list/animation-picker";
import { useAnimate } from "@/features/pipeline/hooks/use-animate.hooks";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/utils/apiClient";
import type { Model3D } from "@/interfaces";

interface ModelCardProps {
  model: Model3D;
}

export function ModelCard({ model }: ModelCardProps) {
  const qc = useQueryClient();
  const [selectedAnimations, setSelectedAnimations] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { running, error, run } = useAnimate(() => {
    qc.invalidateQueries({ queryKey: ["figures"] });
  });

  async function handleDelete() {
    await apiFetch(`/api/models3d/${model.id}`, { method: "DELETE" });
    qc.invalidateQueries({ queryKey: ["figures"] });
  }

  const canAnimate = model.status === "success" && !!model.rigTaskId;

  return (
    <>
      <div className="bg-surface border border-border rounded-lg p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">{model.id.slice(0, 8)}</span>
          <div className="flex items-center gap-1.5">
            <Badge status={running ? "processing" : model.status} />
            <Button
              variant="ghost"
              size="sm"
              className="px-1.5 py-1 text-slate-500 hover:text-red-400 hover:bg-red-400/10"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={12} />
            </Button>
          </div>
        </div>

        {model.error && (
          <p className="text-xs text-red-400">{model.error}</p>
        )}

        {model.status === "processing" || model.status === "pending" ? (
          <Skeleton className="w-full aspect-square" />
        ) : model.gcsPbrModelUrl ? (
          <ModelViewer src={model.gcsPbrModelUrl} />
        ) : null}

        {model.animations.length > 0 && (
          <AnimationList model3dId={model.id} animations={model.animations} />
        )}

        {canAnimate && (
          <div className="flex flex-col gap-2 pt-1 border-t border-border">
            <p className="text-xs text-slate-400 font-medium">Generate animations</p>
            <AnimationPicker selected={selectedAnimations} onChange={setSelectedAnimations} />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <Button
              size="sm"
              disabled={running || selectedAnimations.length === 0}
              onClick={() => void run(model.id, selectedAnimations)}
            >
              {running ? "Generating…" : "Generate"}
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete 3D model?"
        description="This will permanently delete the model and all its animations."
        confirmLabel="Delete"
        onConfirm={() => { setConfirmDelete(false); void handleDelete(); }}
        onCancel={() => setConfirmDelete(false)}
        danger
      />
    </>
  );
}
