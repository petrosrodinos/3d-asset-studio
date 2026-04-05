import { Outlet } from "react-router-dom";
import { DashboardNav } from "@/components/layouts/DashboardNav";

export function Shell() {
  return (
    <div className="flex flex-col h-screen bg-surface text-slate-200 overflow-hidden">
      <DashboardNav />
      <main className="min-w-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
