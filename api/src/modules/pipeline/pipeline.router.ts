import { Router } from "express";
import multer from "multer";
import { sseHeaders, sseWrite } from "../../lib/sse";
import { runPipeline } from "./pipeline.service";
import { runRigPipeline } from "./rig.service";
import { TRIPO_CONFIG } from "../tripo/config/tripo.config";
import { PIPELINE_CONFIG } from "./config/pipeline.config";
import { prisma } from "../../integrations/db/client";
import { usageMetadataWithProviderCosts } from "../../lib/provider-costs-metadata";
import {
  getPipelineDebitTokens,
  type PipelineMeshTrippoModelId,
} from "../../config/models/token-operations";
import {
  assertUserHasTokenBalance,
  debitForOperation,
  InsufficientTokensError,
  mergeTokenUsageMetadataByIdempotencyKey,
} from "../tokens/tokens.service";
import { requireTokens } from "../../middleware/requireTokens";
import { animateTokenUsageIdempotencyKey, streamAnimatePipeline } from "./animate-stream";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

const meshUpload = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "images", maxCount: PIPELINE_CONFIG.MAX_MESH_SOURCE_VIEWS },
]);

type PipelineRasterView = {
  buffer: Buffer;
  filename: string;
  mimeType: "image/png" | "image/jpeg";
};

function dedupeSkinImageIdsPreserveOrder(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function parseImageIdsFromBody(body: Record<string, unknown>): string[] | null {
  const raw = body.imageIds;
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
        const ids = parsed.map((s) => s.trim()).filter(Boolean);
        if (ids.length > 0) return dedupeSkinImageIdsPreserveOrder(ids);
      }
    } catch {
      /* ignore invalid JSON */
    }
  }
  const one = body.imageId;
  if (typeof one === "string" && one.trim()) return [one.trim()];
  return null;
}

function viewFromMulterFile(f: Express.Multer.File): PipelineRasterView {
  const mimeType = f.mimetype === "image/jpeg" ? "image/jpeg" : "image/png";
  return {
    buffer: f.buffer,
    filename: f.originalname ?? "upload.png",
    mimeType,
  };
}

