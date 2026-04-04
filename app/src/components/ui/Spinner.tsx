import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

interface SpinnerProps {
  className?: string;
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <Loader2 className={cn("animate-spin shrink-0", className)} aria-hidden />
  );
}
