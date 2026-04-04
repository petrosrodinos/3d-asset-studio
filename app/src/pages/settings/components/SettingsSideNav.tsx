import { NavLink } from "react-router-dom";
import { cn } from "@/utils/cn";
import { SETTINGS_NAV } from "@/pages/settings/constants";

export function SettingsSideNav() {
  return (
    <nav className="flex flex-col gap-0.5 p-3 w-full md:w-52 shrink-0 border-b md:border-b-0 md:border-r border-border bg-panel">
      <p className="px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">
        Settings
      </p>
      {SETTINGS_NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              "text-sm px-3 py-2 rounded-md transition-colors border border-transparent",
              isActive
                ? "bg-surface text-accent-light border-border"
                : "text-slate-400 hover:text-slate-200 hover:bg-surface/80",
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
