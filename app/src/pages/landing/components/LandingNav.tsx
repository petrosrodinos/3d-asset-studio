import { Link, useLocation } from "react-router-dom";
import { cn } from "@/utils/cn";
import { LANDING_BRAND } from "@/pages/landing/constants";

export function LandingNav() {
  const path = useLocation().pathname;

  return (
    <header className="relative z-10 border-b border-border/80 bg-panel/40 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to="/"
          className="font-sans text-sm font-semibold tracking-tight text-accent-light transition-colors hover:text-slate-100"
        >
          {LANDING_BRAND}
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Marketing">
          <Link
            to="/pricing"
            className="rounded-md px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
          >
            Pricing
          </Link>
          <Link
            to="/login"
            className={cn(
              "rounded-md px-3 py-1.5 text-xs transition-colors",
              path === "/login"
                ? "border border-accent/45 bg-accent/15 font-medium text-accent-light"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
            )}
          >
            Log in
          </Link>
          <Link
            to="/register"
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
              path === "/register"
                ? "border-accent/60 bg-accent/20 text-accent-light shadow-[0_0_0_1px_rgba(124,58,237,0.25)]"
                : "border-accent/45 bg-accent/10 text-accent-light hover:bg-accent/20",
            )}
          >
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}
