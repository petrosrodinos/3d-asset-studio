import { ModelViewer } from "@/pages/forge/components/model-card/model-viewer";
import { cn } from "@/utils/cn";
import { LANDING_3D_SAMPLES, LANDING_SAMPLES_SECTION } from "@/pages/landing/constants";

export function LandingSampleModels() {
  return (
    <section
      id={LANDING_SAMPLES_SECTION.id}
      className="relative z-10 scroll-mt-20 border-t border-border/60 py-16 sm:py-20"
      aria-labelledby="landing-samples-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2
          id="landing-samples-heading"
          className="font-sans text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl"
        >
          {LANDING_SAMPLES_SECTION.title}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400 sm:text-base">{LANDING_SAMPLES_SECTION.subtitle}</p>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:gap-8">
          {LANDING_3D_SAMPLES.map((sample) => (
            <li
              key={sample.src}
              className={cn(
                "flex flex-col overflow-hidden rounded-xl border border-border/80 bg-panel/40",
                "shadow-inner transition-colors hover:border-accent/25 hover:bg-panel/60",
              )}
            >
              <div className="border-b border-border/60 bg-surface/50 px-4 py-4">
                <h3 className="font-sans text-sm font-semibold leading-snug text-slate-100 sm:text-base">{sample.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm">{sample.description}</p>
              </div>
              <ModelViewer src={sample.src} className="flex-1 rounded-none" viewerClassName="h-[min(420px,55vh)] w-full bg-surface/90 sm:h-[min(480px,50vh)]" />
              <div className="border-t border-border/60 bg-panel/30 px-4 py-4">
                <p className="font-mono text-[0.65rem] font-medium uppercase tracking-wider text-accent-light/80">Prompt used</p>
                <div
                  tabIndex={0}
                  role="region"
                  aria-label="Full generation prompt"
                  className={cn(
                    "mt-2 max-h-36 overflow-y-auto rounded-md border border-border/50 bg-surface/40 px-3 py-2",
                    "outline-none focus-visible:ring-2 focus-visible:ring-accent-light/40 focus-visible:ring-offset-2 focus-visible:ring-offset-panel/40",
                    "[scrollbar-color:rgba(148,163,184,0.35)_transparent] [scrollbar-width:thin]",
                  )}
                >
                  <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">{sample.prompt}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
