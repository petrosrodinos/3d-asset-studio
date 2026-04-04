import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth.hooks";
import { cn } from "@/utils/cn";

const MENU_LINKS = [
  { to: "/settings/account", label: "Account" },
  { to: "/settings/credits", label: "Credits" },
  { to: "/settings/billing", label: "Billing" },
] as const;

export function TopBarUserMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  if (!user) return null;

  const displayName = user.displayName ?? user.email ?? "Account";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="User menu"
        className={cn(
          "p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors",
          open && "text-slate-200 bg-white/5",
        )}
      >
        <User size={18} strokeWidth={1.75} aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 min-w-[11rem] rounded-md border border-border bg-panel py-1 shadow-lg z-50"
        >
          <div
            className="px-3 py-2 border-b border-border text-xs font-medium text-slate-200 truncate"
            title={displayName}
          >
            {displayName}
          </div>
          {MENU_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              role="menuitem"
              className="block px-3 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-slate-100"
            >
              {label}
            </Link>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void logout();
            }}
            className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-white/5 hover:text-slate-200 flex items-center gap-2 border-t border-border mt-1"
          >
            <LogOut size={14} aria-hidden />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
