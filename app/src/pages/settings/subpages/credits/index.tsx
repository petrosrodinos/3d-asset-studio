import { Coins } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/use-auth.hooks";

export default function SettingsCreditsPage() {
  const { user } = useAuth();

  return (
    <div className="p-6 md:p-8 max-w-xl">
      <h1 className="text-lg font-semibold text-slate-100 mb-1">Credits</h1>
      <p className="text-sm text-slate-400 mb-6">Token balance and usage.</p>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-panel px-4 py-3 text-slate-200">
        <Coins className="w-4 h-4 text-accent-light shrink-0" aria-hidden />
        <span className="text-sm">
          <span className="text-slate-400">Balance: </span>
          <span className="font-medium tabular-nums">{user?.tokenBalance ?? 0}</span>
          <span className="text-slate-500"> tokens</span>
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-500">
        Need more?{" "}
        <Link to="/settings/billing" className="text-accent-light hover:underline">
          Go to billing
        </Link>
        .
      </p>
    </div>
  );
}
