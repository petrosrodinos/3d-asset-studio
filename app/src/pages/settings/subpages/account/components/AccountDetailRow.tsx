import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface AccountDetailRowProps {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
}

export function AccountDetailRow({ icon: Icon, label, children }: AccountDetailRowProps) {
  return (
    <div className="flex gap-4 p-5 sm:p-6 sm:items-start">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface/80 text-accent-light ring-1 ring-border">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
        <div className="text-sm text-slate-200">{children}</div>
      </div>
    </div>
  );
}
