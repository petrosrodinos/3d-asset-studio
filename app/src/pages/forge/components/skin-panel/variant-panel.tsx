import { useCallback, useEffect, useMemo, useState } from "react";
import { PromptEditor } from "@/pages/forge/components/prompt-editor";
import { ImageGrid } from "@/pages/forge/components/image-grid";
import { canRunPipelineOnImage } from "@/pages/forge/components/image-grid/image-card";
import { ImageUploader } from "@/pages/forge/components/image-uploader";
import { ModelCard } from "@/pages/forge/components/model-card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { usePricingCosts } from "@/features/pricing/hooks/use-pricing.hooks";
import { PRICING_COST_KEYS } from "@/features/pricing/constants/pricing-cost-keys";
import { getFixedCostTokens } from "@/features/pricing/utils/pricing-costs.utils";
import { TokenCostPill } from "@/features/pricing/components/TokenCostPill";
import { useForgeStore } from "@/store/forgeStore";
import { usePipeline } from "@/features/pipeline/hooks/use-pipeline.hooks";
import { useUpdateVariant } from "@/features/skin-variants/hooks/use-skin-variants.hooks";
import { useDeleteSkinImage, useUploadSkinImage } from "@/features/skin-images/hooks/use-skin-images.hooks";
import { useQueryClient } from "@tanstack/react-query";
import type { SkinVariant, SkinImage } from "@/interfaces";

interface VariantPanelProps {
  variant: SkinVariant;
  figureId: string;
  figureType: string;
  figureName: string;
  skinName: string | null;
}

