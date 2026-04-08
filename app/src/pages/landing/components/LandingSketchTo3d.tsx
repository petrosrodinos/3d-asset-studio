import { Link } from "react-router-dom";
import { PencilLine } from "lucide-react";
import { ModelViewer } from "@/pages/forge/components/model-card/model-viewer";
import { cn } from "@/utils/cn";
import { LANDING_SKETCH_TO_3D, LANDING_CTA_PRIMARY } from "@/pages/landing/constants";

export function LandingSketchTo3d() {
  return (
    <section id={LANDING_SKETCH_TO_3D.id} className="relative z-10 scroll-mt-20 border-t border-border/60 bg-panel/30 py-16 sm:py-20" aria-labelledby="landing-sketch-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-14">
          <div className="min-w-0">
            <p className="font-mono text-xs font-medium uppercase tracking-widest text-accent-light/90">{LANDING_SKETCH_TO_3D.kicker}</p>
            <div className="mt-4 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface/80 text-accent-light" aria-hidden>
                <PencilLine className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h2 id="landing-sketch-heading" className="font-sans text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
                {LANDING_SKETCH_TO_3D.title}
              </h2>
            </div>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">{LANDING_SKETCH_TO_3D.lead}</p>
            <ul className="mt-8 space-y-4">
              {LANDING_SKETCH_TO_3D.bullets.map((b) => (
                <li key={b.title} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-light/80" aria-hidden />
                  <div className="min-w-0">
                    <h3 className="font-sans text-sm font-semibold text-slate-100">{b.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">{b.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link to="/register" className={cn("inline-flex items-center justify-center rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white", "transition-colors hover:bg-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light")}>
                {LANDING_CTA_PRIMARY}
              </Link>
            </div>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-slate-600">{LANDING_SKETCH_TO_3D.keywordsLine}</p>
          </div>

          <div className="min-w-0">
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              {LANDING_SKETCH_TO_3D.steps.map((step) => (
                <figure key={step.src} className="overflow-hidden rounded-xl border border-border/80 bg-surface/40 shadow-sm shadow-black/20">
                  <img src={step.src} alt={step.alt} width={640} height={480} className="aspect-[4/3] w-full object-cover" loading="lazy" decoding="async" />
                  <figcaption className="border-t border-border/60 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-slate-500">{step.caption}</figcaption>
                </figure>
              ))}
              <figure className="overflow-hidden rounded-xl border border-border/80 bg-surface/40 shadow-sm shadow-black/20 sm:col-span-2">
                <span className="sr-only">{LANDING_SKETCH_TO_3D.glb.alt}</span>
                <ModelViewer
                  src={LANDING_SKETCH_TO_3D.glb.src}
                  className="rounded-none border-0 shadow-none"
                  viewerClassName="h-[min(52vw,280px)] w-full bg-slate-950/90 sm:h-[min(42vw,320px)] md:h-[360px]"
                  shadowIntensity="0.85"
                />
                <figcaption className="border-t border-border/60 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                  {LANDING_SKETCH_TO_3D.glb.caption}
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
