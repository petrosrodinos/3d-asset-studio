import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth.hooks";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/utils/cn";
import {
  LANDING_BRAND,
  LANDING_NAV_ANCHORS,
  LANDING_NAV_DASHBOARD,
} from "@/pages/landing/constants";

export function LandingNav() {
  const path = useLocation().pathname;
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [path]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const linkClassMobile = "rounded-lg px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-slate-100";
  const linkClassDesktop = "rounded-md px-2 py-1.5 text-xs text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200 sm:px-3";

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-panel/80 backdrop-blur-md supports-[backdrop-filter]:bg-panel/65">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
        <Link
          to="/"
          className="min-w-0 shrink-0 font-sans text-sm font-semibold tracking-tight text-accent-light transition-colors hover:text-slate-100"
          onClick={closeMobile}
        >
          {LANDING_BRAND}
        </Link>

        <nav className="hidden items-center justify-end gap-1 md:flex md:gap-2" aria-label="Marketing">
          {path === "/" &&
            LANDING_NAV_ANCHORS.map((item) => (
              <a key={item.href} href={item.href} className={linkClassDesktop}>
                {item.label}
              </a>
            ))}
          <Link
            to="/pricing"
            className="rounded-md px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
          >
            Pricing
          </Link>
          {loading ? (
            <div className="flex h-9 min-w-[5.5rem] items-center justify-center px-2" aria-busy="true" aria-label="Loading account">
              <Spinner className="h-4 w-4 text-slate-500" />
            </div>
          ) : user ? (
            <Link
              to="/forge"
              className={cn(
                "rounded-md border border-accent/45 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent-light transition-colors",
                "hover:bg-accent/20",
                path === "/forge" && "active-mode-btn border-accent/45",
              )}
            >
              {LANDING_NAV_DASHBOARD}
            </Link>
          ) : (
            <>
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
                    ? "active-mode-btn border-accent/60 text-accent-light"
                    : "border-accent/45 bg-accent/10 text-accent-light hover:bg-accent/20",
                )}
              >
                Sign up
              </Link>
            </>
          )}
        </nav>

        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200 md:hidden"
          aria-expanded={mobileOpen}
          aria-controls="landing-nav-mobile"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? <X className="h-5 w-5" strokeWidth={1.75} aria-hidden /> : <Menu className="h-5 w-5" strokeWidth={1.75} aria-hidden />}
        </button>
      </div>

      <div
        id="landing-nav-mobile"
        className={cn(
          "max-h-[min(70vh,calc(100dvh-3.5rem))] overflow-y-auto border-t border-border/60 bg-panel/95 backdrop-blur-lg md:hidden",
          !mobileOpen && "hidden",
        )}
      >
        <nav className="flex flex-col gap-0.5 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]" aria-label="Marketing mobile">
          {path === "/" &&
            LANDING_NAV_ANCHORS.map((item) => (
              <a key={item.href} href={item.href} className={linkClassMobile} onClick={closeMobile}>
                {item.label}
              </a>
            ))}
          <Link to="/pricing" className={linkClassMobile} onClick={closeMobile}>
            Pricing
          </Link>
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-500" aria-busy="true">
              <Spinner className="h-4 w-4" />
              <span>Loading…</span>
            </div>
          ) : user ? (
            <Link
              to="/forge"
              className={cn(
                linkClassMobile,
                "border border-accent/35 bg-accent/10 font-medium text-accent-light",
                path === "/forge" && "border-accent/50 bg-accent/15",
              )}
              onClick={closeMobile}
            >
              {LANDING_NAV_DASHBOARD}
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className={cn(
                  linkClassMobile,
                  path === "/login" && "border border-accent/45 bg-accent/10 font-medium text-accent-light",
                )}
                onClick={closeMobile}
              >
                Log in
              </Link>
              <Link
                to="/register"
                className={cn(
                  linkClassMobile,
                  "border border-accent/45 bg-accent/15 font-medium text-accent-light",
                  path === "/register" && "bg-accent/20",
                )}
                onClick={closeMobile}
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
