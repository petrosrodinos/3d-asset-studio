import { Box, Orbit } from "lucide-react";
import { cn } from "@/utils/cn";
import { LANDING_VISUAL_CAPTION } from "@/pages/landing/constants";

export function LandingHeroVisual() {
  return (
    <div
      className={cn(
        "landing-rise landing-rise-delay-2 relative mx-auto w-full max-w-lg lg:mx-0",
      )}
      aria-hidden
    >
      <div className="relative aspect-square max-h-[min(420px,70vw)] sm:max-h-[min(480px,55vh)]">
        <div className="landing-grid pointer-events-none absolute inset-0 rounded-2xl opacity-90" />
        <div className="landing-hero-frame absolute inset-0 rounded-2xl border border-border bg-panel/60 backdrop-blur-sm" />
        <div className="absolute inset-[12%] rounded-xl border border-accent/25 bg-gradient-to-br from-accent/10 via-transparent to-accent-light/5" />
        <div className="absolute left-1/2 top-1/2 flex h-[46%] w-[46%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg border border-border/80 bg-surface/80 shadow-inner">
          <Box className="h-14 w-14 text-accent-light/90 sm:h-16 sm:w-16" strokeWidth={1.25} />
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-surface/90 px-3 py-2 font-mono text-xs text-slate-500">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Orbit className="h-3.5 w-3.5 text-accent-light/80" strokeWidth={1.75} />
            {LANDING_VISUAL_CAPTION}
          </span>
          <span className="tabular-nums text-accent-light/70">v0</span>
        </div>
      </div>
    </div>
  );
}
