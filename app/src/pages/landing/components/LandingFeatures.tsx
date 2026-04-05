import { Cpu, Layers3, Share2 } from "lucide-react";
import { cn } from "@/utils/cn";
import {
  LANDING_FEATURES,
  LANDING_FEATURES_BLURB,
  LANDING_FEATURES_TITLE,
} from "@/pages/landing/constants";

const FEATURE_ICONS = [Layers3, Cpu, Share2] as const;

export function LandingFeatures() {
  return (
    <section
      className="landing-rise landing-rise-delay-3 relative z-10 border-t border-border/60 bg-panel/20 py-16 sm:py-20"
      aria-labelledby="landing-features-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2
          id="landing-features-heading"
          className="font-sans text-lg font-semibold tracking-tight text-slate-100 sm:text-xl"
        >
          {LANDING_FEATURES_TITLE}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">{LANDING_FEATURES_BLURB}</p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-5">
          {LANDING_FEATURES.map((item, i) => {
            const Icon = FEATURE_ICONS[i];
            return (
              <li
                key={item.title}
                className={cn(
                  "group rounded-xl border border-border/80 bg-panel/50 p-5 transition-colors",
                  "hover:border-accent/35 hover:bg-panel/80",
                )}
              >
                <div className="mb-4 inline-flex rounded-lg border border-border bg-surface/80 p-2 text-accent-light transition-colors group-hover:border-accent/30">
                  <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                </div>
                <h3 className="font-sans text-sm font-semibold text-slate-100">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 sm:text-sm">{item.body}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
