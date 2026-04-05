import { useEffect, useState } from "react";
import { ChevronDown, Clapperboard, Trash2 } from "lucide-react";
import { ModelViewer } from "@/pages/forge/components/model-card/model-viewer";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useDeleteAnimation } from "@/features/animations/hooks/use-animations.hooks";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/Badge";
import { ANIMATION_PRESETS } from "@/utils/constants";
import type { Animation } from "@/interfaces";

interface AnimationListProps {
  model3dId: string;
  animations: Animation[];
}

function animationLabel(key: string) {
  const preset = ANIMATION_PRESETS.find((p) => p.key === key);
  return preset?.label ?? key.replace(/^preset:/, "").replace(/:/g, " · ");
}

export function AnimationList({ animations, model3dId }: AnimationListProps) {
  const [openId, setOpenId] = useState<string | null>(animations[0]?.id ?? null);
  const [pendingDelete, setPendingDelete] = useState<Animation | null>(null);
  const deleteAnim = useDeleteAnimation();

  useEffect(() => {
    if (openId && !animations.some((x) => x.id === openId)) {
      setOpenId(animations[0]?.id ?? null);
    }
  }, [animations, openId]);

  if (animations.length === 0) return null;

  return (
    <>
      <div className="rounded-lg border border-border bg-panel/40 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-surface/60">
          <Clapperboard className="text-accent-light/80 shrink-0" size={14} aria-hidden />
          <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
            Animations
          </span>
          <span className="text-[0.65rem] font-mono tabular-nums text-slate-600">{animations.length}</span>
        </div>
        <ul className="divide-y divide-border/80">
          {animations.map((a) => {
            const expanded = openId === a.id;
            return (
              <li key={a.id}>
                <div
                  className={cn(
                    "flex items-stretch min-h-[2.5rem]",
                    expanded ? "bg-accent/[0.07]" : "hover:bg-white/[0.02]",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpenId((id) => (id === a.id ? null : a.id))}
                    className={cn(
                      "flex flex-1 min-w-0 items-center gap-2 px-3 py-2 text-left transition-colors",
                      !expanded && "hover:bg-white/[0.04]",
                    )}
                    aria-expanded={expanded}
                  >
                    <ChevronDown
                      className={cn(
                        "shrink-0 text-slate-500 transition-transform duration-200",
                        expanded ? "rotate-180" : "rotate-0",
                      )}
                      size={14}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 text-xs font-medium text-slate-200 truncate">
                      {animationLabel(a.animationKey)}
                    </span>
                    <span className="shrink-0 text-[0.6rem] font-mono text-slate-600 truncate max-w-[5.5rem] hidden sm:inline">
                      {a.animationKey}
                    </span>
                    <Badge status={a.status} className="text-[0.6rem] px-1.5 py-px shrink-0" />
                  </button>
                  <button
                    type="button"
                    disabled={deleteAnim.isPending}
                    onClick={() => setPendingDelete(a)}
                    className="shrink-0 px-2.5 py-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 border-l border-border/60"
                    aria-label={`Delete animation ${animationLabel(a.animationKey)}`}
                  >
                    <Trash2 size={14} aria-hidden />
                  </button>
                </div>
                {expanded && (
                  <div className="px-3 pb-3 pt-0 border-t border-border/50 bg-surface/30">
                    {a.error ? (
                      <p className="text-xs text-red-400/90 py-2 leading-relaxed">{a.error}</p>
                    ) : null}
                    {a.gcsGlbUrl ? (
                      <div className="pt-2 rounded-md overflow-hidden border border-border/60 bg-black/20">
                        <ModelViewer src={a.gcsGlbUrl} animationName={a.animationKey} />
                      </div>
                    ) : !a.error ? (
                      <p className="text-xs text-slate-500 py-3 text-center">No preview GLB yet.</p>
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this animation?"
        description={
          pendingDelete
            ? `Remove “${animationLabel(pendingDelete.animationKey)}” and its stored GLB. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (!pendingDelete) return;
          const id = pendingDelete.id;
          setPendingDelete(null);
          deleteAnim.mutate({ model3dId, animationId: id });
        }}
        onCancel={() => setPendingDelete(null)}
        danger
      />
    </>
  );
}
