import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFigures } from "@/features/figures/hooks/use-figures.hooks";
import { useForgeStore } from "@/store/forgeStore";
import { FigureList } from "@/pages/forge/components/figure-list";
import { SkinTabs } from "@/pages/forge/components/skin-tabs";
import { SkinPanel } from "@/pages/forge/components/skin-panel";
import { ChatPanel } from "@/pages/forge/components/chat-panel";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch, jsonInit } from "@/utils/apiClient";
import type { Skin } from "@/interfaces";

function ForgeSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Fake tab bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-panel shrink-0">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className={`h-4 ${i === 0 ? "w-12" : i === 1 ? "w-16" : "w-10"}`} />
        ))}
      </div>
      {/* Fake variant tab bar */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-border shrink-0">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 w-16" />
        ))}
      </div>
      {/* Fake content */}
      <div className="flex flex-col gap-5 px-4 py-5">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-7 w-14" />
          <Skeleton className="h-7 w-28" />
        </div>
      </div>
    </div>
  );
}

export default function ForgePage() {
  const { data: figures, isLoading } = useFigures();
  const qc = useQueryClient();
  const {
    activeFigure,
    setActiveFigure,
    activeSkin,
    setActiveSkin,
    syncFigureData,
    chatPanelOpen,
    setChatPanelOpen,
  } = useForgeStore();

  const activeFigureId = activeFigure?.id;
  const activeSkinId = activeSkin?.id;

  const [addSkinOpen, setAddSkinOpen] = useState(false);
  const [newSkinName, setNewSkinName] = useState("");
  const [addingSkin, setAddingSkin] = useState(false);

  // Auto-select first figure on load, or if active figure was deleted
  useEffect(() => {
    if (!figures || figures.length === 0) return;
    const stillExists = activeFigure && figures.some((f) => f.id === activeFigure.id);
    if (!stillExists) {
      setActiveFigure(figures[0]);
      setActiveSkin(figures[0].skins[0] ?? null);
    }
  }, [figures, activeFigure, setActiveFigure, setActiveSkin]);

  // Auto-select first skin when figure changes
  useEffect(() => {
    if (activeFigure && !activeSkin && activeFigure.skins.length > 0) {
      setActiveSkin(activeFigure.skins[0]);
    }
  }, [activeFigure, activeSkin, setActiveSkin]);

  // Keep figure + selected skin in sync with React Query (atomic — no reset flash)
  useEffect(() => {
    if (!figures || !activeFigureId) return;
    const fresh = figures.find((f) => f.id === activeFigureId);
    if (!fresh) return;
    syncFigureData(fresh);
  }, [figures, activeFigureId, syncFigureData]);

  async function handleAddSkin(name: string) {
    if (!activeFigure) return;
    setAddingSkin(true);
    try {
      const skin = await apiFetch<Skin>(`/api/figures/${activeFigure.id}/skins`, {
        method: "POST",
        ...jsonInit({ name: name.trim() || "New Skin" }),
      });
      setActiveSkin(skin);
      await qc.invalidateQueries({ queryKey: ["figures"] });
    } finally {
      setAddingSkin(false);
    }
  }

  async function handleDeleteSkin(skin: Skin) {
    if (!activeFigure) return;
    await apiFetch(`/api/figures/${activeFigure.id}/skins/${skin.id}`, { method: "DELETE" });
    if (activeSkin?.id === skin.id) {
      const next = activeFigure.skins.find((s) => s.id !== skin.id);
      setActiveSkin(next ?? null);
    }
    await qc.invalidateQueries({ queryKey: ["figures"] });
  }

  function openAddSkin() {
    setNewSkinName("");
    setAddSkinOpen(true);
  }

  async function submitAddSkin(e: React.FormEvent) {
    e.preventDefault();
    await handleAddSkin(newSkinName);
    setAddSkinOpen(false);
    setNewSkinName("");
  }

  return (
    <>
      <div className="flex h-full overflow-hidden">
        {/* Left: Figure list */}
        <aside className="w-52 shrink-0 border-r border-border bg-panel overflow-hidden flex flex-col">
          <FigureList />
        </aside>

        {/* Center: Skin editor */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
          {isLoading && !activeFigure ? (
            <ForgeSkeleton />
          ) : activeFigure ? (
            <>
              <SkinTabs
                skins={activeFigure.skins}
                figureId={activeFigure.id}
                onAddSkin={openAddSkin}
                onDeleteSkin={(skin) => void handleDeleteSkin(skin)}
              />
              <div className="flex-1 overflow-hidden">
                {activeFigure.skins.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500">
                    <p className="text-sm">No skins yet — click <strong className="text-slate-300">+</strong> to add one</p>
                    <button
                      onClick={openAddSkin}
                      className="text-xs px-3 py-1.5 bg-accent/20 border border-accent/40 text-accent-light rounded hover:bg-accent/30 transition-colors"
                    >
                      + Add Skin
                    </button>
                  </div>
                ) : activeSkin ? (
                  <SkinPanel skin={activeSkin} figureId={activeFigure.id} />
                ) : null}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-slate-500">
              Select a figure from the left panel to start
            </div>
          )}
        </div>

        {/* Chat toggle button */}
        <button
          onClick={() => setChatPanelOpen(!chatPanelOpen)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-4 h-8 bg-panel border border-border rounded-l text-slate-400 hover:text-slate-200 hover:bg-surface transition-colors"
        >
          {chatPanelOpen ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Right: Chat panel */}
        {chatPanelOpen && (
          <aside className="w-80 shrink-0 border-l border-border bg-panel overflow-hidden flex flex-col">
            <ChatPanel />
          </aside>
        )}
      </div>

      {/* Add Skin modal */}
      {addSkinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setAddSkinOpen(false)} />
          <form
            onSubmit={(e) => void submitAddSkin(e)}
            className="relative z-10 bg-panel border border-border rounded-lg p-5 w-72 flex flex-col gap-4 shadow-xl"
          >
            <p className="text-sm font-semibold text-slate-100">New Skin</p>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Skin name</label>
              <input
                autoFocus
                value={newSkinName}
                onChange={(e) => setNewSkinName(e.target.value)}
                placeholder="Skin name…"
                className="w-full bg-surface border border-border rounded px-3 py-2.5 text-base text-slate-200 placeholder-slate-600 focus:outline-none focus:border-accent/50"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setAddSkinOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={addingSkin}>
                {addingSkin ? "Adding…" : "Add"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
