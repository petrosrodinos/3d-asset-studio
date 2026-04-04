import type { Request, Response } from "express";
import { generateAndMesh } from "./generate-and-mesh.service";
import { PIPELINE_CONFIG } from "../pipeline/config/pipeline.config";
import { IMAGES_CONFIG } from "../images/config/images.config";
import { debitImageThenTrippoMesh, InsufficientTokensError } from "../tokens/tokens.service";

export async function generateAndMeshController(req: Request, res: Response) {
  try {
    const {
      prompt,
      model,
      size,
      steps,
      n = 1,
      modelVersion,
      meshModelVersion,
      timeoutMs = PIPELINE_CONFIG.DEFAULT_POLL_TIMEOUT_MS,
      idempotencyKey,
    } = req.body as Record<string, unknown>;

    if (typeof prompt !== "string" || !prompt.trim()) {
      res.status(400).json({ error: "prompt is required" });
      return;
    }

    const imageModelId = typeof model === "string" ? model : IMAGES_CONFIG.DEFAULT_AIML_IMAGE_MODEL;
    try {
      await debitImageThenTrippoMesh(
        req.userId,
        imageModelId,
        typeof idempotencyKey === "string" ? idempotencyKey : undefined,
      );
    } catch (err) {
      if (err instanceof InsufficientTokensError) {
        res.status(402).json({ error: err.message, required: err.required, balance: err.balance });
        return;
      }
      const status = (err as Error & { status?: number }).status;
      if (status === 400) {
        res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
        return;
      }
      throw err;
    }

    const result = await generateAndMesh({
      prompt,
      model: typeof model === "string" ? model : undefined,
      size: typeof size === "string" ? size : undefined,
      steps: typeof steps === "number" ? steps : undefined,
      n: typeof n === "number" ? n : undefined,
      modelVersion: typeof modelVersion === "string" ? modelVersion : undefined,
      meshModelVersion: typeof meshModelVersion === "string" ? meshModelVersion : undefined,
      timeoutMs: typeof timeoutMs === "number" ? timeoutMs : undefined,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
}

