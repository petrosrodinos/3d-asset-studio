import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

export interface PaginationProps {
  /** 1-based current page */
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
  /** Accessible name for the navigation landmark */
  ariaLabel?: string;
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  disabled = false,
  className,
  ariaLabel = "Pagination",
}: PaginationProps) {
  if (totalItems <= 0) return null;

  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const from = (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, totalItems);

  return (
    <nav
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border/80 pt-4",
        className,
      )}
      aria-label={ariaLabel}
    >
      <p className="text-sm text-slate-500">
        Showing{" "}
        <span className="font-mono tabular-nums text-slate-400">{from}</span>
        {" – "}
        <span className="font-mono tabular-nums text-slate-400">{to}</span>
        {" of "}
        <span className="font-mono tabular-nums text-slate-400">{totalItems}</span>
      </p>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 tabular-nums sm:mr-1">
          Page {safePage} / {pageCount}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="min-w-9 px-2"
          disabled={disabled || safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="min-w-9 px-2"
          disabled={disabled || safePage >= pageCount}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </nav>
  );
}
