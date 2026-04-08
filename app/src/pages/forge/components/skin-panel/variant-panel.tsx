import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PromptEditor } from "@/pages/forge/components/prompt-editor";
import { ImageGrid } from "@/pages/forge/components/image-grid";
import { ImageUploader } from "@/pages/forge/components/image-uploader";
import { ModelCard } from "@/pages/forge/components/model-card";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { useForgeStore } from "@/store/forgeStore";
import { useDeleteSkinImage, useUploadSkinImage } from "@/features/skin-images/hooks/use-skin-images.hooks";
import { useModelMesh } from "@/features/models3d/hooks/use-model-mesh.hooks";
import { usePricingCosts } from "@/features/pricing/hooks/use-pricing.hooks";
import { PRICING_COST_KEYS } from "@/features/pricing/constants/pricing-cost-keys";
import { getFixedCostTokens } from "@/features/pricing/utils/pricing-costs.utils";
import { TokenCostPill } from "@/features/pricing/components/TokenCostPill";
import { canGenerateMeshOnImage } from "@/pages/forge/components/image-grid/image-card";
import { cn } from "@/utils/cn";
import type { SkinVariant, SkinImage } from "@/interfaces";

interface VariantPanelProps {
  variant: SkinVariant;
  figureId: string;
  figureType: string;
  figureName: string;
  skinName: string | null;
}

export function VariantPanel({ variant, figureId, figureType, figureName, skinName }: VariantPanelProps) {
  const isDev = import.meta.env.VITE_NODE_ENV === "development";
  const qc = useQueryClient();
  const { selectedImage, setSelectedImage } = useForgeStore();
  const [meshPickIds, setMeshPickIds] = useState<string[]>([]);

  const deleteSkinImage = useDeleteSkinImage();
  const uploadSkinImage = useUploadSkinImage();
  const {
    run: runMesh,
    runMultiview,
    runningImageIds,
    error: meshError,
  } = useModelMesh(() => {
    void qc.invalidateQueries({ queryKey: ["figures"] });
    setMeshPickIds([]);
  });
  const { data: pricingCosts } = usePricingCosts();
  const meshCost = getFixedCostTokens(pricingCosts, PRICING_COST_KEYS.TRIPPO_MESH_STANDALONE);

  useEffect(() => {
    const valid = new Set(variant.images.map((i) => i.id));
    setMeshPickIds((prev) => prev.filter((id) => valid.has(id)));
  }, [variant.images]);

  function handleUploadFile(file: File) {
    uploadSkinImage.mutate({
      figureId,
      skinId: variant.skinId,
      variantId: variant.id,
      file,
    });
  }

  function handleDeleteImage(image: SkinImage) {
    if (deleteSkinImage.isPending) return;
    deleteSkinImage.mutate({
      figureId,
      skinId: variant.skinId,
      variantId: variant.id,
      imageId: image.id,
    });
  }

  function handleGenerate3d(image: SkinImage) {
    setSelectedImage(image);
    void runMesh(image.id);
  }
  function toggleMeshPick(image: SkinImage) {
    setMeshPickIds((prev) => {
      const i = prev.indexOf(image.id);
      if (i >= 0) return prev.filter((id) => id !== image.id);
      if (prev.length >= 4) return prev;
      return [...prev, image.id];
    });
  }
  const meshToolbarAllowed =
    meshPickIds.length >= 2 &&
    meshPickIds.length <= 4 &&
    meshPickIds.every((id) => {
      const img = variant.images.find((x) => x.id === id);
      return img && canGenerateMeshOnImage(img);
    });
  function handleGenerate3dFromSelection() {
    if (!meshToolbarAllowed || runningImageIds.length > 0) return;
    const first = variant.images.find((i) => i.id === meshPickIds[0]);
    if (first) setSelectedImage(first);
    void runMultiview(meshPickIds);
  }

  const deletingImageId = deleteSkinImage.isPending && deleteSkinImage.variables?.imageId ? deleteSkinImage.variables.imageId : null;

  const activeModels = useMemo(() => {
    if (!selectedImage?.id) return [];
    const img = variant.images.find((i) => i.id === selectedImage.id);
    return img?.models ?? [];
  }, [selectedImage?.id, variant.images]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto px-3 py-4 sm:px-4 sm:py-5">
      <div className="flex min-h-0 flex-1 flex-col gap-4 md:grid md:grid-cols-2 md:items-start md:gap-4">
        {/* md+: left column — image generation only */}
        <section className="min-w-0 rounded-xl border border-border/80 bg-panel/40 p-4 ring-1 ring-white/5 md:min-h-0">
          <div className="mb-3 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Image generation</p>
            <p className="text-xs text-slate-500 leading-relaxed">Describe the look you want and generate artwork for this variant.</p>
          </div>
          <PromptEditor variant={variant} figureId={figureId} figureType={figureType} figureName={figureName} skinName={skinName} />
        </section>

        {/* md+: right column — images + 3D models in one stacked card */}
        <div className={cn("flex min-w-0 flex-col gap-4", "md:gap-0 md:rounded-xl md:border md:border-border/80 md:bg-panel/40 md:p-4 md:ring-1 md:ring-white/5 md:min-h-0")}>
          <section className={cn("rounded-xl border border-border/80 bg-panel/40 p-4 ring-1 ring-white/5", "md:rounded-none md:border-0 md:bg-transparent md:p-0 md:ring-0")}>
            <div className="mb-3 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Images</p>
              <p className="text-xs text-slate-500 leading-relaxed">Your uploads and generated images for this variant. Use Generate 3D to create mesh, then rig/animate from the Models section.</p>
            {isDev && variant.images.length > 0 ? (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {meshCost != null ? <TokenCostPill tokens={meshCost} /> : null}
                  <Button variant="secondary" size="sm" className="gap-1.5" disabled={!meshToolbarAllowed || runningImageIds.length > 0} onClick={handleGenerate3dFromSelection}>
                    {runningImageIds.length > 0 && meshPickIds.length >= 2 ? <Spinner className="h-3 w-3" /> : null}
                    Build 3D from selection
                    {meshPickIds.length > 0 ? ` (${meshPickIds.length})` : ""}
                  </Button>
                </div>
              ) : null}
              {meshError ? <p className="text-xs text-red-400">{meshError}</p> : null}
            </div>
            <ImageUploader onFile={handleUploadFile} disabled={uploadSkinImage.isPending} isUploading={uploadSkinImage.isPending} />
            <div className="mt-3">
              {variant.images.length > 0 ? (
                <ImageGrid
                  images={variant.images}
                  onDelete={handleDeleteImage}
                  onGenerate3d={handleGenerate3d}
                  meshPickIds={isDev ? meshPickIds : []}
                  onToggleMeshPick={isDev ? toggleMeshPick : undefined}
                  deletingImageId={deletingImageId}
                  generatingImageIds={runningImageIds}
                />
              ) : (
                <p className="rounded-lg border border-dashed border-border/80 bg-surface/30 px-3 py-6 text-center text-xs text-slate-500">
                  Upload or generate to add images to this variant.
                </p>
              )}
            </div>
          </section>

          {activeModels.length > 0 ? (
            <section className={cn("rounded-xl border border-border/80 bg-panel/40 p-4 ring-1 ring-white/5", "md:rounded-none md:border-none md:bg-transparent md:p-0 md:pt-4 md:ring-0 md:border-t md:border-border/80")}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">3D models</p>
              <div className="flex flex-col gap-3">
                {activeModels.map((m) => (
                  <ModelCard key={m.id} model={m} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
