import { useCallback, useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Spinner } from "@/components/ui/Spinner";
import { useGenerateImage } from "@/features/skin-variants/hooks/use-skin-variants.hooks";
import type { SkinVariant } from "@/interfaces";
import { cn } from "@/utils/cn";

const CANVAS_PX = 512;
const STROKE = "#0f172a";
const BG = "#ffffff";

interface SketchToImageModalProps {
  open: boolean;
  onClose: () => void;
  variant: SkinVariant;
  figureId: string;
  figureType: string;
  onImageGenerated?: () => void;
}

export function SketchToImageModal({
  open,
  onClose,
  variant,
  figureId,
  figureType,
  onImageGenerated,
}: SketchToImageModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);
  const [hint, setHint] = useState("");
  const generateImage = useGenerateImage();

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    if (!open) return;
    clearCanvas();
    setHint("");
  }, [open, clearCanvas]);

  function canvasCoords(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const { x, y } = canvasCoords(e);
    lastRef.current = { x, y };
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = STROKE;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const { x, y } = canvasCoords(e);
    const ctx = canvasRef.current?.getContext("2d");
    const last = lastRef.current;
    if (!ctx || !last) return;
    ctx.strokeStyle = STROKE;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastRef.current = { x, y };
  }

  function endStroke(e: React.PointerEvent<HTMLCanvasElement>) {
    if (drawingRef.current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
    drawingRef.current = false;
    lastRef.current = null;
  }

  function handleGenerate() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    generateImage.mutate(
      {
        figureId,
        skinId: variant.skinId,
        variantCode: variant.variant,
        dto: {
          fromSketch: true,
          figureType,
          sketchHint: hint.trim() || undefined,
          sourceImageDataUrl: dataUrl,
        },
      },
      {
        onSuccess: () => {
          onClose();
          onImageGenerated?.();
        },
      },
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Sketch → 3D-ready image" contentClassName="items-stretch w-full">
      <div className="flex w-full max-w-lg flex-col gap-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          Draw your idea below. We send it to the image model with a mesh-focused prompt (front view, clean background)
          and save the result to this variant like a normal generation.
        </p>

        <div className="rounded-xl border border-border/80 bg-surface/50 p-2 ring-1 ring-white/5">
          <canvas
            ref={canvasRef}
            width={CANVAS_PX}
            height={CANVAS_PX}
            className={cn(
              "w-full max-h-[min(56vh,420px)] touch-none rounded-lg border border-border/60 bg-white",
              "aspect-square max-w-full cursor-crosshair",
            )}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
            onPointerLeave={(e) => {
              if (drawingRef.current) endStroke(e);
            }}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={clearCanvas} disabled={generateImage.isPending}>
            Clear
          </Button>
        </div>

        <Textarea
          id="sketch-hint"
          label="Optional notes"
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          rows={2}
          placeholder='e.g. "add a cape", "robot with big shoulders"'
          className="text-xs"
        />

        <div className="flex flex-wrap items-center gap-2 justify-end">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={generateImage.isPending}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleGenerate} disabled={generateImage.isPending} className="gap-1.5">
            {generateImage.isPending ? <Spinner className="h-3.5 w-3.5" /> : <Pencil size={14} />}
            {generateImage.isPending ? "Generating…" : "Generate from sketch"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
