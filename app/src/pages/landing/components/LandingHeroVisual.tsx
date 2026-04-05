import { Orbit } from "lucide-react";
import { ModelViewer } from "@/pages/forge/components/model-card/model-viewer";
import { cn } from "@/utils/cn";
import { LANDING_3D_SAMPLES, LANDING_VISUAL_CAPTION } from "@/pages/landing/constants";

export function LandingHeroVisual() {
  const heroSample = LANDING_3D_SAMPLES[0];

  return (
    <div
      className={cn(
        "landing-rise landing-rise-delay-2 relative mx-auto w-full max-w-lg lg:mx-0",
      )}
    >
      <div className="relative aspect-square max-h-[min(380px,68vw)] sm:max-h-[min(440px,52vh)]">
        <div className="landing-grid pointer-events-none absolute inset-0 rounded-2xl opacity-90" />
        <div className="landing-hero-frame absolute inset-0 rounded-2xl border border-border bg-panel/60 backdrop-blur-sm" />
        <div className="absolute left-[4%] right-[4%] top-[4%] bottom-[14%] overflow-hidden rounded-xl border border-accent/25 bg-gradient-to-br from-accent/10 via-transparent to-accent-light/5">
          <ModelViewer
            src={heroSample.src}
            className="h-full rounded-xl"
            viewerClassName="h-full w-full min-h-[180px] bg-surface/90 sm:min-h-[200px]"
          />
        </div>
        <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-surface/90 px-3 py-2 font-mono text-xs text-slate-500">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Orbit className="h-3.5 w-3.5 text-accent-light/80" strokeWidth={1.75} aria-hidden />
            {LANDING_VISUAL_CAPTION}
          </span>
          <span className="tabular-nums text-accent-light/70">GLB</span>
        </div>
      </div>
    </div>
  );
}
