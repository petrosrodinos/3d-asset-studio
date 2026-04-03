import { X } from "lucide-react";
import { ModelViewer } from "@/pages/forge/components/model-card/model-viewer";

interface ModelViewerModalProps {
  src: string;
  onClose: () => void;
}

export function ModelViewerModal({ src, onClose }: ModelViewerModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 bg-panel border border-border rounded-xl shadow-2xl w-[600px] max-w-[90vw] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <span className="text-sm font-semibold text-slate-200">3D Preview</span>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-4">
          <ModelViewer src={src} />
        </div>
      </div>
    </div>
  );
}
