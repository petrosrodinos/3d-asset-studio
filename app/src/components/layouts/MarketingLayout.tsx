import { Outlet } from "react-router-dom";
import { MarketingNav } from "@/components/layouts/MarketingNav";

/** Public marketing routes: same chrome as the landing page (nav + mesh background). */
export function MarketingLayout() {
  return (
    <div className="landing-mesh relative flex min-h-svh flex-col text-slate-200">
      <MarketingNav />
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}
