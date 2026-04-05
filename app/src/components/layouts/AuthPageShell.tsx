import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { LandingNav } from "@/pages/landing/components/LandingNav";

interface AuthPageShellProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthPageShell({ title, subtitle, icon: Icon, children, footer }: AuthPageShellProps) {
  return (
    <div className="landing-mesh relative flex min-h-svh flex-col text-slate-200">
      <LandingNav />
      <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-10 sm:py-14">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-accent/12 via-accent/5 to-transparent"
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-35" aria-hidden>
          <div className="landing-grid absolute inset-0" />
        </div>
        <div className="pointer-events-none absolute -left-24 bottom-1/4 h-64 w-64 rounded-full bg-accent/10 blur-3xl" aria-hidden />
        <div className="relative z-10 w-full max-w-md">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-panel ring-1 ring-white/5 shadow-xl shadow-black/30">
            <div
              className="pointer-events-none absolute -right-20 -top-28 h-56 w-56 rounded-full bg-accent/18 blur-3xl"
              aria-hidden
            />
            <header className="relative border-b border-border/80 bg-surface/35 px-6 py-6 sm:px-8 sm:py-7">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-light ring-1 ring-accent/25">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-semibold tracking-tight text-slate-100">{title}</h1>
                  <p className="mt-1 text-sm text-slate-500 leading-relaxed">{subtitle}</p>
                </div>
              </div>
            </header>
            <div className="relative px-6 py-6 sm:px-8 sm:py-7">{children}</div>
            <footer className="relative border-t border-border/80 bg-surface/20 px-6 py-4 text-center sm:px-8">
              <div className="text-sm text-slate-500">{footer}</div>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
