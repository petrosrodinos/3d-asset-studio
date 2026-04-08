import { useState, useEffect, useRef } from "react";
import { LayoutGrid, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { VariantPanel } from "@/pages/forge/components/skin-panel/variant-panel";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/utils/cn";
import { useCreateVariant, useDeleteVariant, useUpdateVariant } from "@/features/skin-variants/hooks/use-skin-variants.hooks";
import type { Skin, SkinVariant } from "@/interfaces";

function variantTabLabel(v: SkinVariant): string {
  return v.name?.trim() ? v.name.trim() : `Variant ${v.variant}`;
}

interface SkinPanelProps {
  skin: Skin;
  figureId: string;
  figureType: string;
  figureName: string;
}

export function SkinPanel({ skin, figureId, figureType, figureName }: SkinPanelProps) {
  const [activeVariantId, setActiveVariantId] = useState<string | null>(
    skin.variants[0]?.id ?? null,
  );
  const [pendingDelete, setPendingDelete] = useState<SkinVariant | null>(null);
  const [variantNameDraft, setVariantNameDraft] = useState("");
  const autoAddedForSkin = useRef<string | null>(null);

  const createVariant = useCreateVariant();
  const deleteVariant = useDeleteVariant();
  const updateVariant = useUpdateVariant();

  useEffect(() => {
    if (skin.variants.length === 0 && autoAddedForSkin.current !== skin.id) {
      autoAddedForSkin.current = skin.id;
      createVariant.mutate(
        { figureId, skinId: skin.id },
        { onSuccess: (created) => setActiveVariantId(created.id) },
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skin.id]);

  const activeVariant =
    skin.variants.find((v) => v.id === activeVariantId) ?? skin.variants[0] ?? null;

  useEffect(() => {
    if (!activeVariant) {
      setVariantNameDraft("");
      return;
    }
    setVariantNameDraft(activeVariant.name ?? "");
  }, [activeVariant?.id]);

  function commitVariantName() {
    if (!activeVariant) return;
    const trimmed = variantNameDraft.trim();
    const current = activeVariant.name ?? "";
    if (trimmed === current) return;
    updateVariant.mutate({
      figureId,
      skinId: skin.id,
      variantId: activeVariant.id,
      dto: { name: trimmed || null },
    });
  }

  function handleAddVariant() {
    const seed =
      activeVariant != null
        ? {
            prompt: activeVariant.prompt,
            negativePrompt: activeVariant.negativePrompt,
            imageModel: activeVariant.imageModel,
          }
        : {};
    createVariant.mutate(
      { figureId, skinId: skin.id, ...seed },
      { onSuccess: (created) => setActiveVariantId(created.id) },
    );
  }

  function handleConfirmDelete() {
    if (!pendingDelete || deleteVariant.isPending) return;
    const deletingId = pendingDelete.id;
    const next = skin.variants.find((v) => v.id !== deletingId);
    deleteVariant.mutate(
      { figureId, skinId: skin.id, variantId: deletingId },
      {
        onSuccess: () => {
          if (activeVariantId === deletingId) setActiveVariantId(next?.id ?? null);
        },
        onSettled: () => setPendingDelete(null),
      },
    );
  }

  if (skin.variants.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-5 px-6 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/12 text-accent-light ring-1 ring-accent/20">
          <LayoutGrid className="h-6 w-6" strokeWidth={1.5} aria-hidden />
        </div>
        <div className="max-w-xs space-y-2">
          <p className="text-sm font-medium text-slate-200">No variants yet</p>
          <p className="text-sm text-slate-500 leading-relaxed">Variants hold prompts and image sets — add one to start generating.</p>
        </div>
        <Button type="button" size="sm" onClick={handleAddVariant} disabled={createVariant.isPending}>
          <Plus size={16} strokeWidth={2} aria-hidden />
          Add variant
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex shrink-0 items-stretch border-b border-border bg-surface/30">
          <div className="flex min-w-0 flex-1 items-end gap-0 overflow-x-auto">
            {skin.variants.map((v) => (
              <div key={v.id} className="group/var flex shrink-0 items-center">
                {activeVariant?.id === v.id ? (
                  <input
                    type="text"
                    value={variantNameDraft}
                    onChange={(e) => setVariantNameDraft(e.target.value)}
                    onBlur={() => commitVariantName()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    disabled={updateVariant.isPending}
                    placeholder={`Variant ${v.variant}`}
                    aria-label="Variant name"
                    className={cn(
                      "-mb-px min-w-[4.5rem] max-w-[11rem] border-b-2 bg-transparent px-2.5 py-2 text-xs text-slate-100 outline-none transition-colors placeholder:text-slate-600",
                      "border-accent-light/90 focus:border-accent-light",
                    )}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveVariantId(v.id)}
                    className={cn(
                      "-mb-px border-b-2 px-2.5 py-2 text-xs whitespace-nowrap transition-colors",
                      "border-transparent text-slate-500 hover:text-slate-300",
                    )}
                  >
                    {variantTabLabel(v)}
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingDelete(v);
                  }}
                  className="mb-px p-0.5 text-slate-600 opacity-40 transition-opacity hover:text-red-400 hover:opacity-100 sm:opacity-0 sm:group-hover/var:opacity-100"
                  title="Delete variant"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddVariant}
            disabled={createVariant.isPending}
            className="shrink-0 px-2 py-2 text-slate-500 hover:text-slate-300 disabled:opacity-40"
            title="Add variant"
            aria-label="Add variant"
          >
            <Plus size={14} strokeWidth={2} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          {activeVariant ? (
            <VariantPanel
              variant={activeVariant}
              figureId={figureId}
              figureType={figureType}
              figureName={figureName}
              skinName={skin.name}
            />
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Delete variant "${pendingDelete?.name ?? pendingDelete?.variant}"?`}
        description="All images and models under this variant will be permanently deleted."
        confirmLabel="Delete"
        confirmLoading={deleteVariant.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
        danger
      />
    </>
  );
}
