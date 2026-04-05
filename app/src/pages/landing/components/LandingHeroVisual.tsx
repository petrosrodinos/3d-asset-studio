import { useEffect, useId, useMemo, useState } from "react";
import { Maximize2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ModelViewer } from "@/pages/forge/components/model-card/model-viewer";
import { cn } from "@/utils/cn";
import type { LandingHeroGlbSlot } from "@/pages/landing/constants";
import { LANDING_HERO_GENERATED_GLBS_BY_TYPE } from "@/pages/landing/constants";

function glbSlotHasUrl(url: string | null | undefined): url is string {
  return typeof url === "string" && url.trim().length > 0;
}

function glbSlotWithUrl(g: LandingHeroGlbSlot): g is LandingHeroGlbSlot & { url: string } {
  return glbSlotHasUrl(g.url);
}

function entryHasAnyGlbUrl(entry: (typeof LANDING_HERO_GENERATED_GLBS_BY_TYPE)[number]): boolean {
  return entry.glbs.some((g) => glbSlotHasUrl(g.url));
}

export function LandingHeroVisual() {
  const baseId = useId();

  const entriesWithGlbs = useMemo(
    () => LANDING_HERO_GENERATED_GLBS_BY_TYPE.filter(entryHasAnyGlbUrl),
    [],
  );

  const [activeType, setActiveType] = useState(() => {
    const first = LANDING_HERO_GENERATED_GLBS_BY_TYPE.find(entryHasAnyGlbUrl);
    return first?.type ?? LANDING_HERO_GENERATED_GLBS_BY_TYPE[0]!.type;
  });

  useEffect(() => {
    if (entriesWithGlbs.length === 0) return;
    if (!entriesWithGlbs.some((e) => e.type === activeType)) {
      setActiveType(entriesWithGlbs[0]!.type);
    }
  }, [entriesWithGlbs, activeType]);

  const [expandedSrc, setExpandedSrc] = useState<string | null>(null);

  const active = useMemo(() => {
    const preferred = entriesWithGlbs.find((e) => e.type === activeType);
    if (preferred) return preferred;
    return entriesWithGlbs[0] ?? LANDING_HERO_GENERATED_GLBS_BY_TYPE[0]!;
  }, [entriesWithGlbs, activeType]);

  const visibleGlbs = useMemo(() => active.glbs.filter(glbSlotWithUrl), [active.glbs]);

  const panelId = `${baseId}-panel`;

  const gridColsClass =
    visibleGlbs.length >= 3
      ? "sm:grid-cols-3"
      : visibleGlbs.length === 2
        ? "sm:grid-cols-2"
        : "grid-cols-1";

  if (entriesWithGlbs.length === 0) {
    return (
      <div
        className={cn(
          "landing-rise landing-rise-delay-2 w-full min-w-0 max-w-[100vw] justify-self-stretch rounded-xl border border-dashed border-border/60 bg-panel/30 p-6 text-center sm:max-w-xl sm:justify-self-center lg:max-w-none lg:justify-self-end",
        )}
      >
        <p className="text-sm text-slate-500">No sample GLBs configured yet. Add files under public and set URLs in landing constants.</p>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "landing-rise landing-rise-delay-2 relative w-full min-w-0 max-w-[100vw] justify-self-stretch sm:max-w-xl sm:justify-self-center lg:max-w-none lg:justify-self-end",
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-br from-panel/90 via-panel/70 to-slate-950/80 sm:rounded-2xl",
            "shadow-[0_0_0_1px_rgba(124,58,237,0.12),0_28px_80px_-32px_rgba(0,0,0,0.85)] backdrop-blur-xl",
          )}
        >
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-accent/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-12 h-40 w-40 rounded-full bg-accent-light/10 blur-3xl" />

          <div className="relative min-w-0 border-b border-border/40 bg-slate-950/40">
            <div
              role="tablist"
              aria-label="Figure type samples"
              className={cn(
                "flex snap-x snap-mandatory gap-1 overflow-x-auto overscroll-x-contain px-1.5 py-2 sm:snap-none sm:px-3 sm:py-2.5",
                "[scrollbar-color:rgba(148,163,184,0.35)_transparent] [scrollbar-width:thin]",
                "-mx-px touch-pan-x",
              )}
            >
              {entriesWithGlbs.map((entry) => {
                const isActive = entry.type === active.type;
                return (
                  <button
                    key={entry.type}
                    type="button"
                    role="tab"
                    id={`${baseId}-tab-${entry.type}`}
                    aria-selected={isActive}
                    aria-controls={panelId}
                    tabIndex={0}
                    onClick={() => setActiveType(entry.type)}
                    className={cn(
                      "snap-start shrink-0 rounded-md border px-2 py-1 text-left text-[10px] font-medium transition-all sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-xs",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light/50",
                      isActive
                        ? "border-accent/45 bg-accent/15 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                        : "border-transparent bg-transparent text-slate-500 hover:border-border/60 hover:bg-white/[0.04] hover:text-slate-300",
                    )}
                  >
                    <span className="block max-w-[6.5rem] truncate sm:max-w-[7.5rem] md:max-w-[9rem]" title={entry.label}>
                      {entry.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-${active.type}`}
            className="relative min-w-0 p-2 sm:p-3 md:p-4"
          >
            {visibleGlbs.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No GLB URLs for this type.</p>
            ) : (
              <div className={cn("grid min-w-0 grid-cols-1 gap-2 sm:gap-3", gridColsClass)}>
                {visibleGlbs.map((g) => (
                  <div
                    key={g.generationIndex}
                    className={cn(
                      "relative mx-auto w-full min-w-0 max-w-[min(100%,20rem)] overflow-hidden rounded-lg border border-border/50 bg-surface/50 sm:mx-0 sm:max-w-none sm:rounded-xl",
                      "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedSrc(g.url)}
                      className={cn(
                        "absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-md sm:right-1.5 sm:top-1.5 sm:h-7 sm:w-7 sm:rounded-lg",
                        "border border-border/70 bg-slate-950/90 text-slate-300 backdrop-blur-sm",
                        "transition-colors hover:border-accent/40 hover:bg-slate-900/95 hover:text-accent-light active:scale-95",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light/50",
                      )}
                      aria-label="Expand 3D model"
                    >
                      <Maximize2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={1.5} aria-hidden />
                    </button>
                    <div
                      className={cn(
                        "relative w-full bg-gradient-to-b from-slate-900/95 to-slate-950",
                        "h-[min(52vw,240px)] min-h-[132px] sm:aspect-square sm:h-auto sm:min-h-[160px] md:min-h-[180px]",
                      )}
                    >
                      <ModelViewer
                        src={g.url}
                        shadowIntensity="0.25"
                        className="h-full rounded-none"
                        viewerClassName="h-full w-full min-h-0 bg-transparent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={expandedSrc !== null}
        onClose={() => setExpandedSrc(null)}
        panelClassName="max-h-[min(100dvh-1rem,900px)] w-[min(100vw-1rem,64rem)] max-w-[calc(100vw-1rem)] sm:max-w-5xl"
        contentClassName="items-stretch p-2 sm:p-4 md:p-5 min-h-0"
      >
        {expandedSrc ? (
          <div className="flex w-full min-w-0 flex-col">
            <ModelViewer
              src={expandedSrc}
              shadowIntensity="0.35"
              className="min-h-0 flex-1 rounded-md sm:rounded-lg"
              viewerClassName="h-[min(58dvh,520px)] w-full min-h-[200px] rounded-md bg-surface/95 sm:h-[min(65dvh,640px)] sm:min-h-[320px] sm:rounded-lg md:min-h-[400px]"
            />
            <p className="mt-2 px-1 text-center font-mono text-[9px] leading-snug text-slate-500 sm:mt-3 sm:text-xs">
              Drag to rotate · Scroll to zoom · Right-click to pan
            </p>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