export function VariantPanel({ variant, figureId, figureType, figureName, skinName }: VariantPanelProps) {
  const qc = useQueryClient();
  const { selectedImage, setSelectedImage } = useForgeStore();
  const [name, setName] = useState(variant.name ?? "");
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [meshPickIds, setMeshPickIds] = useState<string[]>([]);
  const [meshRunIds, setMeshRunIds] = useState<string[] | null>(null);

  const { data: pricingCosts } = usePricingCosts();
  const multiviewPipelineCost = useMemo(
    () => getFixedCostTokens(pricingCosts, PRICING_COST_KEYS.PIPELINE_MESH_MULTIVIEW),
    [pricingCosts],
  );
  const singlePipelineCost = useMemo(
    () => getFixedCostTokens(pricingCosts, PRICING_COST_KEYS.PIPELINE_MESH),
    [pricingCosts],
  );
  const toolbarPipelineCost =
    meshPickIds.length >= 2 ? multiviewPipelineCost : singlePipelineCost;

  const updateVariant = useUpdateVariant();
  const deleteSkinImage = useDeleteSkinImage();
  const uploadSkinImage = useUploadSkinImage();

  const { run, running: pipelineRunning } = usePipeline(
    () => {
      setActiveImageId(null);
      setMeshRunIds(null);
      setMeshPickIds([]);
      qc.invalidateQueries({ queryKey: ["figures"] });
    },
    () => {
      setActiveImageId(null);
      setMeshRunIds(null);
    },
    () => {
      qc.invalidateQueries({ queryKey: ["figures"] });
    },
  );

  useEffect(() => {
    setName(variant.name ?? "");
  }, [variant.id]);

  function handleNameBlur() {
    const trimmed = name.trim();
    const current = variant.name ?? "";
    if (trimmed === current) return;
    updateVariant.mutate({
      figureId,
      skinId: variant.skinId,
      variantId: variant.id,
      dto: { name: trimmed || null },
    });
  }

  useEffect(() => {
    const valid = new Set(variant.images.map((i) => i.id));
    setMeshPickIds((prev) => prev.filter((id) => valid.has(id)));
  }, [variant.images]);

  const toggleMeshPick = useCallback((image: SkinImage) => {
    setMeshPickIds((prev) => {
      const i = prev.indexOf(image.id);
      if (i >= 0) return prev.filter((id) => id !== image.id);
      if (prev.length >= 4) return prev;
      return [...prev, image.id];
    });
  }, []);

  const meshToolbarAllowed =
    meshPickIds.length > 0 &&
    meshPickIds.length <= 4 &&
    meshPickIds.every((id) => {
      const img = variant.images.find((x) => x.id === id);
      return img && canRunPipelineOnImage(img);
    });

  function handleRunPipeline(image: SkinImage) {
    setMeshRunIds(null);
    setSelectedImage(image);
    setActiveImageId(image.id);
    void run(variant.id, figureId, [image.id], null);
  }

  function handleRunMeshFromSelection() {
    if (!meshToolbarAllowed || pipelineRunning) return;
    const first = variant.images.find((i) => i.id === meshPickIds[0]);
    if (first) setSelectedImage(first);
    setActiveImageId(meshPickIds[0]);
    setMeshRunIds([...meshPickIds]);
    void run(variant.id, figureId, meshPickIds, null);
  }

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

  const deletingImageId =
    deleteSkinImage.isPending && deleteSkinImage.variables?.imageId
      ? deleteSkinImage.variables.imageId
      : null;

  const activeModels =
    selectedImage?.id && variant.images.find((i) => i.id === selectedImage.id)
      ? variant.images.find((i) => i.id === selectedImage.id)!.models
      : [];

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto px-3 py-4 sm:px-4 sm:py-5">
      <section className="rounded-xl border border-border/80 bg-panel/50 p-4 ring-1 ring-white/5 shadow-sm shadow-black/10">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium uppercase tracking-wider text-slate-500">Variant name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            placeholder={`Variant ${variant.variant}`}
            disabled={updateVariant.isPending}
            className="w-full max-w-md border-b border-transparent bg-transparent py-1 text-sm font-semibold text-slate-100 placeholder:text-slate-600 transition-colors hover:border-border focus:border-accent/50 focus:outline-none"
          />
        </div>
      </section>

      <section className="rounded-xl border border-border/80 bg-panel/40 p-4 ring-1 ring-white/5">
        <div className="mb-3 space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Image generation</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Describe the look you want and generate artwork for this variant. That image becomes the visual base when you build the 3D model below.
          </p>
        </div>
        <PromptEditor
          variant={variant}
          figureId={figureId}
          figureType={figureType}
          figureName={figureName}
          skinName={skinName}
        />
      </section>

      <section className="rounded-xl border border-border/80 bg-panel/40 p-4 ring-1 ring-white/5">
        <div className="mb-3 space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Images</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your uploads and generated images for this variant. Use the checkbox to pick views for one multiview mesh (2–4 images, order matters — Tripo limit). Run 3D on a card meshes that image alone; Build 3D from selection uses every checked view in one mesh.
          </p>
          {variant.images.length > 0 ? (
            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              {toolbarPipelineCost != null ? <TokenCostPill tokens={toolbarPipelineCost} /> : null}
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5"
                disabled={!meshToolbarAllowed || pipelineRunning}
                onClick={handleRunMeshFromSelection}
              >
                {pipelineRunning && meshRunIds != null ? <Spinner className="h-3 w-3" /> : null}
                Build 3D from selection
                {meshPickIds.length > 0 ? ` (${meshPickIds.length})` : ""}
              </Button>
            </div>
          ) : null}
          {uploadSkinImage.isPending ? (
            <div
              className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/10 px-3 py-2 text-xs text-accent-light/95"
              role="status"
              aria-live="polite"
            >
              <Spinner className="h-3.5 w-3.5" />
              <span>Uploading image…</span>
            </div>
          ) : null}
        </div>
        <ImageUploader
          onFile={handleUploadFile}
          disabled={uploadSkinImage.isPending}
          isUploading={uploadSkinImage.isPending}
        />
        <div className="mt-3">
          {variant.images.length > 0 ? (
            <ImageGrid
              images={variant.images}
              activeImageId={activeImageId}
              onRunPipeline={handleRunPipeline}
              onDelete={handleDeleteImage}
              deletingImageId={deletingImageId}
              meshPickIds={meshPickIds}
              onToggleMeshPick={toggleMeshPick}
              runningImageIds={meshRunIds}
            />
          ) : (
            <p className="rounded-lg border border-dashed border-border/80 bg-surface/30 px-3 py-6 text-center text-xs text-slate-500">
              Upload or generate to add images to this variant.
            </p>
          )}
        </div>
      </section>

      {activeModels.length > 0 && (
        <section className="rounded-xl border border-border/80 bg-panel/40 p-4 ring-1 ring-white/5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">3D models</p>
          <div className="flex flex-col gap-3">
            {activeModels.map((m) => (
              <ModelCard key={m.id} model={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