// POST /api/pipeline/mesh
// Multipart: variantId, figureId; optional modelVersion; one of: single `image`, multiple `images`, `imageId`, or `imageIds` (JSON string array).
router.post("/mesh", meshUpload, async (req, res, next) => {
  const variantId = req.body.variantId as string | undefined;
  const figureId = req.body.figureId as string | undefined;

  if (!variantId || !figureId) {
    return res.status(400).json({ error: "variantId and figureId are required" });
  }

  const figure = await prisma.figure.findFirst({ where: { id: figureId, userId: req.userId } });
  if (!figure) return res.status(404).json({ error: "Figure not found" });

  const variantOk = await prisma.skinVariant.findFirst({
    where: { id: variantId, skin: { figureId } },
    select: { id: true },
  });
  if (!variantOk) return res.status(404).json({ error: "Variant not found" });

  const maxV = PIPELINE_CONFIG.MAX_MESH_SOURCE_VIEWS;
  const body = req.body as Record<string, unknown>;
  const parsedIds = parseImageIdsFromBody(body);

  const filesMap = req.files as Record<string, Express.Multer.File[]> | undefined;
  const singleFile = filesMap?.image?.[0];
  const multiFiles = filesMap?.images ?? [];

  if (singleFile && multiFiles.length > 0) {
    return res.status(400).json({
      error: "Send either a single `image` field or multiple `images` fields — not both.",
    });
  }

  if (parsedIds && (singleFile || multiFiles.length > 0)) {
    return res.status(400).json({
      error: "Do not combine imageId / imageIds with file uploads on this request.",
    });
  }

  let views: PipelineRasterView[];
  let existingPrimarySkinImageId: string | undefined;

  if (parsedIds) {
    if (parsedIds.length > maxV) {
      return res.status(400).json({ error: `At most ${maxV} images per mesh request.` });
    }

    const rows = await prisma.skinImage.findMany({
      where: { id: { in: parsedIds }, variantId },
    });
    if (rows.length !== parsedIds.length) {
      return res.status(404).json({ error: "One or more images were not found for this variant." });
    }

    const byId = new Map(rows.map((r) => [r.id, r]));
    views = [];
    for (const id of parsedIds) {
      const skinImage = byId.get(id)!;
      const url = skinImage.gcsUrl ?? skinImage.sourceUrl;
      if (!url || url.startsWith("upload://")) {
        return res.status(400).json({ error: `Image ${id} is not ready to mesh (missing storage URL).` });
      }
      const fetchRes = await fetch(url);
      if (!fetchRes.ok) return res.status(502).json({ error: "Failed to fetch image from storage" });

      const buffer = Buffer.from(await fetchRes.arrayBuffer());
      const isJpeg = url.match(/\.jpe?g(\?|$)/i);
      const mimeType = isJpeg ? "image/jpeg" : "image/png";
      const filename =
        url.split("/").pop()?.split("?")[0] ?? `image.${mimeType === "image/jpeg" ? "jpg" : "png"}`;
      views.push({ buffer, filename, mimeType });
    }
    existingPrimarySkinImageId = parsedIds[0];
  } else if (singleFile || multiFiles.length > 0) {
    const allFiles = singleFile ? [singleFile] : multiFiles;
    if (allFiles.length > maxV) {
      return res.status(400).json({ error: `At most ${maxV} images per mesh request.` });
    }
    if (singleFile && typeof body.imageId === "string" && body.imageId.trim()) {
      return res.status(400).json({
        error:
          "Do not send imageId with a file here. Upload the file to POST .../variants/:variantId/images, then run mesh with imageId only.",
      });
    }
    if (multiFiles.length > 0 && typeof body.imageId === "string" && body.imageId.trim()) {
      return res.status(400).json({ error: "Do not send imageId when uploading multiple `images` files." });
    }
    views = allFiles.map(viewFromMulterFile);
    existingPrimarySkinImageId = undefined;
  } else {
    return res.status(400).json({
      error: "Provide an image file, multiple `images` files, imageId, or imageIds (JSON array of skin image ids).",
    });
  }

  const meshModelId: PipelineMeshTrippoModelId =
    views.length >= 2 ? "multiview_to_model" : "image_to_model";
  const pipelineDebit = getPipelineDebitTokens(meshModelId);

  const pipelineIdem = `pipeline:${figureId}:${variantId}:${meshModelId}:${
    parsedIds ? parsedIds.join(",") : singleFile ? "upload" : `upload:${views.length}`
  }`;

  const modelVersion = (req.body.modelVersion as string) ?? TRIPO_CONFIG.DEFAULT_TRIPO_MODEL_VERSION;

  try {
    await assertUserHasTokenBalance(req.userId, pipelineDebit);
  } catch (e) {
    if (e instanceof InsufficientTokensError) {
      return res.status(402).json({ error: e.message, required: e.required, balance: e.balance });
    }
    return next(e);
  }

  try {
    await debitForOperation(req.userId, "pipeline", pipelineIdem, undefined, { pipelineMeshModelId: meshModelId });
  } catch (e) {
    if (e instanceof InsufficientTokensError) {
      return res.status(402).json({ error: e.message, required: e.required, balance: e.balance });
    }
    return next(e);
  }

  sseHeaders(res);
  try {
    await runPipeline({
      figureId,
      variantId,
      existingPrimarySkinImageId,
      views,
      modelVersion,
      emitProgress: ({ step, status, data = {} }) => {
        sseWrite(res, PIPELINE_CONFIG.PIPELINE_SSE_EVENTS.PROGRESS, { step, status, ...data });
      },
      emitEvent: (event, data) => {
        sseWrite(res, event, data);
      },
      onMeshTaskCostsMetadata: async (meta) => {
        await mergeTokenUsageMetadataByIdempotencyKey(
          pipelineIdem,
          usageMetadataWithProviderCosts(meta, "trippo"),
        );
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[pipeline/mesh]", msg);
    sseWrite(res, PIPELINE_CONFIG.PIPELINE_SSE_EVENTS.ERROR, { message: msg });
  } finally {
    res.end();
  }
});

// POST /api/pipeline/rig
// Body (JSON): { model3dId }
router.post(
  "/rig",
  (req, res, next) => {
    const model3dId = (req.body as { model3dId?: string }).model3dId;
    if (!model3dId || typeof model3dId !== "string") {
      return res.status(400).json({ error: "model3dId is required" });
    }
    next();
  },
  requireTokens("rig", (req) => {
    const id = (req.body as { model3dId?: string }).model3dId;
    return typeof id === "string" && id ? `rig:${id}` : undefined;
  }),
  async (req, res) => {
    const { model3dId } = req.body as { model3dId: string };
    sseHeaders(res);
    try {
      await runRigPipeline({
        model3dId,
        userId: req.userId,
        emitProgress: ({ step, status, data = {} }) => {
          sseWrite(res, PIPELINE_CONFIG.PIPELINE_SSE_EVENTS.PROGRESS, { step, status, ...data });
        },
        emitEvent: (event, data) => {
          sseWrite(res, event, data);
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[pipeline/rig]", msg);
      sseWrite(res, PIPELINE_CONFIG.PIPELINE_SSE_EVENTS.ERROR, { message: msg });
    } finally {
      res.end();
    }
  },
);

// POST /api/pipeline/animate
// Body (JSON): { model3dId, animations[] }
router.post(
  "/animate",
  (req, res, next) => {
    const { model3dId, animations } = req.body as { model3dId?: string; animations?: string[] };
    if (!model3dId) return res.status(400).json({ error: "model3dId is required" });
    if (!Array.isArray(animations) || animations.length === 0) {
      return res.status(400).json({ error: "animations array is required" });
    }
    next();
  },
  requireTokens("animationRetarget", (req) => {
    const { model3dId, animations } = req.body as { model3dId?: string; animations?: string[] };
    if (typeof model3dId !== "string" || !Array.isArray(animations) || animations.length === 0) {
      return undefined;
    }
    return animateTokenUsageIdempotencyKey(model3dId, animations);
  }),
  async (req, res) => {
    const { model3dId, animations } = req.body as { model3dId: string; animations: string[] };
    const idem = animateTokenUsageIdempotencyKey(model3dId, animations);
    await streamAnimatePipeline(req, res, model3dId, animations, idem);
  },
);

export default router;
