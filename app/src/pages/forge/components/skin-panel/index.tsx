import { useState, useEffect, useRef } from "react";
import { Plus, X } from "lucide-react";
import { VariantPanel } from "@/pages/forge/components/skin-panel/variant-panel";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/utils/cn";
import { apiFetch, jsonInit } from "@/utils/apiClient";
import { useQueryClient } from "@tanstack/react-query";
import type { Skin, SkinVariant } from "@/interfaces";

interface SkinPanelProps {
  skin: Skin;
  figureId: string;
}

export function SkinPanel({ skin, figureId }: SkinPanelProps) {
  const qc = useQueryClient();
  const [activeVariantId, setActiveVariantId] = useState<string | null>(
    skin.variants[0]?.id ?? null,
  );
  const [pendingDelete, setPendingDelete] = useState<SkinVariant | null>(null);
  const [adding, setAdding] = useState(false);
  const autoAddedForSkin = useRef<string | null>(null);

  // Auto-create first variant when a fresh skin with no variants is opened
  useEffect(() => {
    if (skin.variants.length === 0 && autoAddedForSkin.current !== skin.id) {
      autoAddedForSkin.current = skin.id;
      void handleAddVariant();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skin.id]);

  const activeVariant =
    skin.variants.find((v) => v.id === activeVariantId) ?? skin.variants[0] ?? null;

  async function handleAddVariant() {
    if (adding) return;
    setAdding(true);
    try {
      const created = await apiFetch<SkinVariant>(
        `/api/figures/${figureId}/skins/${skin.id}/variants`,
        { method: "POST", ...jsonInit({}) },
      );
      await qc.invalidateQueries({ queryKey: ["figures"] });
      setActiveVariantId(created.id);
    } finally {
      setAdding(false);
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    await apiFetch(`/api/figures/${figureId}/skins/${skin.id}/variants/by-id/${pendingDelete.id}`, {
      method: "DELETE",
    });
    await qc.invalidateQueries({ queryKey: ["figures"] });
    if (activeVariantId === pendingDelete.id) {
      const next = skin.variants.find((v) => v.id !== pendingDelete.id);
      setActiveVariantId(next?.id ?? null);
    }
    setPendingDelete(null);
  }

  if (skin.variants.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3 text-slate-500">
        <p className="text-sm">No variants yet</p>
        <button
          onClick={() => void handleAddVariant()}
          disabled={adding}
          className="text-xs px-3 py-1.5 bg-accent/20 border border-accent/40 text-accent-light rounded hover:bg-accent/30 transition-colors disabled:opacity-50"
        >
          + Add Variant
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Variant tab bar */}
        <div className="flex items-center gap-1 px-3 border-b border-border bg-surface shrink-0 overflow-x-auto">
          {skin.variants.map((v) => (
            <div
              key={v.id}
              className={cn(
                "flex items-center gap-1 border-b-2 transition-colors",
                activeVariant?.id === v.id
                  ? "border-accent text-slate-100"
                  : "border-transparent text-slate-400 hover:text-slate-200",
              )}
            >
              <button
                onClick={() => setActiveVariantId(v.id)}
                className="text-xs px-2 py-1.5 whitespace-nowrap"
              >
                {v.name ?? v.variant}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setPendingDelete(v); }}
                className="text-slate-600 hover:text-red-400 transition-colors pr-1"
                title="Delete variant"
              >
                <X size={10} />
              </button>
            </div>
          ))}
          <button
            onClick={() => void handleAddVariant()}
            disabled={adding}
            className="text-xs px-2 py-1.5 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
          >
            <Plus size={13} />
          </button>
        </div>

        {/* Active variant content */}
        <div className="flex-1 overflow-hidden">
          {activeVariant ? (
            <VariantPanel variant={activeVariant} figureId={figureId} />
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title={`Delete variant "${pendingDelete?.name ?? pendingDelete?.variant}"?`}
        description="All images and models under this variant will be permanently deleted."
        confirmLabel="Delete"
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setPendingDelete(null)}
        danger
      />
    </>
  );
}
