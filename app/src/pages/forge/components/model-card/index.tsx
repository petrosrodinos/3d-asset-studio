import { useMemo, useState } from "react";
import { ChevronRight, Download, Maximize2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { OptionsMenu } from "@/components/ui/OptionsMenu";
import { ModelViewer } from "@/pages/forge/components/model-card/model-viewer";
import { ModelViewerModal } from "@/pages/forge/components/model-card/model-viewer-modal";
import { AnimationList } from "@/pages/forge/components/animation-list";
import { AnimationPicker } from "@/pages/forge/components/animation-list/animation-picker";
import { useAnimate } from "@/features/pipeline/hooks/use-animate.hooks";
import { useDeleteModel3d } from "@/features/models3d/hooks/use-models3d.hooks";
import { downloadUrlAsFile, fileExtensionFromUrl } from "@/utils/helpers";
import { cn } from "@/utils/cn";
import type { Model3D } from "@/interfaces";

interface ModelCardProps {
  model: Model3D;
}

export function ModelCard({ model }: ModelCardProps) {
  const [open, setOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedAnimations, setSelectedAnimations] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteModel = useDeleteModel3d();
  const { running, error, run } = useAnimate(() => {});

  const canAnimate = model.status === "success" && !!model.rigTaskId;
  const canShowViewer = model.status === "success" && !!model.gcsPbrModelUrl;
  const isBusy = model.status === "processing" || model.status === "pending";

  const modelUrl = model.gcsPbrModelUrl ?? "";

  const modelMenuItems = useMemo(
    () => [
      {
        id: "extend",
        label: "Extend",
        icon: Maximize2,
        disabled: !canShowViewer,
        onSelect: () => setViewerOpen(true),
      },
      {
        id: "download",
        label: "Download",
        icon: Download,
        disabled: !canShowViewer,
        onSelect: () => {
          const ext = fileExtensionFromUrl(modelUrl) || ".glb";
          void downloadUrlAsFile(modelUrl, `model-${model.id.slice(0, 8)}${ext}`);
        },
      },
      {
        id: "delete",
        label: "Delete",
        icon: Trash2,
        destructive: true,
        onSelect: () => setConfirmDelete(true),
      },
    ],
    [canShowViewer, model.id, modelUrl],
  );

  return (
    <>
      <div className="bg-surface border border-border rounded-lg overflow-hidden flex flex-col">
        <div className="flex items-stretch gap-0">
          <button
            type="button"
            className="flex-1 flex items-center gap-2 min-w-0 p-3 text-left hover:bg-white/[0.03] transition-colors"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            <ChevronRight
              className={cn("shrink-0 text-slate-500 transition-transform duration-200", open && "rotate-90")}
              size={16}
              aria-hidden
            />
            <span className="text-xs text-slate-400 font-mono truncate">{model.id.slice(0, 8)}</span>
            <Badge status={running ? "processing" : model.status} />
          </button>
          <div className="flex items-center pr-2">
            <OptionsMenu
              menuLabel="Model options"
              triggerClassName="px-1.5 py-1 text-slate-500 hover:text-slate-200"
              items={modelMenuItems}
            />
          </div>
        </div>

        {open && (
          <div className="border-t border-border p-3 flex flex-col gap-3">
            {canShowViewer ? (
              <ModelViewer src={model.gcsPbrModelUrl!} />
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[200px] rounded-lg bg-panel border border-border px-4 py-6 gap-1">
                <p className="text-xs text-slate-500 text-center">
                  {isBusy
                    ? "Model is still processing…"
                    : model.error
                      ? model.error
                      : "No 3D preview available yet."}
                </p>
              </div>
            )}

            {canShowViewer && model.error ? (
              <p className="text-xs text-red-400">{model.error}</p>
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
        )}
      </div>

      {viewerOpen && model.gcsPbrModelUrl ? (
        <ModelViewerModal src={model.gcsPbrModelUrl} onClose={() => setViewerOpen(false)} />
      ) : null}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete 3D model?"
        description="This will permanently delete the model and all its animations."
        confirmLabel="Delete"
        onConfirm={() => { setConfirmDelete(false); deleteModel.mutate({ id: model.id }); }}
        onCancel={() => setConfirmDelete(false)}
        danger
      />

    </>
  );
}
