import { Outlet } from "react-router-dom";
import { SettingsSideNav } from "@/pages/settings/components/SettingsSideNav";

export default function SettingsPage() {
  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      <SettingsSideNav />
      <div className="flex-1 overflow-y-auto min-h-0">
        <Outlet />
      </div>
    </div>
  );
}
