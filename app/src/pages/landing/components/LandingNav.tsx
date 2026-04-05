import type { MouseEvent, RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth.hooks";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/utils/cn";
import {
  LANDING_BRAND,
  LANDING_NAV_ANCHORS,
  LANDING_NAV_DASHBOARD,
  PRICING_NAV_PATH,
} from "@/pages/landing/constants";

function useLandingSectionSpy(enabled: boolean, headerRef: RefObject<HTMLElement | null>) {
  const [activeHash, setActiveHash] = useState<string | null>(null);
  const rafRef = useRef<number>(0);

  const updateActive = useCallback(() => {
    if (!enabled) return;
    const header = headerRef.current;
    const headerBottom = header?.getBoundingClientRect().bottom ?? 56;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    // Horizontal "reading line" below the nav — which section contains this Y wins (avoids highlighting the previous section while the next one is already on screen).
    const readingY = Math.min(headerBottom + vh * 0.22, vh * 0.42);

    let next: string | null = null;
    for (const item of LANDING_NAV_ANCHORS) {
      const el = document.getElementById(item.href.slice(1));
      if (!el) continue;
      const { top, bottom } = el.getBoundingClientRect();
      if (top <= readingY && bottom >= readingY) {
        next = item.href;
        break;
      }
    }

    if (next === null) {
      let lastAbove: string | null = null;
      for (const item of LANDING_NAV_ANCHORS) {
        const el = document.getElementById(item.href.slice(1));
        if (!el) continue;
        if (el.getBoundingClientRect().top <= readingY) {
          lastAbove = item.href;
        }
      }
      next = lastAbove;
    }

    setActiveHash((prev) => (prev === next ? prev : next));
  }, [enabled, headerRef]);

  useEffect(() => {
    if (!enabled) {
      setActiveHash(null);
      return;
    }
    updateActive();
    const onScrollOrResize = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateActive);
    };
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(onScrollOrResize)
        : null;
    const el = headerRef.current;
    if (ro && el) ro.observe(el);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      cancelAnimationFrame(rafRef.current);
      ro?.disconnect();
    };
  }, [enabled, headerRef, updateActive]);

  return activeHash;
}

export function LandingNav() {
  const path = useLocation().pathname;
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const activeSectionHash = useLandingSectionSpy(path === "/", headerRef);

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
  const sectionLinkActive =
    "bg-accent/15 font-medium text-accent-light ring-1 ring-accent/30 shadow-[0_0_0_1px_rgba(124,58,237,0.12)]";

  const closeMobile = () => setMobileOpen(false);

  function handlePricingNavClick(e: MouseEvent<HTMLAnchorElement>) {
    closeMobile();
    if (path === "/pricing") {
      e.preventDefault();
      document.getElementById("token-packs")?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", PRICING_NAV_PATH);
    }
  }

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-border/80 bg-panel/80 backdrop-blur-md supports-[backdrop-filter]:bg-panel/65"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
        <Link
          to="/#hero"
          className="min-w-0 shrink-0 font-sans text-sm font-semibold tracking-tight text-accent-light transition-colors hover:text-slate-100"
          onClick={(e) => {
            closeMobile();
            if (path === "/") {
              e.preventDefault();
              document.getElementById("hero")?.scrollIntoView({ behavior: "smooth", block: "start" });
              window.history.replaceState(null, "", "/#hero");
            }
          }}
        >
          {LANDING_BRAND}
        </Link>

        <nav className="hidden items-center justify-end gap-1 md:flex md:gap-2" aria-label="Marketing">
          {path === "/" &&
            LANDING_NAV_ANCHORS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(linkClassDesktop, activeSectionHash === item.href && sectionLinkActive)}
                aria-current={activeSectionHash === item.href ? "location" : undefined}
              >
                {item.label}
              </a>
            ))}
          <Link
            to={PRICING_NAV_PATH}
            className="rounded-md px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
            onClick={handlePricingNavClick}
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
            <div
              className="ml-1 flex items-stretch rounded-lg border border-border/80 bg-surface/50 p-0.5 shadow-sm ring-1 ring-white/[0.06]"
              role="group"
              aria-label="Account"
            >
              <Link
                to="/login"
                className={cn(
                  "flex items-center rounded-md px-3 py-1.5 text-xs transition-colors",
                  path === "/login"
                    ? "bg-accent/15 font-medium text-accent-light ring-1 ring-accent/35"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                )}
              >
                Log in
              </Link>
              <span className="my-1 w-px shrink-0 self-stretch bg-border/70" aria-hidden />
              <Link
                to="/register"
                className={cn(
                  "flex items-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  path === "/register"
                    ? "bg-accent/20 text-accent-light ring-1 ring-accent/45"
                    : "text-accent-light hover:bg-accent/15",
                )}
              >
                Sign up
              </Link>
            </div>
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
              <a
                key={item.href}
                href={item.href}
                className={cn(linkClassMobile, activeSectionHash === item.href && sectionLinkActive)}
                aria-current={activeSectionHash === item.href ? "location" : undefined}
                onClick={closeMobile}
              >
                {item.label}
              </a>
            ))}
          <Link to={PRICING_NAV_PATH} className={linkClassMobile} onClick={handlePricingNavClick}>
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
            <div
              className="mt-2 border-t border-border/50 pt-2"
              role="group"
              aria-label="Account"
            >
              <div className="flex gap-0.5 rounded-xl border border-border/80 bg-surface/50 p-1 ring-1 ring-white/[0.06]">
                <Link
                  to="/login"
                  className={cn(
                    "flex flex-1 items-center justify-center rounded-lg px-3 py-2.5 text-sm transition-colors",
                    path === "/login"
                      ? "bg-accent/15 font-medium text-accent-light ring-1 ring-accent/35"
                      : "text-slate-300 hover:bg-white/5 hover:text-slate-100",
                  )}
                  onClick={closeMobile}
                >
                  Log in
                </Link>
                <span className="my-1.5 w-px shrink-0 self-stretch bg-border/70" aria-hidden />
                <Link
                  to="/register"
                  className={cn(
                    "flex flex-1 items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    path === "/register"
                      ? "bg-accent/20 text-accent-light ring-1 ring-accent/45"
                      : "text-accent-light hover:bg-accent/15",
                  )}
                  onClick={closeMobile}
                >
                  Sign up
                </Link>
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
