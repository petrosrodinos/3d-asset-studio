import type { LucideIcon } from "lucide-react";

interface BillingEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function BillingEmptyState({ icon: Icon, title, description }: BillingEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-border/80 bg-surface/40 px-6 py-14 text-center ring-1 ring-white/5">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent-light ring-1 ring-accent/20">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <p className="text-sm font-medium text-slate-200">{title}</p>
      <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">{description}</p>
    </div>
  );
}
