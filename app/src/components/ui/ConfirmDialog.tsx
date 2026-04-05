import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Shows a spinner on the confirm button and disables actions while true */
  confirmLoading?: boolean;
  confirmLoadingLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmLoading = false,
  confirmLoadingLabel = "Deleting…",
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => {
          if (!confirmLoading) onCancel();
        }}
      />
      <div className="relative z-10 bg-panel border border-border rounded-lg p-5 w-80 flex flex-col gap-4 shadow-xl">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-slate-100">{title}</p>
          {description && <p className="text-xs text-slate-400">{description}</p>}
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={confirmLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
            disabled={confirmLoading}
            className="min-w-[5.5rem]"
          >
            {confirmLoading ? (
              <>
                <Spinner className="w-3 h-3" />
                {confirmLoadingLabel}
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
