import { useState } from "react";
import { useForgeStore } from "@/store/forgeStore";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Textarea } from "@/components/ui/Textarea";
import { ImageModelSelect } from "@/features/image-models/components/ImageModelSelect";
import { useGenerateImage } from "@/features/skin-variants/hooks/use-skin-variants.hooks";

export function ImageGenPanel() {
  const { activeFigure, activeVariant } = useForgeStore();
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("");

  const generateImage = useGenerateImage();

  function handleGenerate() {
    if (!activeVariant || !activeFigure) return;
    generateImage.mutate({
      figureId: activeFigure.id,
      skinId: activeVariant.skinId,
      variantCode: activeVariant.variant,
      dto: { prompt, model },
    });
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {!activeVariant && (
        <p className="text-xs text-slate-400">Select a variant to generate images.</p>
      )}

      {activeVariant && (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor="image-gen-model" className="text-xs text-slate-400 font-medium">
              Model
            </label>
            <ImageModelSelect id="image-gen-model" value={model} onChange={setModel} />
          </div>

          <Textarea
            label="Prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Describe the image to generate…"
          />

          <Button onClick={handleGenerate} disabled={generateImage.isPending || !prompt.trim() || !model.trim()}>
            {generateImage.isPending ? <Spinner className="w-3.5 h-3.5" /> : "Generate Image"}
          </Button>

          {generateImage.isError && (
            <p className="text-xs text-red-400">{(generateImage.error as Error).message}</p>
          )}

          {generateImage.isSuccess && generateImage.data && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-green-400">Image generated and linked to variant</p>
              <img
                src={generateImage.data.imageUrl}
                alt="Generated"
                className="w-full aspect-square object-cover rounded-lg border border-border"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
