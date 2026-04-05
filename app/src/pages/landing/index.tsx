import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { LandingHeroVisual } from "@/pages/landing/components/LandingHeroVisual";
import { LandingFeatureSections } from "@/pages/landing/components/LandingFeatureSections";
import { LandingFooter } from "@/pages/landing/components/LandingFooter";
import { LandingHead } from "@/pages/landing/components/LandingHead";
import { LandingUseCases } from "@/pages/landing/components/LandingUseCases";
import { LandingHowItWorks } from "@/pages/landing/components/LandingHowItWorks";
import { LandingMidCta } from "@/pages/landing/components/LandingMidCta";
import { LandingTokenPacks } from "@/pages/landing/components/LandingTokenPacks";
import { cn } from "@/utils/cn";
import { LANDING_CTA_PRIMARY, LANDING_HERO_BADGE, LANDING_HERO_SUBTITLE, LANDING_HERO_TITLE, LANDING_SIGN_IN_LINK, LANDING_SIGN_IN_PROMPT } from "@/pages/landing/constants";

export default function LandingPage() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/") return;
    const h = location.hash;
    if (!h || h === "#") return;
    const id = h.slice(1);
    const el = document.getElementById(id);
    if (!el) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }, [location.pathname, location.hash]);

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col text-slate-200">
      <LandingHead />
      <a
        href="#main-content"
        className={cn(
          "sr-only focus-visible:not-sr-only",
          "focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-[100]",
          "focus-visible:rounded-md focus-visible:bg-accent focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:text-white focus-visible:shadow-lg",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
        )}
      >
        Skip to main content
      </a>
      <main id="main-content" tabIndex={-1} className="relative flex min-h-0 flex-1 flex-col pb-24 outline-none">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 top-1/4 h-72 w-72 rounded-full bg-accent/5 blur-3xl" />
          <div className="absolute -right-24 bottom-1/4 h-64 w-64 rounded-full bg-accent-light/5 blur-3xl" />
        </div>
        <section id="hero" className="relative z-10 mx-auto grid w-full min-w-0 max-w-6xl flex-1 scroll-mt-14 items-center gap-10 px-3 py-10 sm:gap-16 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)] lg:items-start lg:gap-14 lg:py-20" aria-labelledby="hero-title">
          <div className="min-w-0 max-w-xl lg:max-w-none">
            <p className={cn("landing-rise font-mono text-xs font-medium uppercase tracking-widest text-accent-light/90")}>{LANDING_HERO_BADGE}</p>
            <h1 id="hero-title" className="landing-rise landing-rise-delay-1 mt-4 font-sans text-3xl font-bold leading-[1.08] tracking-tight text-slate-50 sm:text-4xl sm:leading-[1.06] lg:text-[2.75rem]">
              {LANDING_HERO_TITLE}
            </h1>
            <p className="landing-rise landing-rise-delay-2 mt-5 text-sm leading-relaxed text-slate-400 sm:text-base sm:leading-relaxed">{LANDING_HERO_SUBTITLE}</p>
            <div className="landing-rise landing-rise-delay-3 mt-8 flex flex-wrap items-center gap-3">
              <Link to="/register" className={cn("inline-flex items-center justify-center rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white", "transition-colors hover:bg-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light")}>
                {LANDING_CTA_PRIMARY}
              </Link>
            </div>
            <p className="landing-rise landing-rise-delay-4 mt-6 font-mono text-xs text-slate-600">
              {LANDING_SIGN_IN_PROMPT}{" "}
              <Link to="/login" className="text-accent-light/90 underline-offset-2 hover:underline">
                {LANDING_SIGN_IN_LINK}
              </Link>
            </p>
          </div>
          <div id="samples" className="min-w-0 scroll-mt-14">
            <LandingHeroVisual />
          </div>
        </section>
        <LandingFeatureSections />
        <LandingTokenPacks />
        <LandingUseCases />
        <LandingHowItWorks />
        <LandingMidCta />
      </main>
      <LandingFooter />
    </div>
  );
}
